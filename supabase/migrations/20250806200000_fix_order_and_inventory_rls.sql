-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow kiosquero and admin to manage orders" ON public.orders;
DROP POLICY IF EXISTS "Allow kiosquero and admin to manage inventory_logs" ON public.inventory_logs;

-- Create policy for orders table
CREATE POLICY "Allow kiosquero and admin to manage orders" 
ON public.orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('kiosquero', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('kiosquero', 'admin')
  )
);

-- Create policy for inventory_logs table
CREATE POLICY "Allow kiosquero and admin to manage inventory_logs" 
ON public.inventory_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('kiosquero', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('kiosquero', 'admin')
  )
);

-- Create a function to safely update order status and inventory
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id text,
  p_new_status text,
  p_user_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_record RECORD;
  v_order_item RECORD;
  v_current_stock INTEGER;
BEGIN
  -- Verify user has permission
  IF NOT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = p_user_id::uuid 
    AND raw_user_meta_data->>'role' IN ('kiosquero', 'admin')
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Update the order status
  UPDATE public.orders
  SET 
    status = p_new_status,
    updated_at = NOW(),
    completed_at = CASE WHEN p_new_status = 'entregado' THEN NOW() ELSE completed_at END
  WHERE id = p_order_id
  RETURNING * INTO v_order_record;

  -- If status is 'entregado', update inventory
  IF p_new_status = 'entregado' THEN
    -- Process each item in the order
    FOR v_order_item IN 
      SELECT product_id, quantity 
      FROM public.order_items 
      WHERE order_id = p_order_id
    LOOP
      -- Get current stock
      SELECT COALESCE(stock_quantity, 0) INTO v_current_stock
      FROM public.products
      WHERE id = v_order_item.product_id
      FOR UPDATE; -- Lock the row for update

      -- Insert inventory log
      INSERT INTO public.inventory_logs (
        product_id,
        change_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        reason,
        created_by
      ) VALUES (
        v_order_item.product_id,
        'sale',
        -v_order_item.quantity,
        v_current_stock,
        v_current_stock - v_order_item.quantity,
        'Order ' || p_order_id || ' marked as delivered',
        p_user_id::uuid
      );

      -- Update product stock
      UPDATE public.products
      SET 
        stock_quantity = stock_quantity - v_order_item.quantity,
        updated_at = NOW()
      WHERE id = v_order_item.product_id;
    END LOOP;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_order_status(text, text, text) TO authenticated;

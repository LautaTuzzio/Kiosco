-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for kiosquero and admin" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for kiosquero and admin" ON public.orders;
DROP POLICY IF EXISTS "Enable update for kiosquero and admin" ON public.orders;
DROP POLICY IF EXISTS "Enable delete for kiosquero and admin" ON public.orders;

DROP POLICY IF EXISTS "Enable read access for kiosquero and admin" ON public.inventory_logs;
DROP POLICY IF EXISTS "Enable insert for kiosquero and admin" ON public.inventory_logs;
DROP POLICY IF EXISTS "Enable update for kiosquero and admin" ON public.inventory_logs;
DROP POLICY IF EXISTS "Enable delete for kiosquero and admin" ON public.inventory_logs;

-- Create new policies for orders table
CREATE POLICY "Enable all operations for kiosquero and admin on orders"
ON public.orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('kiosquero', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('kiosquero', 'admin')
  )
);

-- Create new policies for inventory_logs table
CREATE POLICY "Enable all operations for kiosquero and admin on inventory_logs"
ON public.inventory_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('kiosquero', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('kiosquero', 'admin')
  )
);

-- Create or replace the update_order_status function
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id text,
  p_new_status text,
  p_user_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_record RECORD;
  v_order_item RECORD;
  v_current_stock INTEGER;
  v_user_role TEXT;
BEGIN
  -- Verify user has permission
  SELECT raw_user_meta_data->>'role' INTO v_user_role
  FROM auth.users 
  WHERE id = p_user_id::uuid;
  
  IF v_user_role IS NULL OR v_user_role NOT IN ('kiosquero', 'admin') THEN
    RAISE EXCEPTION 'Permission denied: User does not have required role';
  END IF;

  -- Update the order status
  UPDATE public.orders
  SET 
    status = p_new_status::order_status,
    updated_at = NOW(),
    completed_at = CASE WHEN p_new_status = 'entregado' THEN NOW() ELSE completed_at END
  WHERE id = p_order_id
  RETURNING * INTO v_order_record;

  -- If no rows were updated, order doesn't exist
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- If status is 'entregado', update inventory
  IF p_new_status = 'entregado' THEN
    -- Process each item in the order
    FOR v_order_item IN 
      SELECT oi.product_id, oi.quantity, p.name as product_name
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = p_order_id
    LOOP
      -- Get current stock with FOR UPDATE to lock the row
      SELECT COALESCE(stock_quantity, 0) INTO v_current_stock
      FROM public.products
      WHERE id = v_order_item.product_id
      FOR UPDATE;

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
      
      -- Log the update
      RAISE NOTICE 'Updated stock for product % (id: %): % -> %', 
        v_order_item.product_name, 
        v_order_item.product_id,
        v_current_stock,
        (v_current_stock - v_order_item.quantity);
    END LOOP;
  END IF;
  
  -- Log successful update
  RAISE NOTICE 'Successfully updated order % to status %', p_order_id, p_new_status;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Error in update_order_status: %', SQLERRM;
    -- Re-raise the exception
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_order_status(text, text, text) TO authenticated;

-- Create a function to check if user has kiosquero or admin role
CREATE OR REPLACE FUNCTION public.has_kiosquero_or_admin_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('kiosquero', 'admin')
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_kiosquero_or_admin_role() TO authenticated;

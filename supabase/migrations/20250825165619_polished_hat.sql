/*
  # Create inventory management trigger

  1. Functions
    - `update_inventory_on_order()` - Decrements stock when order status changes to 'entregado'
    
  2. Triggers  
    - `trigger_update_inventory_on_order` - Fires on order status updates
    
  3. Security
    - Function is security definer to allow stock updates
*/

-- Function to update inventory when order is delivered
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update inventory when order status changes to 'entregado'
  IF NEW.status = 'entregado' AND OLD.status != 'entregado' THEN
    -- Update stock for each product in the order
    UPDATE products 
    SET stock_quantity = stock_quantity - order_items.quantity,
        updated_at = now()
    FROM order_items 
    WHERE products.id = order_items.product_id 
    AND order_items.order_id = NEW.id;
    
    -- Log inventory changes
    INSERT INTO inventory_logs (
      product_id,
      change_type,
      quantity_change,
      previous_quantity,
      new_quantity,
      reason,
      created_by
    )
    SELECT 
      oi.product_id,
      'sale',
      -oi.quantity,
      p.stock_quantity + oi.quantity,
      p.stock_quantity,
      'Order delivered: ' || NEW.id,
      NEW.user_id
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_inventory_on_order ON orders;
CREATE TRIGGER trigger_update_inventory_on_order
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_order();
-- Fix RLS policies for inventory_logs table

-- 1. Drop the existing policy
DROP POLICY IF EXISTS "Kiosquero and admin can manage inventory logs" ON inventory_logs;

-- 2. Create a new policy that allows users to create inventory log entries for their own orders
CREATE POLICY "Users can create inventory logs for their orders"
  ON inventory_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if the user is creating a log for their own order
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = inventory_logs.order_id 
      AND user_id = auth.uid()
    )
    OR
    -- Or if the user is kiosquero/admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

-- 3. Create a policy for reading inventory logs
CREATE POLICY "Users can read their own inventory logs"
  ON inventory_logs
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if the log is for their own order
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = inventory_logs.order_id 
      AND user_id = auth.uid()
    )
    OR
    -- Or if they're kiosquero/admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

-- 4. Create a policy for kiosquero and admin to manage all inventory logs
CREATE POLICY "Kiosquero and admin can manage all inventory logs"
  ON inventory_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

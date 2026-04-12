/*
  # Complete School Kiosk Database Schema

  1. New Tables
    - `users` - User accounts with roles and profiles
    - `products` - Menu items with inventory and customization options
    - `orders` - Customer orders with status tracking
    - `order_items` - Individual items within orders with customizations
    - `inventory_logs` - Inventory change tracking
    - `analytics_daily` - Daily aggregated analytics data

  2. Security
    - Enable RLS on all tables
    - Role-based access policies for students, kiosquero, and admin
    - Users can only access their own data unless they have elevated permissions

  3. Features
    - Automatic order ID generation (ORD-001, ORD-002, etc.)
    - Inventory tracking with automatic updates on order completion
    - Daily analytics aggregation
    - Comprehensive audit logging

  4. Sample Data
    - 6 demo users across all roles
    - 10 products with realistic stock levels
    - 5 sample orders in various states
    - Historical analytics and inventory logs
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('ciclo_basico', 'ciclo_superior', 'kiosquero', 'admin');
CREATE TYPE order_status AS ENUM ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado');
CREATE TYPE payment_method AS ENUM ('tarjeta', 'mercadopago', 'efectivo');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'ciclo_basico',
  name text NOT NULL,
  phone text,
  address text,
  birth_date date,
  course text,
  emergency_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price integer NOT NULL, -- Price in cents
  description text,
  image_url text,
  is_available boolean DEFAULT true,
  is_customizable boolean DEFAULT false,
  ingredients text[], -- Array of available ingredients
  stock_quantity integer DEFAULT 0,
  min_stock_alert integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY, -- Custom format like ORD-001
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  total_amount integer NOT NULL, -- Amount in cents
  scheduled_time text NOT NULL, -- Break time like "11:55"
  payment_method payment_method NOT NULL,
  status order_status DEFAULT 'pendiente',
  user_cycle user_role,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price integer NOT NULL, -- Price at time of order
  customizations jsonb, -- Store ingredient/condiment selections
  created_at timestamptz DEFAULT now()
);

-- Inventory logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  change_type text NOT NULL, -- 'restock', 'sale', 'adjustment', 'waste'
  quantity_change integer NOT NULL, -- Positive for additions, negative for reductions
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  reason text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Daily analytics table
CREATE TABLE IF NOT EXISTS analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  total_orders integer DEFAULT 0,
  total_revenue integer DEFAULT 0, -- In cents
  orders_by_time jsonb, -- {"9:35": 5, "11:55": 12, ...}
  top_products jsonb, -- [{"product_id": "uuid", "quantity": 15}, ...]
  orders_by_status jsonb, -- {"pendiente": 2, "entregado": 18, ...}
  created_at timestamptz DEFAULT now(),
  UNIQUE(date)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin and kiosquero can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'kiosquero')
    )
  );

CREATE POLICY "Admin can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Products policies
CREATE POLICY "Everyone can read available products"
  ON products
  FOR SELECT
  TO authenticated
  USING (is_available = true);

CREATE POLICY "Kiosquero and admin can read all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

CREATE POLICY "Kiosquero and admin can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

-- Orders policies
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Kiosquero and admin can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

CREATE POLICY "Kiosquero and admin can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

-- Order items policies
CREATE POLICY "Users can read own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE id = order_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Kiosquero and admin can read all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

-- Inventory logs policies
CREATE POLICY "Kiosquero and admin can manage inventory logs"
  ON inventory_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

-- Analytics policies
CREATE POLICY "Kiosquero and admin can read analytics"
  ON analytics_daily
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

CREATE POLICY "System can manage analytics"
  ON analytics_daily
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('kiosquero', 'admin')
    )
  );

-- Insert sample users
INSERT INTO users (email, password_hash, role, name, phone, address, birth_date, course, emergency_contact) VALUES
('usuario@ciclobasico.com', 'demo123', 'ciclo_basico', 'Juan Pérez', '+54 9 11 1234-5678', 'Av. Corrientes 1234, CABA', '2008-03-15', '3° Año', 'María Pérez - +54 9 11 8765-4321'),
('usuario@ciclosuperior.com', 'demo123', 'ciclo_superior', 'Ana García', '+54 9 11 2345-6789', 'Av. Santa Fe 5678, CABA', '2006-07-22', '5° Año', 'Carlos García - +54 9 11 9876-5432'),
('usuario@kiosquero.com', 'demo123', 'kiosquero', 'Pedro López', '+54 9 11 3456-7890', 'Calle Falsa 123, CABA', '1985-12-10', NULL, 'Laura López - +54 9 11 5432-1098'),
('usuario@admin.com', 'demo123', 'admin', 'María Rodríguez', '+54 9 11 4567-8901', 'Av. Rivadavia 9876, CABA', '1980-05-18', NULL, 'José Rodríguez - +54 9 11 6543-2109'),
('estudiante1@ciclobasico.com', 'demo123', 'ciclo_basico', 'Lucas Martínez', '+54 9 11 5678-9012', 'Av. Cabildo 2468, CABA', '2008-11-03', '2° Año', 'Sandra Martínez - +54 9 11 7654-3210'),
('estudiante2@ciclosuperior.com', 'demo123', 'ciclo_superior', 'Sofía Fernández', '+54 9 11 6789-0123', 'Av. Las Heras 1357, CABA', '2005-09-14', '6° Año', 'Roberto Fernández - +54 9 11 8765-4321');

-- Insert sample products
INSERT INTO products (name, category, price, description, image_url, is_available, is_customizable, ingredients, stock_quantity) VALUES
('Ensalada Mixta', 'ensaladas', 850, 'Lechuga, tomate, zanahoria, cebolla. Personalizable con tus ingredientes favoritos.', 'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=400', true, true, ARRAY['lechuga', 'tomate', 'zanahoria', 'cebolla', 'pepino', 'apio', 'remolacha'], 25),
('Ensalada Caesar', 'ensaladas', 950, 'Lechuga romana, crutones, queso parmesano, aderezo caesar.', 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400', true, true, ARRAY['lechuga romana', 'crutones', 'queso parmesano', 'pollo'], 20),
('Tostado de Jamón y Queso', 'tostados', 650, 'Pan tostado con jamón cocido y queso derretido.', 'https://images.pexels.com/photos/1647163/pexels-photo-1647163.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL, 30),
('Tostado Completo', 'tostados', 750, 'Jamón, queso, tomate, lechuga y mayonesa.', 'https://images.pexels.com/photos/1647163/pexels-photo-1647163.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL, 25),
('Sándwich de Milanesa', 'sandwiches', 1200, 'Milanesa de pollo, lechuga, tomate y mayonesa en pan árabe.', 'https://images.pexels.com/photos/1647163/pexels-photo-1647163.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL, 15),
('Agua Mineral', 'bebidas', 300, 'Agua mineral sin gas 500ml.', 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL, 50),
('Gaseosa Cola', 'bebidas', 400, 'Gaseosa cola 500ml.', 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL, 40),
('Jugo Natural de Naranja', 'bebidas', 500, 'Jugo de naranja exprimido fresco.', 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL, 20),
('Ensalada de Frutas', 'ensaladas', 700, 'Mix de frutas frescas de estación.', 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL, 18),
('Empanada de Carne', 'empanadas', 450, 'Empanada casera de carne cortada a cuchillo.', 'https://images.pexels.com/photos/4958792/pexels-photo-4958792.jpeg?auto=compress&cs=tinysrgb&w=400', true, false, NULL, 35);

-- Create functions for common operations (needed before inserting orders)
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS text AS $$
DECLARE
  next_num integer;
  order_id text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 5) AS integer)), 0) + 1
  INTO next_num
  FROM orders
  WHERE id LIKE 'ORD-%';
  
  order_id := 'ORD-' || LPAD(next_num::text, 3, '0');
  RETURN order_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample orders
INSERT INTO orders (id, user_id, total_amount, scheduled_time, payment_method, status, user_cycle, created_at) VALUES
('ORD-001', (SELECT id FROM users WHERE email = 'usuario@ciclobasico.com'), 1350, '11:55', 'tarjeta', 'entregado', 'ciclo_basico', now() - interval '2 days'),
('ORD-002', (SELECT id FROM users WHERE email = 'usuario@ciclosuperior.com'), 950, '14:55', 'mercadopago', 'entregado', 'ciclo_superior', now() - interval '1 day'),
('ORD-003', (SELECT id FROM users WHERE email = 'estudiante1@ciclobasico.com'), 1100, '9:35', 'efectivo', 'listo', 'ciclo_basico', now() - interval '2 hours'),
('ORD-004', (SELECT id FROM users WHERE email = 'estudiante2@ciclosuperior.com'), 1650, '17:15', 'tarjeta', 'en_preparacion', 'ciclo_superior', now() - interval '30 minutes'),
('ORD-005', (SELECT id FROM users WHERE email = 'usuario@ciclobasico.com'), 750, '11:55', 'mercadopago', 'pendiente', 'ciclo_basico', now() - interval '10 minutes');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, customizations) VALUES
('ORD-001', (SELECT id FROM products WHERE name = 'Ensalada Mixta'), 1, 850, '{"ingredients": ["lechuga", "tomate", "zanahoria"], "condiments": ["aceite", "vinagre"]}'),
('ORD-001', (SELECT id FROM products WHERE name = 'Agua Mineral'), 1, 300, NULL),
('ORD-001', (SELECT id FROM products WHERE name = 'Empanada de Carne'), 1, 450, NULL),

('ORD-002', (SELECT id FROM products WHERE name = 'Ensalada Caesar'), 1, 950, '{"ingredients": ["lechuga romana", "crutones", "queso parmesano"], "condiments": ["caesar"]}'),

('ORD-003', (SELECT id FROM products WHERE name = 'Tostado Completo'), 1, 750, NULL),
('ORD-003', (SELECT id FROM products WHERE name = 'Jugo Natural de Naranja'), 1, 500, NULL),

('ORD-004', (SELECT id FROM products WHERE name = 'Sándwich de Milanesa'), 1, 1200, NULL),
('ORD-004', (SELECT id FROM products WHERE name = 'Gaseosa Cola'), 1, 400, NULL),
('ORD-004', (SELECT id FROM products WHERE name = 'Empanada de Carne'), 1, 450, NULL),

('ORD-005', (SELECT id FROM products WHERE name = 'Tostado Completo'), 1, 750, NULL);

-- Insert sample inventory logs
INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_quantity, new_quantity, reason, created_by) VALUES
((SELECT id FROM products WHERE name = 'Ensalada Mixta'), 'restock', 30, 20, 50, 'Reposición semanal', (SELECT id FROM users WHERE email = 'usuario@kiosquero.com')),
((SELECT id FROM products WHERE name = 'Agua Mineral'), 'restock', 50, 30, 80, 'Reposición semanal', (SELECT id FROM users WHERE email = 'usuario@kiosquero.com')),
((SELECT id FROM products WHERE name = 'Ensalada Mixta'), 'sale', -1, 50, 49, 'Venta ORD-001', (SELECT id FROM users WHERE email = 'usuario@kiosquero.com')),
((SELECT id FROM products WHERE name = 'Empanada de Carne'), 'waste', -3, 40, 37, 'Productos vencidos', (SELECT id FROM users WHERE email = 'usuario@kiosquero.com'));

-- Insert sample daily analytics using proper JSONB casting
DO $$
DECLARE
  ensalada_mixta_id uuid;
  tostado_completo_id uuid;
  ensalada_caesar_id uuid;
  sandwich_milanesa_id uuid;
BEGIN
  -- Get product IDs
  SELECT id INTO ensalada_mixta_id FROM products WHERE name = 'Ensalada Mixta';
  SELECT id INTO tostado_completo_id FROM products WHERE name = 'Tostado Completo';
  SELECT id INTO ensalada_caesar_id FROM products WHERE name = 'Ensalada Caesar';
  SELECT id INTO sandwich_milanesa_id FROM products WHERE name = 'Sándwich de Milanesa';

  -- Insert analytics data with proper JSONB formatting
  INSERT INTO analytics_daily (date, total_orders, total_revenue, orders_by_time, top_products, orders_by_status) VALUES
  (
    CURRENT_DATE - 2, 
    15, 
    12750, 
    '{"9:35": 3, "11:55": 8, "14:55": 4}'::jsonb,
    jsonb_build_array(
      jsonb_build_object('product_id', ensalada_mixta_id, 'quantity', 8),
      jsonb_build_object('product_id', tostado_completo_id, 'quantity', 6)
    ),
    '{"entregado": 15}'::jsonb
  ),
  (
    CURRENT_DATE - 1, 
    12, 
    9800, 
    '{"9:35": 2, "11:55": 6, "14:55": 3, "17:15": 1}'::jsonb,
    jsonb_build_array(
      jsonb_build_object('product_id', ensalada_caesar_id, 'quantity', 5),
      jsonb_build_object('product_id', sandwich_milanesa_id, 'quantity', 4)
    ),
    '{"entregado": 12}'::jsonb
  ),
  (
    CURRENT_DATE, 
    3, 
    2800, 
    '{"9:35": 1, "11:55": 1, "17:15": 1}'::jsonb,
    jsonb_build_array(
      jsonb_build_object('product_id', tostado_completo_id, 'quantity', 2)
    ),
    '{"pendiente": 1, "en_preparacion": 1, "listo": 1}'::jsonb
  );
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_time ON orders(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);

-- Create trigger to update inventory on order completion
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS trigger AS $$
BEGIN
  -- Only update inventory when order status changes to 'entregado'
  IF NEW.status = 'entregado' AND OLD.status != 'entregado' THEN
    -- Update product stock for each item in the order
    UPDATE products 
    SET stock_quantity = stock_quantity - oi.quantity,
        updated_at = now()
    FROM order_items oi
    WHERE products.id = oi.product_id 
    AND oi.order_id = NEW.id;
    
    -- Log inventory changes
    INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_quantity, new_quantity, reason, created_by)
    SELECT 
      oi.product_id,
      'sale',
      -oi.quantity,
      p.stock_quantity + oi.quantity,
      p.stock_quantity,
      'Order ' || NEW.id || ' completed',
      NEW.user_id
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_on_order
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_order();

-- Create function to update analytics
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS void AS $$
DECLARE
  today_date date := CURRENT_DATE;
  total_orders_count integer;
  total_revenue_amount integer;
  orders_by_time_json jsonb;
  top_products_json jsonb;
  orders_by_status_json jsonb;
BEGIN
  -- Calculate today's metrics
  SELECT COUNT(*), COALESCE(SUM(total_amount), 0)
  INTO total_orders_count, total_revenue_amount
  FROM orders
  WHERE DATE(created_at) = today_date;
  
  -- Orders by time
  SELECT jsonb_object_agg(scheduled_time, order_count)
  INTO orders_by_time_json
  FROM (
    SELECT scheduled_time, COUNT(*) as order_count
    FROM orders
    WHERE DATE(created_at) = today_date
    GROUP BY scheduled_time
  ) t;
  
  -- Top products
  SELECT jsonb_agg(jsonb_build_object('product_id', product_id, 'quantity', total_quantity))
  INTO top_products_json
  FROM (
    SELECT oi.product_id, SUM(oi.quantity) as total_quantity
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE DATE(o.created_at) = today_date
    GROUP BY oi.product_id
    ORDER BY total_quantity DESC
    LIMIT 10
  ) t;
  
  -- Orders by status
  SELECT jsonb_object_agg(status, status_count)
  INTO orders_by_status_json
  FROM (
    SELECT status, COUNT(*) as status_count
    FROM orders
    WHERE DATE(created_at) = today_date
    GROUP BY status
  ) t;
  
  -- Insert or update analytics
  INSERT INTO analytics_daily (date, total_orders, total_revenue, orders_by_time, top_products, orders_by_status)
  VALUES (today_date, total_orders_count, total_revenue_amount, orders_by_time_json, top_products_json, orders_by_status_json)
  ON CONFLICT (date) 
  DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_revenue = EXCLUDED.total_revenue,
    orders_by_time = EXCLUDED.orders_by_time,
    top_products = EXCLUDED.top_products,
    orders_by_status = EXCLUDED.orders_by_status,
    created_at = now();
END;
$$ LANGUAGE plpgsql;
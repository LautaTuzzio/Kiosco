/*
  # Create break times configuration system

  1. New Tables
    - `break_times_config`
      - `id` (uuid, primary key)
      - `cycle` (enum: ciclo_basico, ciclo_superior)
      - `break_time` (text, time like "9:35")
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on break_times_config table
    - Add policy for everyone to read active break times
    - Add policy for admin to manage break times

  3. Default Data
    - Insert default break times for both cycles
*/

-- Create break times configuration table
CREATE TABLE IF NOT EXISTS break_times_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle user_role NOT NULL CHECK (cycle IN ('ciclo_basico', 'ciclo_superior')),
  break_time text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE break_times_config ENABLE ROW LEVEL SECURITY;

-- Policy for everyone to read active break times
CREATE POLICY "Everyone can read active break times"
  ON break_times_config
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy for admin to manage break times
CREATE POLICY "Admin can manage break times"
  ON break_times_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default break times
INSERT INTO break_times_config (cycle, break_time, is_active) VALUES
('ciclo_basico', '9:35', true),
('ciclo_basico', '11:55', true),
('ciclo_basico', '14:55', true),
('ciclo_superior', '11:55', true),
('ciclo_superior', '14:55', true),
('ciclo_superior', '17:15', true),
('ciclo_superior', '19:35', true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_break_times_cycle ON break_times_config(cycle);
CREATE INDEX IF NOT EXISTS idx_break_times_active ON break_times_config(is_active);
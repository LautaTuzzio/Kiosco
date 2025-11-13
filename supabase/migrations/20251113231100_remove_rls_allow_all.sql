/*
  # Remove RLS and Allow All Access
  
  This migration:
  1. Disables Row Level Security (RLS) on all tables
  2. Drops all existing RLS policies
  3. Sets all tables to allow all operations for all users
*/

-- Disable RLS on all tables
ALTER TABLE IF EXISTS break_times_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sanctions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Everyone can read active break times" ON break_times_config;
DROP POLICY IF EXISTS "Admin can manage break times" ON break_times_config;
DROP POLICY IF EXISTS "Allow all" ON reports;
DROP POLICY IF EXISTS "Allow all" ON sanctions;

-- Create 'allow all' policies on all tables
CREATE POLICY "Allow all access" ON break_times_config FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON reports FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON sanctions FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable RLS but with 'allow all' policies
ALTER TABLE break_times_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;

-- Add a comment to document this change
COMMENT ON TABLE break_times_config IS 'RLS is enabled but all operations are allowed for all users';
COMMENT ON TABLE reports IS 'RLS is enabled but all operations are allowed for all users';
COMMENT ON TABLE sanctions IS 'RLS is enabled but all operations are allowed for all users';

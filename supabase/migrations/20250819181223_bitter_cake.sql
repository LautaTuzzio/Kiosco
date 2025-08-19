/*
  # Create Reports and Sanctions System

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, foreign key to users)
      - `reported_id` (uuid, foreign key to users)
      - `reason` (text)
      - `status` (enum: pending, reviewed, resolved)
      - `admin_notes` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sanctions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (enum: warning, timeout, ban)
      - `reason` (text)
      - `duration_hours` (integer, nullable for permanent bans)
      - `expires_at` (timestamp, nullable)
      - `created_by` (uuid, foreign key to users - admin who created)
      - `created_at` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on both tables
    - Add "Allow all" policy for both tables
*/

-- Create report status enum
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved');

-- Create sanction type enum
CREATE TYPE sanction_type AS ENUM ('warning', 'timeout', 'ban');

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reported_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status report_status DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sanctions table
CREATE TABLE IF NOT EXISTS sanctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type sanction_type NOT NULL,
  reason text NOT NULL,
  duration_hours integer,
  expires_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;

-- Create "Allow all" policies
CREATE POLICY "Allow all" ON reports FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sanctions FOR ALL TO public USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_id ON reports(reported_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);

CREATE INDEX idx_sanctions_user_id ON sanctions(user_id);
CREATE INDEX idx_sanctions_is_active ON sanctions(is_active);
CREATE INDEX idx_sanctions_expires_at ON sanctions(expires_at);
CREATE INDEX idx_sanctions_created_at ON sanctions(created_at);
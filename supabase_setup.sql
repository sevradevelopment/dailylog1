-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'worker',
  name TEXT,
  email TEXT,
  disabled BOOLEAN DEFAULT FALSE
);

-- Create sites table
CREATE TABLE sites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL
);

-- Create daily_logs table
CREATE TABLE daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id),
  work_date DATE NOT NULL,
  hours TEXT,
  break_start TEXT,
  break_end TEXT,
  start_location TEXT,
  start_time TEXT,
  end_location TEXT,
  end_time TEXT,
  cargo_type TEXT,
  cargo_amount TEXT,
  vehicle_plate TEXT,
  admin_work_type TEXT,
  wood_type TEXT,
  wood_amount TEXT,
  work_type TEXT,
  machines JSONB,
  problems TEXT,
  notes TEXT,
  blockers TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for sites
CREATE POLICY "Authenticated users can view sites" ON sites
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage sites" ON sites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies for daily_logs
CREATE POLICY "Users can view their own logs" ON daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs" ON daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" ON daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs" ON daily_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create fuel_logs table
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fuel_date DATE NOT NULL,
  vehicle_plate TEXT,
  fuel_type TEXT,
  liters DECIMAL(10,2),
  price_per_liter DECIMAL(10,3),
  total_cost DECIMAL(10,2),
  odometer INTEGER,
  station TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table (for transport start/end points)
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for daily_logs
ALTER TABLE daily_logs ADD CONSTRAINT unique_daily_log UNIQUE (user_id, work_date);

-- Add blockers field if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'blockers') THEN
    ALTER TABLE daily_logs ADD COLUMN blockers TEXT;
  END IF;
END $$;

-- Add notes field if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'notes') THEN
    ALTER TABLE daily_logs ADD COLUMN notes TEXT;
  END IF;
END $$;

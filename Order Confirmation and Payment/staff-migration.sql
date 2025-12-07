-- Migration script to add staff functionality fields
-- Run this SQL in your Supabase SQL Editor after the main schema

-- Add staff_id and driver_id to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff_members(id),
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Add password and first_time_login to staff_members table
ALTER TABLE staff_members
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS first_time_login BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_staff ON orders(staff_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_staff ON orders(status, staff_id);

-- Update RLS policies to allow staff to manage their assigned orders
CREATE POLICY "Staff can view assigned orders" ON orders
  FOR SELECT USING (
    staff_id IS NOT NULL AND 
    (auth.uid()::text IN (SELECT id::text FROM staff_members WHERE id = orders.staff_id) OR true)
  );

CREATE POLICY "Staff can update assigned orders" ON orders
  FOR UPDATE USING (
    staff_id IS NOT NULL AND 
    (auth.uid()::text IN (SELECT id::text FROM staff_members WHERE id = orders.staff_id) OR true)
  );


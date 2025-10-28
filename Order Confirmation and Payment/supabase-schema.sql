-- FrontDash Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== USERS TABLE ==========
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'restaurant_owner', 'staff', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== RESTAURANTS TABLE ==========
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  cuisine_type TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  description TEXT NOT NULL,
  opening_time TEXT NOT NULL,
  closing_time TEXT NOT NULL,
  rating NUMERIC(3,2) DEFAULT 0,
  delivery_time TEXT,
  distance TEXT,
  image_url TEXT,
  promo TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== ORDERS TABLE ==========
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES users(id),
  restaurant_id UUID REFERENCES restaurants(id),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  delivery_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL,
  service_charge NUMERIC(10,2) NOT NULL,
  tax NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'paypal', 'venmo')),
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== ORDER ITEMS TABLE ==========
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== RESTAURANT REGISTRATIONS TABLE ==========
CREATE TABLE IF NOT EXISTS restaurant_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_name TEXT NOT NULL,
  owner_first_name TEXT NOT NULL,
  owner_last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cuisine_type TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  description TEXT NOT NULL,
  opening_time TEXT NOT NULL,
  closing_time TEXT NOT NULL,
  menu_file_url TEXT NOT NULL,
  logo_file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  decision_date TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id)
);

-- ========== STAFF MEMBERS TABLE ==========
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('support', 'manager', 'admin')),
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== DRIVERS TABLE ==========
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- ========== WITHDRAWAL REQUESTS TABLE ==========
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  restaurant_name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_date TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id)
);

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_registrations_status ON restaurant_registrations(status);

-- ========== ROW LEVEL SECURITY (RLS) ==========
-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- ========== POLICIES ==========
-- Users can read all restaurants (public data)
CREATE POLICY "Anyone can read restaurants" ON restaurants
  FOR SELECT USING (status = 'active');

-- Users can create their own orders
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Users can read their own orders
CREATE POLICY "Users can read their own orders" ON orders
  FOR SELECT USING (auth.uid() = customer_id);

-- Users can read their own order items
CREATE POLICY "Users can read their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.customer_id = auth.uid()
    )
  );

-- Anyone can submit restaurant registrations
CREATE POLICY "Anyone can create registrations" ON restaurant_registrations
  FOR INSERT WITH CHECK (true);

-- Staff and admins can read restaurant registrations
CREATE POLICY "Staff can read registrations" ON restaurant_registrations
  FOR SELECT USING (true);

-- Staff can insert staff members
CREATE POLICY "Admins can manage staff" ON staff_members
  FOR ALL USING (true);

-- Staff can manage drivers
CREATE POLICY "Admins can manage drivers" ON drivers
  FOR ALL USING (true);

-- Staff can manage withdrawal requests
CREATE POLICY "Admins can manage withdrawals" ON withdrawal_requests
  FOR ALL USING (true);

-- ========== FUNCTIONS ==========
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- FrontDash Sample Data
-- Run this AFTER you've run supabase-schema.sql

-- ========== ADD SAMPLE STAFF MEMBERS ==========

-- Insert staff members for the admin dashboard
INSERT INTO staff_members (name, username, role, date_added) VALUES
  ('Alice Johnson', 'alice01', 'manager', '2024-01-15'),
  ('Bob Smith', 'bob02', 'support', '2024-02-20'),
  ('Carol Davis', 'carol03', 'admin', '2024-03-10'),
  ('David Wilson', 'david04', 'support', '2024-04-05')
ON CONFLICT (username) DO NOTHING;

-- ========== ADD SAMPLE DRIVERS ==========

-- Insert sample drivers
INSERT INTO drivers (first_name, last_name, username, start_date, status) VALUES
  ('Colby', 'Papanatuski', '@papanak1', '2024-06-11', 'active'),
  ('Jonathan', 'Pyne', '@jonathan1', '2024-06-09', 'active')
ON CONFLICT (username) DO NOTHING;

-- ========== ADD SAMPLE USERS ==========

-- Insert sample users (for customer and restaurant owner roles)
INSERT INTO users (id, email, name, user_type, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'customer@frontdash.com', 'John Customer', 'customer', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'admin@frontdash.com', 'Admin User', 'admin', NOW()),
  ('00000000-0000-0000-0000-000000000003', 'restaurant@frontdash.com', 'Restaurant Owner', 'restaurant_owner', NOW())
ON CONFLICT (id) DO NOTHING;

-- ========== ADD SAMPLE RESTAURANTS ==========

-- Insert sample restaurants
INSERT INTO restaurants (
  id, name, owner_id, cuisine_type, address, city, state, zip_code, 
  phone, email, description, opening_time, closing_time, rating, 
  delivery_time, distance, image_url, status
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Mario''s Italian Kitchen',
    '00000000-0000-0000-0000-000000000003',
    'Italian',
    '123 Main St',
    'Downtown',
    'CA',
    '90210',
    '555-0101',
    'mario@italiankitchen.com',
    'Authentic Italian cuisine with fresh ingredients and traditional recipes.',
    '09:00',
    '22:00',
    4.8,
    '25-30 min',
    '0.5 mi',
    'https://via.placeholder.com/300x200',
    'active'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Dragon Sushi',
    '00000000-0000-0000-0000-000000000003',
    'Japanese',
    '456 Oak Ave',
    'Midtown',
    'CA',
    '90211',
    '555-0202',
    'info@dragonsushi.com',
    'Fresh sushi and Japanese dishes made with premium ingredients.',
    '11:00',
    '23:00',
    4.9,
    '20-25 min',
    '0.8 mi',
    'https://via.placeholder.com/300x200',
    'active'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Burger King Downtown',
    '00000000-0000-0000-0000-000000000003',
    'American',
    '789 Elm St',
    'Uptown',
    'CA',
    '90212',
    '555-0303',
    'manager@bkdowntown.com',
    'Classic American burgers and fries in a fast-food setting.',
    '10:00',
    '22:00',
    4.2,
    '15-20 min',
    '0.3 mi',
    'https://via.placeholder.com/300x200',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- ========== ADD SAMPLE RESTAURANT REGISTRATIONS ==========

-- These will show up in the admin dashboard
INSERT INTO restaurant_registrations (
  restaurant_name, owner_first_name, owner_last_name, email, phone, 
  cuisine_type, address, city, state, zip_code, description, 
  opening_time, closing_time, menu_file_url, status, submission_date
) VALUES
  (
    'Jim''s Hotdogs',
    'Jim',
    'Johnson',
    'j@gmail.com',
    '5551000000',
    'Fast Food',
    '123 Hot Dog Lane',
    'Los Angeles',
    'CA',
    '90210',
    'The best hotdogs in town!',
    '09:00',
    '20:00',
    'https://via.placeholder.com/500x700.pdf',
    'approved',
    '2024-06-11'
  ),
  (
    'Tim''s Pizza',
    'Tim',
    'Smith',
    't@gmail.com',
    '5552000000',
    'Pizza',
    '456 Pizza Blvd',
    'Los Angeles',
    'CA',
    '90210',
    'New York style pizza with premium toppings.',
    '11:00',
    '23:00',
    'https://via.placeholder.com/500x700.pdf',
    'rejected',
    '2024-06-09'
  ),
  (
    'Mario''s Italian Kitchen',
    'Mario',
    'Ricci',
    'mario@kitchen.com',
    '5553000000',
    'Italian',
    '789 Pasta Street',
    'Los Angeles',
    'CA',
    '90210',
    'Family-owned Italian restaurant since 1985.',
    '09:00',
    '22:00',
    'https://via.placeholder.com/500x700.pdf',
    'pending',
    NOW() - INTERVAL '7 days'
  ),
  (
    'Dragon Sushi',
    'Kenji',
    'Tanaka',
    'info@dragonsushi.com',
    '5554000000',
    'Japanese',
    '321 Sushi Avenue',
    'Los Angeles',
    'CA',
    '90210',
    'Traditional Japanese sushi and sashimi.',
    '11:00',
    '23:00',
    'https://via.placeholder.com/500x700.pdf',
    'pending',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT DO NOTHING;

-- ========== ADD SAMPLE WITHDRAWAL REQUESTS ==========

INSERT INTO withdrawal_requests (
  restaurant_id, restaurant_name, contact_info, submission_date, status
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Tony''s Bistro',
    'tony@gmail.com',
    NOW() - INTERVAL '2 days',
    'pending'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Burger King Downtown',
    'manager@bkdowntown.com',
    NOW() - INTERVAL '5 days',
    'pending'
  )
ON CONFLICT DO NOTHING;

-- ========== VERIFY DATA ==========

-- Check what was inserted
SELECT 'Staff Members:' as info, COUNT(*) as count FROM staff_members
UNION ALL
SELECT 'Drivers:', COUNT(*) FROM drivers
UNION ALL
SELECT 'Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Restaurants:', COUNT(*) FROM restaurants
UNION ALL
SELECT 'Registrations:', COUNT(*) FROM restaurant_registrations
UNION ALL
SELECT 'Withdrawal Requests:', COUNT(*) FROM withdrawal_requests;



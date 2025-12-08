import { createClient } from '@supabase/supabase-js';

// These should be in your environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Log configuration (only in development)
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl?.substring(0, 30) + '...');
  console.log('Supabase Key configured:', !!supabaseAnonKey && supabaseAnonKey !== 'your-anon-key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface User {
  id: string;
  email: string;
  name: string;
  user_type: 'customer' | 'restaurant_owner' | 'staff' | 'admin';
  created_at: string;
}

export interface Restaurant {
  id?: string; // UUID if exists
  restaurant_id?: string; // Text ID like "001", "002", "003" - primary key in your database
  name: string;
  owner_id?: string;
  cuisine_type?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  description?: string;
  opening_time?: string;
  closing_time?: string;
  operating_hours?: string; // Text field with operating hours like "Mon: 9:00 AM - 9:00 PM\nTue: 9:00 AM - 9:00 PM..."
  rating?: number;
  delivery_time?: string;
  distance?: string;
  image_url?: string;
  promo?: string;
  status?: 'active' | 'pending' | 'suspended';
  created_at?: string;
}

export interface Order {
  id?: string; // UUID if exists
  order_id?: string; // Text ID like "FD0001", "FD0002" - primary key in your database
  customer_id?: string;
  customer_first_name?: string; // Customer's first name from orders table
  customer_last_name?: string; // Customer's last name from orders table
  restaurant_id: string; // Text ID like "001", "002", "003"
  driver_id?: string; // Text ID like "D1", "D2" or null
  staff_id?: string; // Staff member ID
  order_number?: string;
  status: 'Pending' | 'Completed' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  subtotal?: number; // Subtotal from orders table
  delivery_fee?: number;
  service_charge?: number;
  tax?: number;
  total?: number;
  payment_method?: 'card' | 'paypal' | 'venmo';
  estimated_delivery?: string;
  delivered_at?: string;
  created_at?: string;
  placed_at?: string; // Timestamp when order was placed
  order_items?: OrderItem[]; // Related order items
}

export interface OrderItem {
  id?: string;
  order_items?: number; // Primary key ID
  order_id: string; // Text ID like "FD0001", "FD0002"
  menu_item_id?: string; // Text ID like "01", "02"
  item_name_snapshot?: string; // Snapshot of item name at time of order
  unit_price_snapshot?: number; // Snapshot of price at time of order
  quantity: number;
  // Legacy fields for compatibility
  item_name?: string;
  item_id?: number;
  price?: number;
}

export interface RestaurantRegistration {
  id: string;
  restaurant_name: string;
  owner_first_name: string;
  owner_last_name: string;
  email: string;
  phone: string;
  cuisine_type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  description: string;
  opening_time: string;
  closing_time: string;
  menu_file_url: string;
  logo_file_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  submission_date: string;
  decision_date?: string;
  reviewed_by?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  username: string;
  role: 'support' | 'manager' | 'admin';
  date_added: string;
  password_hash?: string;
  first_time_login?: boolean;
  email?: string;
}

export interface Driver {
  driver_id: string;
  'Full name': string;
  phone: string;
  employment_status: string;
  is_available: boolean;
}

export interface WithdrawalRequest {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  contact_info: string;
  submission_date: string;
  status: 'pending' | 'approved' | 'rejected';
  decision_date?: string;
  reviewed_by?: string;
}

export interface MenuItem {
  id?: string; // UUID if exists
  menu_item_id?: string; // Text ID like "01", "02" - primary key in your database
  restaurant_id: string; // Text ID like "001", "002", "003" - links to restaurants.restaurant_id
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  is_available?: boolean;
  created_at?: string;
}


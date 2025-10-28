import { createClient } from '@supabase/supabase-js';

// These should be in your environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

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
  id: string;
  name: string;
  owner_id: string;
  cuisine_type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  description: string;
  opening_time: string;
  closing_time: string;
  rating: number;
  delivery_time: string;
  distance: string;
  image_url: string;
  promo?: string;
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  subtotal: number;
  delivery_fee: number;
  service_charge: number;
  tax: number;
  total: number;
  payment_method: 'card' | 'paypal' | 'venmo';
  estimated_delivery: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_name: string;
  item_id: number;
  price: number;
  quantity: number;
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
}

export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  start_date: string;
  status: 'active' | 'inactive';
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


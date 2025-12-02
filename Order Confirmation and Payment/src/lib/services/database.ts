import { supabase, Restaurant, Order, OrderItem, RestaurantRegistration, StaffMember, Driver, WithdrawalRequest } from '../supabase';

// ========== RESTAURANT OPERATIONS ==========

export async function getRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('status', 'active')
    .order('name');

  if (error) throw error;
  return data as Restaurant[];
}

export async function getRestaurantById(id: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Restaurant;
}

export async function createRestaurantRegistration(registration: Omit<RestaurantRegistration, 'id' | 'submission_date' | 'status' | 'decision_date' | 'reviewed_by'>) {
  const { data, error } = await supabase
    .from('restaurant_registrations')
    .insert([{
      ...registration,
      submission_date: new Date().toISOString(),
      status: 'pending'
    }])
    .select()
    .single();

  if (error) throw error;
  return data as RestaurantRegistration;
}

export async function getRestaurantRegistrations(status?: 'pending' | 'approved' | 'rejected') {
  let query = supabase.from('restaurant_registrations').select('*');
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('submission_date', { ascending: false });
  
  if (error) throw error;
  return data as RestaurantRegistration[];
}

export async function updateRestaurantRegistrationStatus(id: string, status: 'approved' | 'rejected', reviewerId: string) {
  const { data, error } = await supabase
    .from('restaurant_registrations')
    .update({
      status,
      decision_date: new Date().toISOString(),
      reviewed_by: reviewerId
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as RestaurantRegistration;
}

// ========== ORDER OPERATIONS ==========

export async function createOrder(orderData: Omit<Order, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function createOrderItems(items: Omit<OrderItem, 'id'>[]) {
  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select();

  if (error) throw error;
  return data as OrderItem[];
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*),
      restaurants (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id: string, status: Order['status']) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

// Get pending orders (order queue)
export async function getPendingOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      restaurants (id, name, address, city, state),
      order_items (*)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Get orders assigned to a staff member
export async function getStaffActiveOrders(staffId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      restaurants (id, name, address, city, state),
      order_items (*)
    `)
    .eq('staff_id', staffId)
    .in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get delivered orders for a staff member
export async function getStaffDeliveredOrders(staffId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      restaurants (id, name, address, city, state),
      order_items (*)
    `)
    .eq('staff_id', staffId)
    .eq('status', 'delivered')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

// Assign order to staff member (retrieve from queue)
export async function assignOrderToStaff(orderId: string, staffId: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      staff_id: staffId,
      status: 'confirmed'
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

// Assign driver to order
export async function assignDriverToOrder(orderId: string, driverId: string, estimatedDelivery: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      driver_id: driverId,
      status: 'out_for_delivery',
      estimated_delivery: estimatedDelivery
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

// Confirm delivery
export async function confirmDelivery(orderId: string, deliveredAt: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status: 'delivered',
      delivered_at: deliveredAt
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

// Get staff member by username
export async function getStaffByUsername(username: string) {
  const { data, error } = await supabase
    .from('staff_members')
    .select('*')
    .eq('username', username)
    .single();

  if (error) throw error;
  return data as StaffMember;
}

// Update staff password
export async function updateStaffPassword(staffId: string, passwordHash: string) {
  const { data, error } = await supabase
    .from('staff_members')
    .update({ 
      password_hash: passwordHash,
      first_time_login: false
    })
    .eq('id', staffId)
    .select()
    .single();

  if (error) throw error;
  return data as StaffMember;
}

// ========== STAFF OPERATIONS ==========

export async function getStaffMembers() {
  const { data, error } = await supabase
    .from('staff_members')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as StaffMember[];
}

export async function createStaffMember(staff: Omit<StaffMember, 'id' | 'date_added'>) {
  const username = staff.username || 
    `${staff.name.split(' ')[1].toLowerCase()}${Math.floor(Math.random() * 90) + 10}`;
  
  const { data, error } = await supabase
    .from('staff_members')
    .insert([{
      ...staff,
      username,
      date_added: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data as StaffMember;
}

export async function deleteStaffMember(id: string) {
  const { error } = await supabase
    .from('staff_members')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========== DRIVER OPERATIONS ==========

export async function getDrivers() {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('first_name');

  if (error) throw error;
  return data as Driver[];
}

export async function createDriver(driver: Omit<Driver, 'id' | 'start_date'>) {
  const username = `@${driver.last_name.toLowerCase()}${Math.floor(Math.random() * 90) + 10}`;
  
  const { data, error } = await supabase
    .from('drivers')
    .insert([{
      ...driver,
      username,
      start_date: new Date().toISOString(),
      status: 'active'
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Driver;
}

export async function deleteDriver(id: string) {
  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========== WITHDRAWAL REQUESTS ==========

export async function getWithdrawalRequests() {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .order('submission_date', { ascending: false });

  if (error) throw error;
  return data as WithdrawalRequest[];
}

export async function createWithdrawalRequest(request: Omit<WithdrawalRequest, 'id' | 'submission_date' | 'status'>) {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .insert([{
      ...request,
      submission_date: new Date().toISOString(),
      status: 'pending'
    }])
    .select()
    .single();

  if (error) throw error;
  return data as WithdrawalRequest;
}

export async function updateWithdrawalRequestStatus(id: string, status: 'approved' | 'rejected', reviewerId: string) {
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .update({
      status,
      decision_date: new Date().toISOString(),
      reviewed_by: reviewerId
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as WithdrawalRequest;
}

export async function deleteWithdrawalRequest(id: string) {
  const { error } = await supabase
    .from('withdrawal_requests')
    .delete()
    .eq('id', id);

  if (error) throw error;
}


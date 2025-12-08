import { supabase, Restaurant, Order, OrderItem, RestaurantRegistration, StaffMember, Driver, WithdrawalRequest, MenuItem } from '../supabase';

// ========== RESTAURANT OPERATIONS ==========

export async function getRestaurants() {
  // Fetch all restaurants - don't filter by status since that column may not exist
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name');

  if (error) {
    console.error('Supabase error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to fetch restaurants: ${error.message}${error.hint ? ` (${error.hint})` : ''}`);
  }
  
  // Return all restaurants (filter by status only if the column exists)
  const restaurants = (data || []).filter((r: any) => {
    // If status column exists, only return active restaurants
    // Otherwise, return all restaurants
    return !r.hasOwnProperty('status') || r.status === 'active';
  });
  
  return restaurants as Restaurant[];
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

// Get order items for a specific order, joined with menu_items to get item names
export async function getOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      menu_items (
        menu_item_id,
        name,
        price,
        description
      )
    `)
    .eq('order_id', orderId);

  if (error) {
    console.error('Supabase error fetching order items:', error);
    throw new Error(`Failed to fetch order items: ${error.message}`);
  }
  
  return (data || []) as any[];
}

// Get orders by restaurant (for restaurant portal)
export async function getOrdersByRestaurant(restaurantId: string, status?: string) {
  console.log('Fetching orders for restaurant_id:', restaurantId, 'status:', status);
  
  // Query orders by restaurant_id (text field like "001", "002", "003")
  // Join with order_items, and then join order_items with menu_items to get item names
  let query = supabase
    .from('orders')
    .select(`
      *,
      order_items (
        order_item_id,
        order_id,
        menu_item_id,
        item_name_snapshot,
        unit_price_snapshot,
        quantity,
        menu_items (
          menu_item_id,
          name,
          price,
          description
        )
      )
    `)
    .eq('restaurant_id', restaurantId);
  
  // Filter by status if provided
  if (status) {
    if (status.toLowerCase() === 'completed') {
      // Check for "Completed" (capitalized) as shown in the database
      query = query.eq('status', 'Completed');
    } else if (status.toLowerCase() === 'pending') {
      // Check for "Pending" (capitalized) as shown in the database
      query = query.eq('status', 'Pending');
    } else {
      query = query.eq('status', status);
    }
  }
  // If no status filter, fetch all orders
  
  // Order by order_id descending (newest first) or created_at if it exists
  query = query.order('order_id', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Supabase error fetching orders:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
  
  console.log('Fetched orders:', data?.length || 0, data);
  
  // If order_items weren't included in the join, fetch them separately for each order
  const ordersWithItems = await Promise.all(
    (data || []).map(async (order: any) => {
      // If order_items is not an array or is empty, try fetching separately
      if (!order.order_items || !Array.isArray(order.order_items) || order.order_items.length === 0) {
        try {
          const orderId = order.order_id || order.order_number || order.id;
          if (orderId) {
            console.log(`Fetching order items separately for order ${orderId}`);
            const items = await getOrderItems(orderId);
            order.order_items = items;
          }
        } catch (err) {
          console.error(`Error fetching items for order ${order.order_id}:`, err);
          order.order_items = [];
        }
      }
      return order;
    })
  );
  
  return ordersWithItems as any[];
}

// Confirm order (update status from Pending to confirmed/preparing)
export async function confirmOrder(orderId: string) {
  console.log('Confirming order:', orderId);
  
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status: 'confirmed'
    })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error confirming order:', error);
    throw new Error(`Failed to confirm order: ${error.message}`);
  }
  
  console.log('Order confirmed:', data);
  return data as Order;
}

// Get pending orders (order queue) - for staff interface
// Includes both "pending" and "confirmed" orders (confirmed orders from restaurant portal)
export async function getPendingOrders() {
  console.log('🔵 getPendingOrders() called');
  console.log('🔵 Fetching pending orders for queue...');
  
  try {
    // First, try a simple query to see if we can get any orders at all
    console.log('🔵 Running simple test query...');
    const { data: simpleTest, error: simpleError } = await supabase
      .from('orders')
      .select('order_id, status')
      .in('status', ['pending', 'confirmed'])
      .limit(5);
    
    console.log('🔵 Simple test query result:', simpleTest?.length || 0);
    console.log('🔵 Simple test data:', simpleTest);
    if (simpleError) {
      console.error('🔴 Simple test query error:', simpleError);
      console.error('🔴 Error code:', simpleError.code);
      console.error('🔴 Error message:', simpleError.message);
    }
  } catch (testErr) {
    console.error('🔴 Exception in simple test query:', testErr);
  }
  
  // Query for orders with status 'pending' or 'confirmed' (both lowercase)
  // Show all confirmed orders regardless of staff_id assignment
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        order_item_id,
        order_id,
        menu_item_id,
        item_name_snapshot,
        unit_price_snapshot,
        quantity,
        menu_items (
          menu_item_id,
          name,
          price,
          description
        )
      )
    `)
    .in('status', ['pending', 'confirmed'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase error fetching pending orders:', error);
    throw error;
  }
  
  console.log('Orders fetched with status filter (pending/confirmed):', data?.length || 0);
  if (data && data.length > 0) {
    console.log('First order sample:', {
      order_id: data[0].order_id,
      status: data[0].status,
      staff_id: data[0].staff_id,
      restaurant_id: data[0].restaurant_id
    });
  } else {
    // Debug: Check what orders exist with these statuses
    console.log('No orders found. Checking what orders exist in database...');
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('order_id, status, staff_id, restaurant_id')
      .in('status', ['pending', 'confirmed'])
      .limit(20);
    
    if (allError) {
      console.error('Error fetching debug orders:', allError);
    } else {
      console.log('Debug: Found orders with pending/confirmed status:', allOrders?.length || 0);
      console.log('Sample orders:', allOrders);
      
      // Also check all statuses to see what exists
      const { data: statusCheck, error: statusError } = await supabase
        .from('orders')
        .select('order_id, status')
        .limit(50);
      
      if (!statusError && statusCheck) {
        const uniqueStatuses = [...new Set(statusCheck.map(o => o.status))];
        console.log('All unique statuses found in orders table:', uniqueStatuses);
        console.log('Count of orders with "confirmed" status:', statusCheck.filter(o => o.status === 'confirmed').length);
        console.log('Count of orders with "pending" status:', statusCheck.filter(o => o.status === 'pending').length);
      }
    }
  }
  
  // Fetch restaurant details separately since we need to join on restaurant_id (text field)
  const ordersWithRestaurants = await Promise.all(
    (data || []).map(async (order: any) => {
      if (order.restaurant_id) {
        try {
          const { data: restaurant, error: restError } = await supabase
            .from('restaurants')
            .select('restaurant_id, name, address, city, state')
            .eq('restaurant_id', order.restaurant_id)
            .single();
          
          if (restError) {
            console.error(`Error fetching restaurant ${order.restaurant_id} for order ${order.order_id}:`, restError);
            order.restaurants = null;
          } else {
            order.restaurants = restaurant;
          }
        } catch (err) {
          console.error(`Exception fetching restaurant for order ${order.order_id}:`, err);
          order.restaurants = null;
        }
      } else {
        console.warn(`Order ${order.order_id} has no restaurant_id`);
        order.restaurants = null;
      }
      return order;
    })
  );
  
  console.log('Final orders with restaurants:', ordersWithRestaurants?.length || 0);
  
  return ordersWithRestaurants;
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
  console.log('Assigning order to staff:', orderId, staffId);
  
  // Try to match by order_id first (text field like "FD0001"), then by id (UUID)
  let query = supabase
    .from('orders')
    .update({ 
      staff_id: staffId,
      status: 'confirmed'
    });
  
  // Try order_id first (text like "FD0001"), then fallback to id (UUID)
  const { data, error } = await query
    .or(`order_id.eq.${orderId},id.eq.${orderId}`)
    .select()
    .single();

  if (error) {
    console.error('Error assigning order to staff:', error);
    throw error;
  }
  
  console.log('Order assigned to staff:', data);
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
    .from('staffuser')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error fetching staff member:', error);
    throw error;
  }
  return data as StaffMember;
}

// Update staff password
export async function updateStaffPassword(staffId: string, passwordHash: string) {
  const { data, error } = await supabase
    .from('staffuser')
    .update({ 
      password_hash: passwordHash,
      first_time_login: false
    })
    .eq('id', staffId)
    .select()
    .single();

  if (error) {
    console.error('Error updating staff password:', error);
    throw error;
  }
  return data as StaffMember;
}

// ========== STAFF OPERATIONS ==========

export async function getStaffMembers() {
  // Query all columns to see what we get
  const { data, error } = await supabase
    .from('staffuser')
    .select('*');

  if (error) {
    console.error('Error fetching staff members:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  // Log the first staff member to see actual column structure
  if (data && data.length > 0) {
    console.log('Sample staff data from database:', data[0]);
    console.log('Available columns:', Object.keys(data[0]));
  }

  // Map the data to match our interface
  // Handle different possible column name formats
  const mappedData = (data || [])
    .map((staff: any, index: number) => {
      const firstname = staff.firstname || staff.first_name || staff['first name'] || '';
      const lastname = staff.lastname || staff.last_name || staff['last name'] || '';
      // Status column is capitalized "Status" in the database
      const status = staff.Status !== undefined ? staff.Status : (staff.status !== undefined ? staff.status : 'active');
      // Try multiple possible ID column names
      const id = staff.id || staff.staff_id || staff.user_id || staff.uuid || 
                 (staff.firstname && staff.lastname ? `${staff.firstname}-${staff.lastname}-${index}` : `staff-${index}`);

      return {
        id: String(id), // Ensure ID is always a string
        firstname: firstname,
        lastname: lastname,
        status: status
      };
    })
    // Filter out staff with status = false (handle both boolean and string)
    .filter((staff: StaffMember) => {
      const statusValue = staff.status;
      // Keep only staff where status is not false (boolean) or 'false' (string)
      return statusValue !== false && statusValue !== 'false' && statusValue !== 0;
    });

  console.log('Mapped staff data (filtered):', mappedData);
  return mappedData as StaffMember[];
}

export async function createStaffMember(staff: Omit<StaffMember, 'id' | 'date_added'>) {
  const username = staff.username || 
    `${staff.name.split(' ')[1].toLowerCase()}${Math.floor(Math.random() * 90) + 10}`;
  
  const { data, error } = await supabase
    .from('staffuser')
    .insert([{
      ...staff,
      username,
      date_added: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating staff member:', error);
    throw error;
  }
  return data as StaffMember;
}

export async function deleteStaffMember(id: string) {
  // Validate ID
  if (!id || id.trim() === '' || id.startsWith('staff-')) {
    throw new Error('Staff member ID is required and must be a valid database ID');
  }

  // Instead of deleting, set Status to false (column name is capitalized "Status")
  const { data, error } = await supabase
    .from('staffuser')
    .update({ Status: false })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating staff member status:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      id: id
    });
    throw error;
  }
  
  return data;
}

// ========== DRIVER OPERATIONS ==========

export async function getDrivers() {
  // First, try to get all columns to see what the actual column names are
  const { data, error } = await supabase
    .from('drivers')
    .select('*');

  if (error) {
    console.error('Error fetching drivers:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }

  // Log the first driver to see actual column structure
  if (data && data.length > 0) {
    console.log('Sample driver data from database:', data[0]);
    console.log('Available columns:', Object.keys(data[0]));
  }

  // Map the data to match our interface
  // Handle different possible column name formats
  const mappedData = (data || []).map((driver: any) => {
    // Try different possible column name variations
    const fullName = driver['Full name'] || driver.full_name || driver.Full_name || driver['full name'] || driver.name || '';
    const driverId = driver.driver_id || driver.id || '';
    const phone = driver.phone || '';
    const employmentStatus = driver.employment_status || driver.status || '';
    const isAvailable = driver.is_available !== undefined ? driver.is_available : (driver.available !== undefined ? driver.available : true);

    return {
      driver_id: driverId,
      'Full name': fullName,
      phone: phone,
      employment_status: employmentStatus,
      is_available: isAvailable
    };
  });

  console.log('Mapped drivers data:', mappedData);
  return mappedData as Driver[];
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

// ========== MENU ITEM OPERATIONS ==========

export async function getMenuItemsByRestaurant(restaurantId: string) {
  console.log('Fetching menu items for restaurant_id:', restaurantId);
  
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name');

  if (error) {
    console.error('Supabase error fetching menu items:', error);
    throw new Error(`Failed to fetch menu items: ${error.message}`);
  }
  
  console.log('Fetched menu items:', data?.length || 0, data);
  return (data || []) as MenuItem[];
}

export async function getRestaurantWithMenu(restaurantId: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .select(`
      *,
      menu_items (*)
    `)
    .eq('id', restaurantId)
    .single();

  if (error) {
    console.error('Supabase error fetching restaurant with menu:', error);
    throw new Error(`Failed to fetch restaurant: ${error.message}`);
  }
  
  return data;
}


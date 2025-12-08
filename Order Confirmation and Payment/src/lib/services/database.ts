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

// Helper function to generate a random unique restaurant_id
async function generateUniqueRestaurantId(): Promise<string> {
  const maxRetries = 10;
  let attempts = 0;
  
  while (attempts < maxRetries) {
    // Generate a random restaurant_id using timestamp + random string
    // Format: REST-{timestamp}-{random6chars}
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const candidateId = `REST-${timestamp}-${randomStr}`;
    
    // Check if this ID exists in restaurants table
    const { data: existingRestaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('restaurant_id')
      .eq('restaurant_id', candidateId)
      .limit(1);
    
    // Check if this ID exists in requests table
    const { data: existingRequests, error: requestError } = await supabase
      .from('requests')
      .select('restaurant_id')
      .eq('kind', 'registration')
      .eq('restaurant_id', candidateId)
      .limit(1);
    
    // If there was a real error (not just "not found"), log it but continue
    if (restaurantError) {
      console.warn('Error checking restaurant_id in restaurants table:', restaurantError);
    }
    if (requestError) {
      console.warn('Error checking restaurant_id in requests table:', requestError);
    }
    
    // If ID doesn't exist in either table (empty arrays), it's unique
    const restaurantExists = existingRestaurants && existingRestaurants.length > 0;
    const requestExists = existingRequests && existingRequests.length > 0;
    
    if (!restaurantExists && !requestExists) {
      return candidateId;
    }
    
    attempts++;
  }
  
  // Fallback: if we've tried maxRetries times, use longer random string as last resort
  const fallbackId = `REST-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  console.warn(`Generated fallback restaurant_id after ${maxRetries} attempts: ${fallbackId}`);
  return fallbackId;
}

export async function createRestaurantRegistration(registration: Omit<RestaurantRegistration, 'id' | 'submission_date' | 'status' | 'decision_date' | 'reviewed_by'>) {
  // Generate random ID for the request itself
  const randomId = `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  
  // Generate unique random restaurant_id
  const randomRestaurantId = await generateUniqueRestaurantId();
  
  // Combine owner first and last name for contact_name
  const contactName = `${registration.owner_first_name} ${registration.owner_last_name}`.trim();
  
  // Build note with additional information (cuisine type, description, hours)
  // Store structured data in note for parsing: "Cuisine: X | Description: Y | Hours: HH:MM-HH:MM | City: X | State: Y | Zip: Z"
  const noteParts = [];
  if (registration.cuisine_type) {
    noteParts.push(`Cuisine: ${registration.cuisine_type}`);
  }
  if (registration.description) {
    noteParts.push(`Description: ${registration.description}`);
  }
  if (registration.opening_time && registration.closing_time) {
    noteParts.push(`Hours: ${registration.opening_time}-${registration.closing_time}`);
  }
  // Store city, state, zip in note for parsing
  noteParts.push(`City: ${registration.city}`);
  noteParts.push(`State: ${registration.state}`);
  noteParts.push(`Zip: ${registration.zip_code}`);
  const note = noteParts.join(' | ').trim();
  
  // Store full address in proposed_address (street address only, city/state/zip in note)
  const fullAddress = registration.address.trim();
  
  // Store registration data in the requests table columns
  const { data, error } = await supabase
    .from('requests')
    .insert([{
      id: randomId,
      kind: 'registration',
      restaurant_id: randomRestaurantId,
      status: 'pending',
      proposed_name: registration.restaurant_name,
      proposed_contact_name: contactName,
      proposed_contact_email: registration.email,
      proposed_phone: registration.phone,
      proposed_address: fullAddress,
      note: note || null
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating registration request:', error);
    throw error;
  }
  return data as any;
}

export async function getRestaurantRegistrations(status?: 'pending' | 'approved' | 'rejected') {
  let query = supabase.from('requests').select('*').eq('kind', 'registration');
  
  // Filter by status if provided
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('id', { ascending: false });
  
  if (error) {
    console.error('Error fetching registration requests:', error);
    throw error;
  }
  return data as any[];
}

// Helper function to parse data from note field
function parseNoteData(note: string | null): { city: string; state: string; zip: string; operatingHours: string; cuisine: string; description: string } {
  const result = {
    city: '',
    state: '',
    zip: '',
    operatingHours: '',
    cuisine: '',
    description: ''
  };

  if (!note) return result;

  // Parse structured note format: "Cuisine: X | Description: Y | Hours: HH:MM-HH:MM | City: X | State: Y | Zip: Z"
  const parts = note.split('|').map(p => p.trim());
  
  for (const part of parts) {
    if (part.startsWith('City:')) {
      result.city = part.replace('City:', '').trim();
    } else if (part.startsWith('State:')) {
      result.state = part.replace('State:', '').trim();
    } else if (part.startsWith('Zip:')) {
      result.zip = part.replace('Zip:', '').trim();
    } else if (part.startsWith('Hours:')) {
      const hours = part.replace('Hours:', '').trim();
      // Convert "HH:MM-HH:MM" to "HH:MM - HH:MM"
      result.operatingHours = hours.replace('-', ' - ');
    } else if (part.startsWith('Cuisine:')) {
      result.cuisine = part.replace('Cuisine:', '').trim();
    } else if (part.startsWith('Description:')) {
      result.description = part.replace('Description:', '').trim();
    }
  }

  return result;
}

// Helper function to create restaurant from approved request
async function createRestaurantFromRequest(request: any): Promise<void> {
  // Check if restaurant already exists
  const { data: existingRestaurant } = await supabase
    .from('restaurants')
    .select('restaurant_id')
    .eq('restaurant_id', request.restaurant_id)
    .single();

  if (existingRestaurant) {
    console.log(`Restaurant with ID ${request.restaurant_id} already exists, skipping creation`);
    return;
  }

  // Parse data from note field
  const noteData = parseNoteData(request.note);

  // Create restaurant entry with all required fields
  const restaurantData: any = {
    restaurant_id: request.restaurant_id,
    registration_status: 'approved',
    is_active: true,
    // withdrawal_status is now nullable, so we can omit it or set to null
    name: request.proposed_name || 'New Restaurant',
    contact_name: request.proposed_contact_name || 'Restaurant Owner',
    contact_email: request.proposed_contact_email || '',
    contact_phone: request.proposed_phone || '',
    street1: request.proposed_address || '', // Street address
    street2: null, // Not available from registration form
    city: noteData.city || null,
    state: noteData.state || null,
    zip: noteData.zip || null,
    operating_hours: noteData.operatingHours || null
  };

  const { error: restaurantError } = await supabase
    .from('restaurants')
    .insert([restaurantData]);

  if (restaurantError) {
    console.error('Error creating restaurant:', restaurantError);
    // Check if it's a duplicate key error (restaurant already exists)
    if (restaurantError.code === '23505' || restaurantError.message.includes('duplicate')) {
      console.warn('Restaurant with this ID already exists, skipping creation');
    } else {
      throw new Error(`Failed to create restaurant: ${restaurantError.message}`);
    }
  } else {
    console.log('Restaurant created successfully:', restaurantData.restaurant_id);
  }
}

export async function updateRestaurantRegistrationStatus(id: string, status: 'approved' | 'rejected', reviewerId: string) {
  // First, get the request to retrieve registration data
  const { data: request, error: fetchError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .eq('kind', 'registration')
    .single();

  if (fetchError) {
    console.error('Error fetching request:', fetchError);
    throw fetchError;
  }

  // If approving, create a restaurant entry
  if (status === 'approved' && request) {
    await createRestaurantFromRequest(request);
  }

  // Update the request status and decided_at timestamp
  const updateData: any = {
    status: status
  };
  
  if (status === 'approved' || status === 'rejected') {
    updateData.decided_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('requests')
    .update(updateData)
    .eq('id', id)
    .eq('kind', 'registration')
    .select()
    .single();

  if (error) {
    console.error('Error updating registration status:', error);
    throw error;
  }
  return data as any;
}

// Function to backfill approved requests that haven't been moved to restaurants table
export async function processApprovedRegistrationRequests() {
  try {
    // Get all approved registration requests
    const { data: approvedRequests, error: fetchError } = await supabase
      .from('requests')
      .select('*')
      .eq('kind', 'registration')
      .eq('status', 'approved');

    if (fetchError) {
      console.error('Error fetching approved requests:', fetchError);
      throw fetchError;
    }

    if (!approvedRequests || approvedRequests.length === 0) {
      console.log('No approved registration requests to process');
      return { processed: 0, errors: [] };
    }

    const errors: string[] = [];
    let processed = 0;

    // Process each approved request
    for (const request of approvedRequests) {
      try {
        await createRestaurantFromRequest(request);
        processed++;
      } catch (err: any) {
        console.error(`Error processing request ${request.id}:`, err);
        errors.push(`Request ${request.id}: ${err.message || 'Unknown error'}`);
      }
    }

    return { processed, errors, total: approvedRequests.length };
  } catch (error: any) {
    console.error('Error processing approved requests:', error);
    throw error;
  }
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
  // Query all columns ordered by firstname
  const { data, error } = await supabase
    .from('staffuser')
    .select('*')
    .order('firstname', { ascending: true });

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

  // Map the data to match our interface
  // Use username as the primary identifier (staffuser table doesn't have id column)
  const mappedData = (data || [])
    .map((staff: any) => {
      const firstname = staff.firstname || staff.first_name || staff['first name'] || '';
      const lastname = staff.lastname || staff.last_name || staff['last name'] || '';
      const username = staff.username || '';
      // Status column is capitalized "Status" in the database (boolean)
      const statusValue = staff.Status !== undefined ? staff.Status : (staff.status !== undefined ? staff.status : true);
      // Convert boolean to string for display
      const status = statusValue === true || statusValue === 'active' ? 'active' : 'inactive';
      // Use username as the id since staffuser table doesn't have an id column
      const id = username || `${firstname}-${lastname}`;

      return {
        id: id, // Use username as id
        firstname: firstname,
        lastname: lastname,
        username: username,
        status: status
      };
    })
    // Filter out staff with status = false (inactive staff)
    .filter((staff: any) => {
      return staff.status === 'active';
    });

  return mappedData as StaffMember[];
}

export async function createStaffMember(firstname: string, lastname: string) {
  // Generate username: firstname + lastname + number (if needed)
  const baseUsername = `${firstname.toLowerCase()}${lastname.toLowerCase()}`;
  
  // Check if base username exists
  const { data: existing } = await supabase
    .from('staffuser')
    .select('username')
    .eq('username', baseUsername)
    .single();
  
  let username = baseUsername;
  
  // If base username exists, append a number
  if (existing) {
    // Find the highest number suffix for this base username
    const { data: allWithBase } = await supabase
      .from('staffuser')
      .select('username')
      .like('username', `${baseUsername}%`);
    
    if (allWithBase && allWithBase.length > 0) {
      // Extract numbers from existing usernames
      const numbers = allWithBase
        .map(u => {
          const match = u.username.match(new RegExp(`^${baseUsername}(\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      
      const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      username = `${baseUsername}${nextNumber}`;
    } else {
      username = `${baseUsername}1`;
    }
  }
  
  const { data, error } = await supabase
    .from('staffuser')
    .insert([{
      username,
      firstname,
      lastname,
      Status: true
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating staff member:', error);
    throw error;
  }
  
  return {
    id: data.username, // Use username as id since staffuser table doesn't have id column
    firstname: data.firstname,
    lastname: data.lastname,
    username: data.username,
    status: data.Status ? 'active' : 'inactive'
  } as StaffMember;
}

export async function deleteStaffMember(identifier: string) {
  // Validate identifier
  if (!identifier || identifier.trim() === '') {
    throw new Error('Staff member identifier is required');
  }

  // Use soft delete: set Status to false (column name is capitalized "Status")
  // staffuser table uses username as primary key (no id column)
  const { data, error } = await supabase
    .from('staffuser')
    .update({ Status: false })
    .eq('username', identifier)
    .select()
    .single();

  if (error) {
    console.error('Error updating staff member status:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      identifier: identifier
    });
    throw error;
  }
  
  return data;
}

// ========== DRIVER OPERATIONS ==========

export async function getDrivers() {
  // Query all columns ordered by full_name
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('full_name', { ascending: true });

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

  // Map the data to match our interface
  // Filter out inactive drivers (employment_status = 'inactive' or is_available = false)
  const mappedData = (data || [])
    .map((driver: any) => {
      const fullName = driver.full_name || driver['Full name'] || driver.Full_name || driver['full name'] || driver.name || '';
      const driverId = driver.driver_id || driver.id || '';
      const phone = driver.phone || '';
      const employmentStatus = driver.employment_status || driver.status || 'active';
      const isAvailable = driver.is_available !== undefined ? driver.is_available : (driver.available !== undefined ? driver.available : true);

      return {
        driver_id: driverId,
        'Full name': fullName,
        phone: phone || '',
        employment_status: employmentStatus,
        is_available: isAvailable
      };
    })
    // Filter out inactive drivers
    .filter((driver: Driver) => {
      return driver.employment_status !== 'inactive' && driver.is_available !== false;
    });

  return mappedData as Driver[];
}

export async function createDriver(firstname: string, lastname: string) {
  // Generate driver_id: D1, D2, D3, etc.
  // First, get the highest existing driver_id number
  const { data: existingDrivers } = await supabase
    .from('drivers')
    .select('driver_id')
    .like('driver_id', 'D%')
    .order('driver_id', { ascending: false })
    .limit(1);
  
  let driverId = 'D1';
  if (existingDrivers && existingDrivers.length > 0) {
    const lastId = existingDrivers[0].driver_id;
    const match = lastId.match(/^D(\d+)$/);
    if (match) {
      const nextNumber = parseInt(match[1], 10) + 1;
      driverId = `D${nextNumber}`;
    }
  }
  
  // Combine firstname and lastname into full_name
  const fullName = `${firstname} ${lastname}`;
  
  const { data, error } = await supabase
    .from('drivers')
    .insert([{
      driver_id: driverId,
      full_name: fullName,
      phone: null,
      employment_status: 'active',
      is_available: true
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating driver:', error);
    throw error;
  }
  
  return {
    driver_id: data.driver_id,
    'Full name': data.full_name,
    phone: data.phone || '',
    employment_status: data.employment_status || 'active',
    is_available: data.is_available !== undefined ? data.is_available : true
  } as Driver;
}

export async function deleteDriver(driverId: string) {
  // Validate driver_id
  if (!driverId || driverId.trim() === '') {
    throw new Error('Driver ID is required');
  }

  // Use soft delete: set employment_status to 'inactive' and is_available to false
  const { data, error } = await supabase
    .from('drivers')
    .update({ 
      employment_status: 'inactive',
      is_available: false
    })
    .eq('driver_id', driverId)
    .select()
    .single();

  if (error) {
    console.error('Error updating driver status:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      driver_id: driverId
    });
    throw error;
  }
  
  return data;
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


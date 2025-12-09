import { supabase, Restaurant, Order, OrderItem, RestaurantRegistration, StaffMember, Driver, WithdrawalRequest, MenuItem } from '../supabase';
import { WeeklyHours, serializeOperatingHours } from '../utils/operatingHours';

// Generate a unique, human-friendly order_id (e.g., FD-20250101-ABC123)
async function generateUniqueOrderId(): Promise<string> {
  const ts = new Date();
  const datePart = ts.toISOString().slice(0, 10).replace(/-/g, '');

  for (let attempt = 0; attempt < 5; attempt++) {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const candidate = `FD-${datePart}-${randomPart}`;

    const { data, error } = await supabase
      .from('orders')
      .select('order_id')
      .eq('order_id', candidate)
      .maybeSingle();

    if (!error && !data) return candidate;
  }

  // Fallback: append timestamp to reduce collision risk
  return `FD-${datePart}-${Date.now()}`;
}

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

// Update operating hours for a restaurant
export async function updateRestaurantOperatingHours(restaurantId: string, hours: WeeklyHours) {
  const operatingHours = serializeOperatingHours(hours);

  // Only update the operating_hours JSON/text column; avoid non-existent columns
  const updatePayload: any = { operating_hours: operatingHours };

  // Try restaurant_id first (text key), then fallback to id (uuid)
  const updateByRestaurantId = await supabase
    .from('restaurants')
    .update(updatePayload)
    .eq('restaurant_id', restaurantId)
    .select('operating_hours')
    .maybeSingle();

  if (!updateByRestaurantId.error && updateByRestaurantId.data) {
    return;
  }

  const updateById = await supabase
    .from('restaurants')
    .update(updatePayload)
    .eq('id', restaurantId)
    .select('operating_hours')
    .maybeSingle();

  if (updateById.error) {
    console.error('Supabase error updating operating hours:', updateById.error);
    throw new Error(`Failed to update operating hours: ${updateById.error.message}`);
  }
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
  const payload = { ...orderData };
  if (!payload.order_id) {
    payload.order_id = await generateUniqueOrderId();
  }

  const { data, error } = await supabase
    .from('orders')
    .insert([payload])
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
  // Only update status and updated_at - never touch placed_at
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
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
  
  // Only update status and updated_at - never touch placed_at
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status: 'Confirmed',
      updated_at: new Date().toISOString()
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
// Get pending orders for staff queue
// Returns orders that are confirmed/queued but not yet assigned to a driver
export async function getPendingOrders() {
  console.log('🔵 getPendingOrders() - Fetching orders for staff queue...');
  
  // First, let's check what orders exist in the database (for debugging)
  const { data: allOrdersDebug, error: debugError } = await supabase
    .from('orders')
    .select('order_id, status, driver_id, placed_at, restaurant_id')
    .order('placed_at', { ascending: false })
    .limit(20);
  
  if (!debugError && allOrdersDebug) {
    console.log('🔍 Recent orders in database:', allOrdersDebug.length);
    allOrdersDebug.forEach((order: any) => {
      const statusLower = String(order.status || '').toLowerCase().trim();
      const isConfirmed = statusLower === 'confirmed';
      const isPending = statusLower === 'pending';
      const hasNoDriver = !order.driver_id;
      const shouldBeInQueue = isConfirmed && hasNoDriver;
      console.log('  -', order.order_id, '| Status:', order.status, '| Driver:', order.driver_id || 'NULL', '| Should be in queue:', shouldBeInQueue);
    });
  } else if (debugError) {
    console.error('❌ Error fetching debug orders:', debugError);
  }
  
  // Specifically check for Confirmed orders (any case variation)
  const { data: confirmedOrdersCheck, error: confirmedError } = await supabase
    .from('orders')
    .select('order_id, status, driver_id')
    .or('status.eq.Confirmed,status.eq.confirmed,status.ilike.confirmed');
  
  if (!confirmedError && confirmedOrdersCheck) {
    const confirmedWithoutDriver = confirmedOrdersCheck.filter((o: any) => !o.driver_id);
    console.log('🔍 Total Confirmed orders in database:', confirmedOrdersCheck.length);
    console.log('🔍 Confirmed orders WITHOUT driver (should be in queue):', confirmedWithoutDriver.length);
    if (confirmedWithoutDriver.length > 0) {
      console.log('🔍 Confirmed order IDs (no driver):', confirmedWithoutDriver.map((o: any) => o.order_id));
    }
  }
  
  // Fetch all orders without driver_id - this is the key filter
  // First, let's try a simple query to see what columns exist
  const { data: testQuery, error: testError } = await supabase
    .from('orders')
    .select('order_id, status, driver_id, restaurant_id, placed_at, total')
    .limit(5);
  
  if (!testError && testQuery) {
    console.log('🔍 Test query successful. Sample order columns:', testQuery[0] ? Object.keys(testQuery[0]) : 'No orders');
    console.log('🔍 Sample order data:', testQuery[0]);
  } else if (testError) {
    console.error('❌ Test query failed:', testError);
    console.error('❌ This might indicate a column name mismatch');
  }
  
  // Now fetch all orders without driver_id
  const { data: allOrders, error: fetchError } = await supabase
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
    .is('driver_id', null) // Only orders without driver assigned
    .order('placed_at', { ascending: true, nullsFirst: false });
  
  if (fetchError) {
    console.error('❌ Error fetching orders:', fetchError);
    console.error('❌ Error details:', {
      message: fetchError.message,
      code: fetchError.code,
      details: fetchError.details,
      hint: fetchError.hint
    });
    throw fetchError;
  }
  
  console.log('📊 Total orders without driver:', allOrders?.length || 0);
  
  // Log what columns we actually got back
  if (allOrders && allOrders.length > 0) {
    console.log('📋 Columns in first order:', Object.keys(allOrders[0]));
    console.log('📋 First order sample:', {
      order_id: allOrders[0].order_id,
      status: allOrders[0].status,
      driver_id: allOrders[0].driver_id,
      restaurant_id: allOrders[0].restaurant_id,
      placed_at: allOrders[0].placed_at
    });
  }
  
  // Log each order's status for debugging BEFORE filtering
  if (allOrders && allOrders.length > 0) {
    console.log('📋 Orders without driver and their statuses:');
    allOrders.forEach((order: any) => {
      const statusStr = String(order.status || 'NULL');
      const statusLower = statusStr.toLowerCase().trim();
      const isPending = statusLower === 'pending';
      const isConfirmed = statusLower === 'confirmed';
      console.log('  -', order.order_id, '| Status:', statusStr, '| Lowercase:', statusLower, '| IsPending:', isPending, '| IsConfirmed:', isConfirmed);
    });
  }
  
  // Filter by status in JavaScript (case-insensitive)
  // ONLY include orders with status 'Confirmed' - exclude 'Pending' and all other statuses
  const pendingOrders = (allOrders || []).filter((order: any) => {
    if (!order.status) {
      console.log('⚠️ Order', order.order_id, 'has no status - excluding');
      return false;
    }
    
    // Normalize status: trim whitespace and convert to lowercase for comparison
    const status = String(order.status).toLowerCase().trim();
    
    // ONLY include orders with status 'confirmed' (case-insensitive)
    // This handles: 'Confirmed', 'confirmed', 'CONFIRMED', etc.
    // Exclude 'Pending' and all other statuses
    const isValid = status === 'confirmed';
    
    if (isValid) {
      console.log('✅ Order', order.order_id, 'with status', order.status, '(normalized:', status, ') INCLUDED in queue');
    } else {
      console.log('⚠️ Order', order.order_id, 'has status', order.status, '(normalized:', status, ') - NOT included (only Confirmed allowed, not Pending)');
    }
    
    return isValid;
  });
  
  console.log('✅ Found', pendingOrders.length, 'orders in queue (out of', allOrders?.length || 0, 'total without driver)');
  
  // Debug: Log all unique statuses found
  if (allOrders && allOrders.length > 0) {
    const uniqueStatuses = [...new Set(allOrders.map((o: any) => o.status))];
    console.log('🔍 All statuses found (without driver):', uniqueStatuses);
    console.log('🔍 Status counts:', uniqueStatuses.map(s => ({
      status: s,
      count: allOrders.filter((o: any) => o.status === s).length,
      normalized: String(s).toLowerCase().trim(),
      isIncluded: String(s).toLowerCase().trim() === 'confirmed'
    })));
    
    // Specifically check for Confirmed orders
    const confirmedOrders = allOrders.filter((o: any) => 
      String(o.status).toLowerCase().trim() === 'confirmed'
    );
    console.log('🔍 Confirmed orders found (without driver):', confirmedOrders.length);
    if (confirmedOrders.length > 0) {
      console.log('🔍 Confirmed order IDs:', confirmedOrders.map((o: any) => o.order_id));
    }
  }
  
  if (pendingOrders.length > 0) {
    console.log('✅ Sample order:', {
      order_id: pendingOrders[0].order_id,
      status: pendingOrders[0].status,
      restaurant_id: pendingOrders[0].restaurant_id,
      driver_id: pendingOrders[0].driver_id,
      placed_at: pendingOrders[0].placed_at,
      total: pendingOrders[0].total
    });
  } else {
    console.warn('⚠️ No orders in queue!');
    if (allOrders && allOrders.length > 0) {
      console.warn('⚠️ Found', allOrders.length, 'orders without driver, but none match confirmed status');
      console.warn('⚠️ Orders have statuses:', [...new Set(allOrders.map((o: any) => o.status))]);
      
      // Check if there are any Confirmed orders that should be included
      const confirmedCount = allOrders.filter((o: any) => 
        String(o.status).toLowerCase().trim() === 'confirmed'
      ).length;
      if (confirmedCount > 0) {
        console.error('❌ ERROR: Found', confirmedCount, 'Confirmed orders but they are not in the queue!');
        console.error('❌ This indicates a bug in the filter logic');
      }
    } else {
      console.warn('⚠️ No orders found in database without driver_id');
    }
  }
  
  // Fetch restaurant details for each order
  const ordersWithRestaurants = await Promise.all(
    pendingOrders.map(async (order: any) => {
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
  
  console.log('✅ Returning', ordersWithRestaurants.length, 'orders with restaurant details');
  console.log('✅ Order IDs being returned:', ordersWithRestaurants.map((o: any) => o.order_id));
  
  // CRITICAL: Make sure we're actually returning the orders, not an empty array
  if (ordersWithRestaurants.length === 0 && pendingOrders.length > 0) {
    console.error('❌ ERROR: pendingOrders has', pendingOrders.length, 'orders but ordersWithRestaurants is empty!');
    // Return pendingOrders even if restaurant fetch failed
    return pendingOrders;
  }
  
  return ordersWithRestaurants;
}

// Get orders assigned to a staff member with Active status (driver assigned)
export async function getStaffActiveOrders(staffId: string) {
  console.log('🔵 getStaffActiveOrders() - Fetching active orders for staff:', staffId);
  
  // First, let's check what active orders exist in the database (for debugging)
  const { data: allActiveDebug, error: debugError } = await supabase
    .from('orders')
    .select('order_id, status, driver_id')
    .ilike('status', 'active') // Case-insensitive match
    .order('updated_at', { ascending: false });

  if (!debugError && allActiveDebug) {
    console.log('🔍 All Active orders in database:', allActiveDebug.length);
    allActiveDebug.forEach((order: any) => {
      console.log('  -', order.order_id, '| Status:', order.status, '| Driver:', order.driver_id || 'NULL');
    });
  }
  
  // Fetch all active orders (no staff_id filtering needed)
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .ilike('status', 'active') // Case-insensitive match for 'Active' status
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching active orders:', error);
    throw error;
  }
  
  console.log('✅ Found', data?.length || 0, 'active orders');
  
  if (data && data.length > 0) {
    console.log('📋 Active order IDs:', data.map((o: any) => o.order_id));
    console.log('📋 Active order statuses:', [...new Set(data.map((o: any) => o.status))]);
  }
  
  // Fetch restaurant details separately (like in getPendingOrders)
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
        order.restaurants = null;
      }
      return order;
    })
  );
  
  return ordersWithRestaurants;
}

// Get delivered orders for a staff member (today's deliveries)
export async function getStaffDeliveredOrders(staffId: string) {
  console.log('🔵 getStaffDeliveredOrders() - Fetching delivered orders for staff:', staffId);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();
  
  // Fetch orders first (without restaurant join to avoid column errors)
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('status', 'Delivered')
    .gte('delivered_at', todayStart) // Only today's deliveries
    .order('delivered_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching delivered orders:', error);
    throw error;
  }
  
  console.log('✅ Found', data?.length || 0, 'delivered orders today for staff');
  
  // Fetch restaurant details separately (like in getPendingOrders)
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
        order.restaurants = null;
      }
      return order;
    })
  );
  
  return ordersWithRestaurants;
}

// Assign order to staff member (retrieve from queue)
// This assigns the order to staff but keeps it in queue until driver is assigned
export async function assignOrderToStaff(orderId: string, staffId: string) {
  console.log('Assigning order to staff:', orderId, staffId);
  
  // Update updated_at, but keep status as Confirmed (Queued)
  // Status will change to Active when driver is assigned
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      updated_at: new Date().toISOString()
      // Don't change status - keep it as Confirmed (Queued) until driver assigned
    })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error assigning order to staff:', error);
    throw error;
  }
  
  console.log('Order assigned to staff:', data);
  return data as Order;
}

// Assign driver to order - sets status to Active, marks driver unavailable
export async function assignDriverToOrder(orderId: string, driverId: string, staffId: string) {
  console.log('🔵 assignDriverToOrder() - Assigning driver', driverId, 'to order', orderId);
  
  // First, mark the driver as unavailable
  const { error: driverError } = await supabase
    .from('drivers')
    .update({ 
      is_available: false
    })
    .eq('driver_id', driverId);

  if (driverError) {
    console.error('❌ Error updating driver availability:', driverError);
    throw new Error(`Failed to update driver availability: ${driverError.message}`);
  }
  
  console.log('✅ Driver marked as unavailable');

  // Then update the order: set driver_id, status to Active
  const updateData: any = {
    driver_id: driverId,
    status: 'Active',
    updated_at: new Date().toISOString()
  };

  console.log('🔵 Updating order with:', updateData);

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error assigning driver to order:', error);
    // If order update fails, try to revert driver availability
    await supabase
      .from('drivers')
      .update({ is_available: true })
      .eq('driver_id', driverId);
    throw error;
  }

  console.log('✅ Order updated successfully:', data.order_id, 'Status:', data.status);
  return data as Order;
}

// Confirm delivery - sets status to Delivered, records delivered_at, makes driver available again
export async function confirmDelivery(orderId: string, deliveredAt: string) {
  console.log('🔵 confirmDelivery() - Confirming delivery for order', orderId);
  
  // First get the order to find the driver_id
  const { data: orderData, error: fetchError } = await supabase
    .from('orders')
    .select('driver_id')
    .eq('order_id', orderId)
    .single();

  if (fetchError) {
    console.error('❌ Error fetching order for delivery confirmation:', fetchError);
    throw fetchError;
  }

  console.log('✅ Found order with driver_id:', orderData.driver_id);

  // Update the order: set status to Delivered, record delivered_at
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status: 'Delivered',
      delivered_at: deliveredAt,
      updated_at: new Date().toISOString()
    })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error confirming delivery:', error);
    throw error;
  }

  console.log('✅ Order status updated to Delivered');

  // Make the driver available again
  if (orderData.driver_id) {
    const { error: driverError } = await supabase
      .from('drivers')
      .update({ 
        is_available: true
      })
      .eq('driver_id', orderData.driver_id);

    if (driverError) {
      console.error('⚠️ Error updating driver availability after delivery:', driverError);
      // Don't throw - delivery is confirmed, driver availability update is secondary
    } else {
      console.log('✅ Driver marked as available again');
    }
  }

  return data as Order;
}

// Get staff member by username
export async function getStaffByUsername(username: string) {
  console.log('🔵 getStaffByUsername() - Looking up staff:', username);
  
  // Don't use .single() - it throws when there are 0 rows
  // Instead, fetch and handle the result
  // Try different possible column names for username
  let { data, error } = await supabase
    .from('staffuser')
    .select('*')
    .eq('username', username)
    .limit(1);

  // If that fails, try other possible column names
  if (error || !data || data.length === 0) {
    console.log('⚠️ Username column lookup failed, trying alternative column names...');
    const { data: data2, error: error2 } = await supabase
      .from('staffuser')
      .select('*')
      .or(`username.eq.${username},Username.eq.${username},user_name.eq.${username}`)
      .limit(1);
    
    if (!error2 && data2 && data2.length > 0) {
      data = data2;
      error = null;
    }
  }

  if (error) {
    console.error('❌ Error fetching staff member:', error);
    // Don't throw - return null so caller can handle gracefully
    return null;
  }
  
  if (!data || data.length === 0) {
    console.warn('⚠️ No staff member found with username:', username);
    // Return null instead of throwing - let the caller handle it
    return null;
  }
  
  const staffData = data[0];
  console.log('✅ Found staff member:', staffData.username || staffData.Username || 'unknown');
  
  // Map the data to match StaffMember interface
  const mapped: any = {
    id: staffData.id || staffData.username || username,
    username: staffData.username || staffData.Username || username,
    name: staffData.name || `${staffData.firstname || ''} ${staffData.lastname || ''}`.trim() || username,
    firstname: staffData.firstname || staffData.first_name || '',
    lastname: staffData.lastname || staffData.last_name || '',
    role: staffData.role || 'support',
    email: staffData.email || `${username}@frontdash.app`,
    password_hash: staffData.password_hash,
    first_time_login: staffData.first_time_login !== undefined ? staffData.first_time_login : false
  };
  
  return mapped as StaffMember;
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
    // Filter to only show active drivers who are available
    .filter((driver: Driver) => {
      return driver.employment_status === 'active' && driver.is_available === true;
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


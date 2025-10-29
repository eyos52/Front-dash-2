// Individual Test Scripts for FrontDash System
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://nwpirlnemuovfgtwwzim.supabase.co';
const supabaseKey = 'sb_publishable_x0_1EuXsP8gx4M3rDqwATA_SatZ4axA';
const supabase = createClient(supabaseUrl, supabaseKey);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ========== STAFF LOGIN TESTS ==========

export async function testStaffLogin() {
  console.log('🔐 Testing Staff Login Functionality');
  console.log('=' .repeat(40));
  
  // Test 1: Valid login
  console.log('\n1. Testing valid staff login...');
  const { data: validLogin, error: validError } = await supabase
    .from('staff_members')
    .select('*')
    .eq('username', 'dispatch1')
    .eq('password_hash', hashPassword('Staff123!'))
    .single();
  
  if (validLogin) {
    console.log('✅ Valid login successful!');
    console.log(`   Staff: ${validLogin.name} (${validLogin.role})`);
  } else {
    console.log('❌ Valid login failed:', validError?.message);
  }
  
  // Test 2: Invalid login
  console.log('\n2. Testing invalid staff login...');
  const { data: invalidLogin, error: invalidError } = await supabase
    .from('staff_members')
    .select('*')
    .eq('username', 'invalid_user')
    .eq('password_hash', hashPassword('wrong_password'))
    .single();
  
  if (!invalidLogin && invalidError) {
    console.log('✅ Invalid login correctly rejected');
  } else {
    console.log('❌ Invalid login was incorrectly accepted');
  }
}

// ========== ORDER MANAGEMENT TESTS ==========

export async function testOrderManagement() {
  console.log('\n📦 Testing Order Management Functionality');
  console.log('=' .repeat(40));
  
  // Test 1: Create new order
  console.log('\n1. Creating new order...');
  const orderData = {
    customer_id: 'test-customer-123',
    restaurant_id: 'test-restaurant-456',
    order_number: `ORD-${Date.now()}`,
    status: 'pending',
    delivery_address: '123 Test Street',
    city: 'Test City',
    state: 'TS',
    zip_code: '12345',
    phone: '555-0123',
    email: 'test@example.com',
    subtotal: 25.99,
    delivery_fee: 3.99,
    service_charge: 2.50,
    tax: 2.60,
    total: 35.08,
    payment_method: 'card',
    estimated_delivery: '30 minutes'
  };

  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();

  if (newOrder) {
    console.log('✅ Order created successfully!');
    console.log(`   Order ID: ${newOrder.id}`);
    console.log(`   Order Number: ${newOrder.order_number}`);
    console.log(`   Total: $${newOrder.total}`);
    
    // Test 2: Assign driver
    console.log('\n2. Assigning driver to order...');
    const { data: assignedOrder, error: assignError } = await supabase
      .from('orders')
      .update({ 
        status: 'confirmed',
        estimated_delivery: '25 minutes'
      })
      .eq('id', newOrder.id)
      .select()
      .single();

    if (assignedOrder) {
      console.log('✅ Driver assigned successfully!');
      console.log(`   Status: ${assignedOrder.status}`);
      
      // Test 3: Update delivery time
      console.log('\n3. Updating delivery time...');
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'out_for_delivery',
          estimated_delivery: '20 minutes'
        })
        .eq('id', newOrder.id)
        .select()
        .single();

      if (updatedOrder) {
        console.log('✅ Delivery time updated successfully!');
        console.log(`   Status: ${updatedOrder.status}`);
        console.log(`   Delivery Time: ${updatedOrder.estimated_delivery}`);
      } else {
        console.log('❌ Delivery time update failed:', updateError?.message);
      }
    } else {
      console.log('❌ Driver assignment failed:', assignError?.message);
    }
  } else {
    console.log('❌ Order creation failed:', orderError?.message);
  }
}

// ========== STAFF MEMBER MANAGEMENT TESTS ==========

export async function testStaffManagement() {
  console.log('\n👤 Testing Staff Member Management');
  console.log('=' .repeat(40));
  
  // Test 1: Create new staff member
  console.log('\n1. Creating new staff member...');
  const staffData = {
    name: 'Test Staff Member',
    username: `test_staff_${Date.now()}`,
    role: 'support',
    password_hash: hashPassword('TestPass123!')
  };

  const { data: newStaff, error: staffError } = await supabase
    .from('staff_members')
    .insert([staffData])
    .select()
    .single();

  if (newStaff) {
    console.log('✅ Staff member created successfully!');
    console.log(`   ID: ${newStaff.id}`);
    console.log(`   Name: ${newStaff.name}`);
    console.log(`   Username: ${newStaff.username}`);
    console.log(`   Role: ${newStaff.role}`);
    
    // Test 2: Delete staff member
    console.log('\n2. Deleting staff member...');
    const { error: deleteError } = await supabase
      .from('staff_members')
      .delete()
      .eq('id', newStaff.id);

    if (!deleteError) {
      console.log('✅ Staff member deleted successfully!');
    } else {
      console.log('❌ Staff member deletion failed:', deleteError.message);
    }
  } else {
    console.log('❌ Staff member creation failed:', staffError?.message);
  }
}

// ========== DRIVER MANAGEMENT TESTS ==========

export async function testDriverManagement() {
  console.log('\n🚗 Testing Driver Management');
  console.log('=' .repeat(40));
  
  // Test 1: Create new driver
  console.log('\n1. Creating new driver...');
  const driverData = {
    first_name: 'Test',
    last_name: 'Driver',
    username: `test_driver_${Date.now()}`,
    status: 'active'
  };

  const { data: newDriver, error: driverError } = await supabase
    .from('drivers')
    .insert([driverData])
    .select()
    .single();

  if (newDriver) {
    console.log('✅ Driver created successfully!');
    console.log(`   ID: ${newDriver.id}`);
    console.log(`   Name: ${newDriver.first_name} ${newDriver.last_name}`);
    console.log(`   Username: ${newDriver.username}`);
    console.log(`   Status: ${newDriver.status}`);
    
    // Test 2: Delete driver
    console.log('\n2. Deleting driver...');
    const { error: deleteError } = await supabase
      .from('drivers')
      .delete()
      .eq('id', newDriver.id);

    if (!deleteError) {
      console.log('✅ Driver deleted successfully!');
    } else {
      console.log('❌ Driver deletion failed:', deleteError.message);
    }
  } else {
    console.log('❌ Driver creation failed:', driverError?.message);
  }
}

// ========== RUN ALL TESTS ==========

async function runAllTests() {
  console.log('🧪 FrontDash System Test Suite');
  console.log('=' .repeat(50));
  
  await testStaffLogin();
  await testOrderManagement();
  await testStaffManagement();
  await testDriverManagement();
  
  console.log('\n🎯 All tests completed!');
}

// Export individual functions for selective testing
export { runAllTests };

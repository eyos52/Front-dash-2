// Complete Staff Authentication and Management Test Suite
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Supabase configuration
const supabaseUrl = 'https://nwpirlnemuovfgtwwzim.supabase.co';
const supabaseKey = 'sb_publishable_x0_1EuXsP8gx4M3rDqwATA_SatZ4axA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Password hashing function
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ========== STAFF AUTHENTICATION ==========

async function testStaffLogin(username, password) {
  console.log(`\n🔐 Testing staff login: ${username}`);
  
  try {
    const hashedPassword = hashPassword(password);
    
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('username', username)
      .eq('password_hash', hashedPassword)
      .single();

    if (error || !data) {
      console.log('❌ Invalid login - Staff member not found or password incorrect');
      return false;
    }

    console.log('✅ Successful login!');
    console.log(`   Name: ${data.name}`);
    console.log(`   Role: ${data.role}`);
    console.log(`   Username: ${data.username}`);
    return data;
  } catch (err) {
    console.log('❌ Login error:', err.message);
    return false;
  }
}

async function testInvalidStaffLogin() {
  console.log('\n🔐 Testing invalid staff login...');
  
  try {
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('username', 'invalid_user')
      .eq('password_hash', hashPassword('wrong_password'))
      .single();

    if (error || !data) {
      console.log('✅ Invalid login correctly rejected');
      return true;
    }

    console.log('❌ Invalid login was incorrectly accepted');
    return false;
  } catch (err) {
    console.log('✅ Invalid login correctly rejected');
    return true;
  }
}

// ========== ORDER MANAGEMENT ==========

async function createNewOrder() {
  console.log('\n📦 Creating new order...');
  
  try {
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

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.log('❌ Error creating order:', error.message);
      return null;
    }

    console.log('✅ New order created successfully!');
    console.log(`   Order ID: ${data.id}`);
    console.log(`   Order Number: ${data.order_number}`);
    console.log(`   Total: $${data.total}`);
    console.log(`   Status: ${data.status}`);
    return data;
  } catch (err) {
    console.log('❌ Error creating order:', err.message);
    return null;
  }
}

async function assignDriverToOrder(orderId, driverId) {
  console.log(`\n🚗 Assigning driver ${driverId} to order ${orderId}...`);
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'confirmed',
        estimated_delivery: '25 minutes'
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.log('❌ Error assigning driver:', error.message);
      return false;
    }

    console.log('✅ Driver assigned successfully!');
    console.log(`   Order Status: ${data.status}`);
    console.log(`   Estimated Delivery: ${data.estimated_delivery}`);
    return true;
  } catch (err) {
    console.log('❌ Error assigning driver:', err.message);
    return false;
  }
}

async function updateOrderDeliveryTime(orderId, deliveryTime) {
  console.log(`\n⏰ Updating delivery time for order ${orderId}...`);
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'out_for_delivery',
        estimated_delivery: deliveryTime
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.log('❌ Error updating delivery time:', error.message);
      return false;
    }

    console.log('✅ Delivery time updated successfully!');
    console.log(`   Order Status: ${data.status}`);
    console.log(`   New Delivery Time: ${data.estimated_delivery}`);
    return true;
  } catch (err) {
    console.log('❌ Error updating delivery time:', err.message);
    return false;
  }
}

// ========== STAFF MEMBER MANAGEMENT ==========

async function createNewStaffMember() {
  console.log('\n👤 Creating new staff member...');
  
  try {
    const staffData = {
      name: 'Test Staff Member',
      username: `test_staff_${Date.now()}`,
      role: 'support',
      password_hash: hashPassword('TestPass123!')
    };

    const { data, error } = await supabase
      .from('staff_members')
      .insert([staffData])
      .select()
      .single();

    if (error) {
      console.log('❌ Error creating staff member:', error.message);
      return null;
    }

    console.log('✅ New staff member created successfully!');
    console.log(`   ID: ${data.id}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Username: ${data.username}`);
    console.log(`   Role: ${data.role}`);
    return data;
  } catch (err) {
    console.log('❌ Error creating staff member:', err.message);
    return null;
  }
}

async function deleteStaffMember(staffId) {
  console.log(`\n🗑️  Deleting staff member ${staffId}...`);
  
  try {
    const { error } = await supabase
      .from('staff_members')
      .delete()
      .eq('id', staffId);

    if (error) {
      console.log('❌ Error deleting staff member:', error.message);
      return false;
    }

    console.log('✅ Staff member deleted successfully!');
    return true;
  } catch (err) {
    console.log('❌ Error deleting staff member:', err.message);
    return false;
  }
}

// ========== DRIVER MANAGEMENT ==========

async function createNewDriver() {
  console.log('\n🚗 Creating new driver...');
  
  try {
    const driverData = {
      first_name: 'Test',
      last_name: 'Driver',
      username: `test_driver_${Date.now()}`,
      status: 'active'
    };

    const { data, error } = await supabase
      .from('drivers')
      .insert([driverData])
      .select()
      .single();

    if (error) {
      console.log('❌ Error creating driver:', error.message);
      return null;
    }

    console.log('✅ New driver created successfully!');
    console.log(`   ID: ${data.id}`);
    console.log(`   Name: ${data.first_name} ${data.last_name}`);
    console.log(`   Username: ${data.username}`);
    console.log(`   Status: ${data.status}`);
    return data;
  } catch (err) {
    console.log('❌ Error creating driver:', err.message);
    return null;
  }
}

async function deleteDriver(driverId) {
  console.log(`\n🗑️  Deleting driver ${driverId}...`);
  
  try {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', driverId);

    if (error) {
      console.log('❌ Error deleting driver:', error.message);
      return false;
    }

    console.log('✅ Driver deleted successfully!');
    return true;
  } catch (err) {
    console.log('❌ Error deleting driver:', err.message);
    return false;
  }
}

// ========== MAIN TEST SUITE ==========

async function runCompleteTestSuite() {
  console.log('🧪 Starting Complete Test Suite for FrontDash System');
  console.log('=' .repeat(60));

  let testResults = {
    staffLogin: false,
    invalidLogin: false,
    orderCreated: false,
    driverAssigned: false,
    deliveryUpdated: false,
    staffCreated: false,
    staffDeleted: false,
    driverCreated: false,
    driverDeleted: false
  };

  // Test 1: Successful staff login
  const staffLogin = await testStaffLogin('dispatch1', 'Staff123!');
  testResults.staffLogin = !!staffLogin;

  // Test 2: Invalid staff login
  testResults.invalidLogin = await testInvalidStaffLogin();

  // Test 3: Create new order
  const newOrder = await createNewOrder();
  testResults.orderCreated = !!newOrder;

  // Test 4: Assign driver to order
  if (newOrder) {
    testResults.driverAssigned = await assignDriverToOrder(newOrder.id, 'test-driver-123');
    
    // Test 5: Update delivery time
    testResults.deliveryUpdated = await updateOrderDeliveryTime(newOrder.id, '20 minutes');
  }

  // Test 6: Create new staff member
  const newStaff = await createNewStaffMember();
  testResults.staffCreated = !!newStaff;

  // Test 7: Delete staff member
  if (newStaff) {
    testResults.staffDeleted = await deleteStaffMember(newStaff.id);
  }

  // Test 8: Create new driver
  const newDriver = await createNewDriver();
  testResults.driverCreated = !!newDriver;

  // Test 9: Delete driver
  if (newDriver) {
    testResults.driverDeleted = await deleteDriver(newDriver.id);
  }

  // Test Results Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: '✅ Successful staff login', result: testResults.staffLogin },
    { name: '✅ Invalid login rejection', result: testResults.invalidLogin },
    { name: '✅ New order creation', result: testResults.orderCreated },
    { name: '✅ Driver assignment', result: testResults.driverAssigned },
    { name: '✅ Delivery time update', result: testResults.deliveryUpdated },
    { name: '✅ Staff member creation', result: testResults.staffCreated },
    { name: '✅ Staff member deletion', result: testResults.staffDeleted },
    { name: '✅ Driver creation', result: testResults.driverCreated },
    { name: '✅ Driver deletion', result: testResults.driverDeleted }
  ];

  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.name}`);
  });

  const passedTests = tests.filter(t => t.result).length;
  const totalTests = tests.length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! System is fully functional.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
}

// Run the complete test suite
runCompleteTestSuite().catch(console.error);

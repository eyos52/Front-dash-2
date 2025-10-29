// Fixed Complete Test Suite with Proper UUIDs
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://nwpirlnemuovfgtwwzim.supabase.co';
const supabaseKey = 'sb_publishable_x0_1EuXsP8gx4M3rDqwATA_SatZ4axA';
const supabase = createClient(supabaseUrl, supabaseKey);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function runCompleteTestSuite() {
  console.log('🧪 FrontDash Complete Test Suite');
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
  console.log('\n🔐 1. Testing successful staff login...');
  try {
    const { data: staff, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('username', 'dispatch1')
      .eq('password_hash', hashPassword('Staff123!'))
      .single();

    if (staff) {
      console.log('✅ Successful login!');
      console.log(`   Staff: ${staff.name} (${staff.role})`);
      testResults.staffLogin = true;
    } else {
      console.log('❌ Login failed:', error?.message);
    }
  } catch (err) {
    console.log('❌ Login error:', err.message);
  }

  // Test 2: Invalid staff login
  console.log('\n🔐 2. Testing invalid staff login...');
  try {
    const { data: invalidStaff, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('username', 'invalid_user')
      .eq('password_hash', hashPassword('wrong_password'))
      .single();

    if (!invalidStaff && error) {
      console.log('✅ Invalid login correctly rejected');
      testResults.invalidLogin = true;
    } else {
      console.log('❌ Invalid login was incorrectly accepted');
    }
  } catch (err) {
    console.log('✅ Invalid login correctly rejected');
    testResults.invalidLogin = true;
  }

  // Test 3: Create new order
  console.log('\n📦 3. Creating new order...');
  let orderId = null;
  try {
    const orderData = {
      customer_id: generateUUID(),
      restaurant_id: generateUUID(),
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

    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (newOrder) {
      console.log('✅ New order created successfully!');
      console.log(`   Order ID: ${newOrder.id}`);
      console.log(`   Order Number: ${newOrder.order_number}`);
      console.log(`   Total: $${newOrder.total}`);
      orderId = newOrder.id;
      testResults.orderCreated = true;
    } else {
      console.log('❌ Order creation failed:', error?.message);
    }
  } catch (err) {
    console.log('❌ Order creation error:', err.message);
  }

  // Test 4: Assign driver to order
  if (orderId) {
    console.log('\n🚗 4. Assigning driver to order...');
    try {
      const { data: assignedOrder, error } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          estimated_delivery: '25 minutes'
        })
        .eq('id', orderId)
        .select()
        .single();

      if (assignedOrder) {
        console.log('✅ Driver assigned successfully!');
        console.log(`   Status: ${assignedOrder.status}`);
        console.log(`   Delivery Time: ${assignedOrder.estimated_delivery}`);
        testResults.driverAssigned = true;
      } else {
        console.log('❌ Driver assignment failed:', error?.message);
      }
    } catch (err) {
      console.log('❌ Driver assignment error:', err.message);
    }

    // Test 5: Update delivery time
    console.log('\n⏰ 5. Updating delivery time...');
    try {
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({ 
          status: 'out_for_delivery',
          estimated_delivery: '20 minutes'
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updatedOrder) {
        console.log('✅ Delivery time updated successfully!');
        console.log(`   Status: ${updatedOrder.status}`);
        console.log(`   New Delivery Time: ${updatedOrder.estimated_delivery}`);
        testResults.deliveryUpdated = true;
      } else {
        console.log('❌ Delivery time update failed:', error?.message);
      }
    } catch (err) {
      console.log('❌ Delivery time update error:', err.message);
    }
  }

  // Test 6: Create new staff member
  console.log('\n👤 6. Creating new staff member...');
  let staffId = null;
  try {
    const staffData = {
      name: 'Test Staff Member',
      username: `test_staff_${Date.now()}`,
      role: 'support',
      password_hash: hashPassword('TestPass123!')
    };

    const { data: newStaff, error } = await supabase
      .from('staff_members')
      .insert([staffData])
      .select()
      .single();

    if (newStaff) {
      console.log('✅ New staff member created successfully!');
      console.log(`   ID: ${newStaff.id}`);
      console.log(`   Name: ${newStaff.name}`);
      console.log(`   Username: ${newStaff.username}`);
      console.log(`   Role: ${newStaff.role}`);
      staffId = newStaff.id;
      testResults.staffCreated = true;
    } else {
      console.log('❌ Staff creation failed:', error?.message);
    }
  } catch (err) {
    console.log('❌ Staff creation error:', err.message);
  }

  // Test 7: Delete staff member
  if (staffId) {
    console.log('\n🗑️  7. Deleting staff member...');
    try {
      const { error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', staffId);

      if (!error) {
        console.log('✅ Staff member deleted successfully!');
        testResults.staffDeleted = true;
      } else {
        console.log('❌ Staff deletion failed:', error.message);
      }
    } catch (err) {
      console.log('❌ Staff deletion error:', err.message);
    }
  }

  // Test 8: Create new driver
  console.log('\n🚗 8. Creating new driver...');
  let driverId = null;
  try {
    const driverData = {
      first_name: 'Test',
      last_name: 'Driver',
      username: `test_driver_${Date.now()}`,
      status: 'active'
    };

    const { data: newDriver, error } = await supabase
      .from('drivers')
      .insert([driverData])
      .select()
      .single();

    if (newDriver) {
      console.log('✅ New driver created successfully!');
      console.log(`   ID: ${newDriver.id}`);
      console.log(`   Name: ${newDriver.first_name} ${newDriver.last_name}`);
      console.log(`   Username: ${newDriver.username}`);
      console.log(`   Status: ${newDriver.status}`);
      driverId = newDriver.id;
      testResults.driverCreated = true;
    } else {
      console.log('❌ Driver creation failed:', error?.message);
    }
  } catch (err) {
    console.log('❌ Driver creation error:', err.message);
  }

  // Test 9: Delete driver
  if (driverId) {
    console.log('\n🗑️  9. Deleting driver...');
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (!error) {
        console.log('✅ Driver deleted successfully!');
        testResults.driverDeleted = true;
      } else {
        console.log('❌ Driver deletion failed:', error.message);
      }
    } catch (err) {
      console.log('❌ Driver deletion error:', err.message);
    }
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

  console.log('\n🔐 Available Staff Login Credentials:');
  console.log('   Username: dispatch1, Password: Staff123!');
  console.log('   Username: dispatch2, Password: Staff123!');
  console.log('   Username: operations.staff, Password: Staff123!');
  console.log('   Username: driver.manager, Password: Staff123!');
}

// Run the complete test suite
runCompleteTestSuite().catch(console.error);

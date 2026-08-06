/**
 * Test Script for Admin Enhancements
 *
 * This script creates test data for:
 * 1. Admin Order (no table)
 * 2. Regular table order for editing
 * 3. Test FCM token
 *
 * Run with: npx tsx scripts/test-admin-enhancements.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestData {
  orderIds: string[];
  adminOrderId: string | null;
  tableOrderId: string | null;
}

const testData: TestData = {
  orderIds: [],
  adminOrderId: null,
  tableOrderId: null,
};

async function createTestAdminOrder() {
  console.log('\n🧪 TEST 1: Creating Admin Order (no table assignment)...');

  try {
    // Fetch some menu items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price')
      .limit(3);

    if (menuError) throw menuError;

    if (!menuItems || menuItems.length === 0) {
      console.log('❌ No menu items found. Please add menu items first.');
      return;
    }

    const subtotal = menuItems.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal * 0.9; // 10% discount applied

    // Create admin order (table_number = null)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_number: null, // ADMIN ORDER
        subtotal,
        total,
        status: 'confirmed',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    testData.adminOrderId = order.id;
    testData.orderIds.push(order.id);

    // Add order items
    const orderItems = menuItems.map(item => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: 1,
      price: item.price,
      name: item.name,
      special_instructions: null,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    console.log(`✅ Admin Order created: ${order.id}`);
    console.log(`   - Items: ${menuItems.map(i => i.name).join(', ')}`);
    console.log(`   - Total: ₹${total.toFixed(2)}`);
  } catch (error: any) {
    console.error('❌ Failed to create admin order:', error.message);
  }
}

async function createTestTableOrder() {
  console.log('\n🧪 TEST 2: Creating Table Order for editing...');

  try {
    // Fetch some different menu items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price')
      .limit(4);

    if (menuError) throw menuError;

    if (!menuItems || menuItems.length === 0) {
      console.log('❌ No menu items found.');
      return;
    }

    const subtotal = menuItems.reduce((sum, item) => sum + item.price * 2, 0);
    const total = subtotal * 0.9; // 10% discount applied

    // Create table order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_number: 'TEST-99', // Test table
        subtotal,
        total,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    testData.tableOrderId = order.id;
    testData.orderIds.push(order.id);

    // Add order items (2 of each)
    const orderItems = menuItems.map(item => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: 2,
      price: item.price,
      name: item.name,
      special_instructions: 'Test order - please do not prepare',
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    console.log(`✅ Table Order created: ${order.id}`);
    console.log(`   - Table: TEST-99`);
    console.log(`   - Items: ${menuItems.map(i => `${i.name} x2`).join(', ')}`);
    console.log(`   - Total: ₹${total.toFixed(2)}`);
  } catch (error: any) {
    console.error('❌ Failed to create table order:', error.message);
  }
}

async function createTestFCMToken() {
  console.log('\n🧪 TEST 3: Creating test FCM token...');

  try {
    const testToken = `test_token_${Date.now()}`;

    const { data, error } = await supabase
      .from('fcm_tokens')
      .insert({
        token: testToken,
        device_type: 'android',
        active: true,
        user_id: null, // Will be associated on login
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Test FCM token created: ${testToken.substring(0, 30)}...`);
    console.log(`   - Active: true`);
    console.log(`   - User ID: null (will be set on login)`);
  } catch (error: any) {
    console.error('❌ Failed to create FCM token:', error.message);
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   ADMIN ENHANCEMENTS - TEST DATA CREATION              ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  await createTestAdminOrder();
  await createTestTableOrder();
  await createTestFCMToken();

  console.log('\n' + '═'.repeat(60));
  console.log('📋 TEST DATA SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`Admin Order ID: ${testData.adminOrderId || 'Not created'}`);
  console.log(`Table Order ID: ${testData.tableOrderId || 'Not created'}`);
  console.log(`Total Orders Created: ${testData.orderIds.length}`);
  console.log('═'.repeat(60));

  console.log('\n✅ Test data created successfully!');
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Go to /admin/live-orders');
  console.log('2. You should see:');
  console.log('   - One "Admin Order" (purple badge)');
  console.log('   - One "Table TEST-99" order');
  console.log('3. Test editing the Table TEST-99 order:');
  console.log('   - Click the Edit icon');
  console.log('   - Add/remove items');
  console.log('   - Try removing the 10% discount');
  console.log('   - Try adding a custom discount');
  console.log('   - Save changes');
  console.log('4. Test creating a new admin order:');
  console.log('   - Click "Create Order" button');
  console.log('   - Select items');
  console.log('   - Create order');
  console.log('5. Test settling both orders');
  console.log('6. Test language switching (EN ⟷ GU)');
  console.log('\n⚠️  CLEANUP: Run cleanup script when done testing!');
  console.log('   npx tsx scripts/cleanup-test-data.ts\n');
}

runTests().catch(console.error);

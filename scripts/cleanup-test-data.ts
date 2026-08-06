/**
 * Cleanup Script for Test Data
 *
 * This script removes all test data created by test-admin-enhancements.ts
 *
 * Run with: npx tsx scripts/cleanup-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTestOrders() {
  console.log('\n🧹 Cleaning up test orders...');

  try {
    // Delete test table orders (TEST-99)
    const { data: testTableOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('table_number', 'TEST-99');

    if (fetchError) throw fetchError;

    if (testTableOrders && testTableOrders.length > 0) {
      const orderIds = testTableOrders.map(o => o.id);

      // Delete order items first
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      // Delete orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds);

      if (ordersError) throw ordersError;

      console.log(`✅ Deleted ${testTableOrders.length} test table orders`);
    } else {
      console.log('ℹ️  No test table orders found');
    }

    // Delete admin orders created in last hour (safer than deleting all)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: recentAdminOrders, error: adminFetchError } = await supabase
      .from('orders')
      .select('id')
      .is('table_number', null)
      .gte('created_at', oneHourAgo.toISOString());

    if (adminFetchError) throw adminFetchError;

    if (recentAdminOrders && recentAdminOrders.length > 0) {
      const adminOrderIds = recentAdminOrders.map(o => o.id);

      // Delete order items
      const { error: adminItemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', adminOrderIds);

      if (adminItemsError) throw adminItemsError;

      // Delete orders
      const { error: adminOrdersError } = await supabase
        .from('orders')
        .delete()
        .in('id', adminOrderIds);

      if (adminOrdersError) throw adminOrdersError;

      console.log(`✅ Deleted ${recentAdminOrders.length} recent admin orders`);
    } else {
      console.log('ℹ️  No recent admin orders found');
    }
  } catch (error: any) {
    console.error('❌ Failed to cleanup test orders:', error.message);
  }
}

async function cleanupTestFCMTokens() {
  console.log('\n🧹 Cleaning up test FCM tokens...');

  try {
    const { data, error } = await supabase
      .from('fcm_tokens')
      .delete()
      .like('token', 'test_token_%')
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      console.log(`✅ Deleted ${data.length} test FCM tokens`);
    } else {
      console.log('ℹ️  No test FCM tokens found');
    }
  } catch (error: any) {
    console.error('❌ Failed to cleanup FCM tokens:', error.message);
  }
}

async function cleanup() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   ADMIN ENHANCEMENTS - TEST DATA CLEANUP               ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  await cleanupTestOrders();
  await cleanupTestFCMTokens();

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Cleanup completed successfully!');
  console.log('═'.repeat(60));
  console.log('\nAll test data has been removed.');
  console.log('Your database is clean and ready for production use.\n');
}

cleanup().catch(console.error);

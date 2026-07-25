#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotifications() {
  console.log('Testing notification titles...\n');

  // Test 1: Create a buzzer notification
  console.log('1. Testing BUZZER notification (should say "Waiter Called - Table X")...');
  const { data: buzzer, error: buzzerError } = await supabase
    .from('buzzer_notifications')
    .insert({
      table_number: '99',
      status: 'active',
      notification_type: 'service_call'
    })
    .select()
    .single();

  if (buzzerError) {
    console.error('   Error creating buzzer:', buzzerError);
  } else {
    console.log('   ✓ Buzzer notification created:', buzzer.id);
  }

  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Create an order notification
  console.log('\n2. Testing ORDER notification (should say "New Order - Table X")...');

  // First create an order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_number: '88',
      status: 'pending',
      total: 100
    })
    .select()
    .single();

  if (orderError) {
    console.error('   Error creating order:', orderError);
    return;
  }

  console.log('   ✓ Order created:', order.id);

  // Then add an order item (this triggers the notification)
  const { data: item, error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: order.id,
      menu_item_id: 1, // Assuming there's an item with ID 1
      quantity: 1,
      price: 100
    })
    .select()
    .single();

  if (itemError) {
    console.error('   Error creating order item:', itemError);
  } else {
    console.log('   ✓ Order item created:', item.id);
  }

  console.log('\n✓ Test notifications sent!');
  console.log('Check your phone - you should see:');
  console.log('  1. "Waiter Called - Table 99"');
  console.log('  2. "New Order - Table 88"');
}

testNotifications().catch(console.error);

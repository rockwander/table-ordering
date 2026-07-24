import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDatabase() {
  console.log('🗑️  Clearing database...');

  try {
    // Delete all order items first (due to foreign key constraints)
    console.log('Deleting order items...');
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (orderItemsError) {
      console.error('❌ Error deleting order items:', orderItemsError);
    } else {
      console.log('✅ Order items deleted');
    }

    // Delete all orders
    console.log('Deleting orders...');
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (ordersError) {
      console.error('❌ Error deleting orders:', ordersError);
    } else {
      console.log('✅ Orders deleted');
    }

    // Delete all buzzer notifications
    console.log('Deleting buzzer notifications...');
    const { error: buzzerError } = await supabase
      .from('buzzer_notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (buzzerError) {
      console.error('❌ Error deleting buzzer notifications:', buzzerError);
    } else {
      console.log('✅ Buzzer notifications deleted');
    }

    console.log('✨ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

clearDatabase();

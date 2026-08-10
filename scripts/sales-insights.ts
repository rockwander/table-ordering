#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getSalesInsights() {
  console.log('📊 Sales Insights Dashboard\n');
  console.log('='.repeat(70));

  // Fetch all orders with items
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      table_number,
      subtotal,
      total,
      status,
      created_at,
      order_items (
        id,
        name,
        price,
        quantity
      )
    `)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return;
  }

  // Fetch bills
  const { data: bills, error: billsError } = await supabase
    .from('bills')
    .select('*')
    .order('created_at', { ascending: false });

  if (billsError) {
    console.error('Error fetching bills:', billsError);
    return;
  }

  // Calculate metrics
  const totalOrders = orders?.length || 0;
  const paidOrders = orders?.filter(o => o.status === 'paid') || [];
  const unpaidOrders = orders?.filter(o => o.status !== 'paid') || [];
  const totalBills = bills?.length || 0;

  // Revenue calculations
  const totalRevenue = bills?.reduce((sum, bill) => sum + (bill.total || 0), 0) || 0;
  const avgBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;

  // Order value stats
  const orderValues = orders?.map(o => o.total) || [];
  const avgOrderValue = orderValues.length > 0
    ? orderValues.reduce((sum, val) => sum + val, 0) / orderValues.length
    : 0;

  // Item sales analysis
  const itemSales: Record<string, { name: string; quantity: number; revenue: number; orders: number }> = {};

  orders?.forEach(order => {
    order.order_items?.forEach((item: any) => {
      if (!itemSales[item.name]) {
        itemSales[item.name] = {
          name: item.name,
          quantity: 0,
          revenue: 0,
          orders: 0
        };
      }
      itemSales[item.name].quantity += item.quantity;
      itemSales[item.name].revenue += item.price * item.quantity;
      itemSales[item.name].orders += 1;
    });
  });

  // Convert to array and sort by quantity
  const topItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity);

  // Time-based insights
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders?.filter(o => new Date(o.created_at) >= today) || [];
  const todayRevenue = bills?.filter(b => new Date(b.created_at) >= today)
    .reduce((sum, bill) => sum + (bill.total || 0), 0) || 0;

  // Table analysis
  const tableStats: Record<string, { orders: number; revenue: number }> = {};
  orders?.forEach(order => {
    const tableKey = order.table_number ? `Table ${order.table_number}` : 'Admin';
    if (!tableStats[tableKey]) {
      tableStats[tableKey] = { orders: 0, revenue: 0 };
    }
    tableStats[tableKey].orders += 1;
    tableStats[tableKey].revenue += order.total;
  });

  // Print insights
  console.log('\n📈 OVERALL STATISTICS');
  console.log('='.repeat(70));
  console.log(`Total Orders:        ${totalOrders}`);
  console.log(`  - Paid:            ${paidOrders.length}`);
  console.log(`  - Unpaid:          ${unpaidOrders.length}`);
  console.log(`Total Bills:         ${totalBills}`);
  console.log(`Total Revenue:       ₹${totalRevenue.toFixed(2)}`);
  console.log(`Avg Bill Value:      ₹${avgBillValue.toFixed(2)}`);
  console.log(`Avg Order Value:     ₹${avgOrderValue.toFixed(2)}`);

  console.log('\n📅 TODAY\'S STATS');
  console.log('='.repeat(70));
  console.log(`Orders Today:        ${todayOrders.length}`);
  console.log(`Revenue Today:       ₹${todayRevenue.toFixed(2)}`);

  console.log('\n🏆 TOP 10 SELLING ITEMS');
  console.log('='.repeat(70));
  console.log('Rank  Item Name                          Qty    Revenue    Avg/Order');
  console.log('-'.repeat(70));
  topItems.slice(0, 10).forEach((item, idx) => {
    const avgPerOrder = item.revenue / item.orders;
    console.log(
      `${String(idx + 1).padStart(2)}    ${item.name.padEnd(30)} ${String(item.quantity).padStart(5)}  ₹${String(item.revenue.toFixed(0)).padStart(7)}  ₹${avgPerOrder.toFixed(2)}`
    );
  });

  console.log('\n💰 REVENUE BY ITEM (Top 10)');
  console.log('='.repeat(70));
  const topByRevenue = [...topItems].sort((a, b) => b.revenue - a.revenue);
  console.log('Rank  Item Name                          Revenue    Qty    Orders');
  console.log('-'.repeat(70));
  topByRevenue.slice(0, 10).forEach((item, idx) => {
    console.log(
      `${String(idx + 1).padStart(2)}    ${item.name.padEnd(30)} ₹${String(item.revenue.toFixed(0)).padStart(7)}  ${String(item.quantity).padStart(5)}  ${String(item.orders).padStart(5)}`
    );
  });

  console.log('\n🍽️  ORDERS BY TABLE/SOURCE');
  console.log('='.repeat(70));
  const sortedTables = Object.entries(tableStats)
    .sort((a, b) => b[1].orders - a[1].orders);
  console.log('Source                Orders    Revenue    Avg/Order');
  console.log('-'.repeat(70));
  sortedTables.forEach(([table, stats]) => {
    const avgPerOrder = stats.revenue / stats.orders;
    console.log(
      `${table.padEnd(20)} ${String(stats.orders).padStart(5)}     ₹${String(stats.revenue.toFixed(0)).padStart(7)}  ₹${avgPerOrder.toFixed(2)}`
    );
  });

  // Recent orders
  console.log('\n📋 RECENT 5 ORDERS');
  console.log('='.repeat(70));
  const recentOrders = orders?.slice(0, 5) || [];
  recentOrders.forEach(order => {
    const tableLabel = order.table_number ? `Table ${order.table_number}` : 'Admin';
    const date = new Date(order.created_at).toLocaleString();
    console.log(`\n${date} | ${tableLabel} | ${order.status.toUpperCase()} | ₹${order.total.toFixed(2)}`);
    order.order_items?.forEach((item: any) => {
      console.log(`  - ${item.name} x${item.quantity} @ ₹${item.price}`);
    });
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ Insights generated successfully!');
  console.log('='.repeat(70) + '\n');
}

getSalesInsights().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Divider,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import BuzzerNotification from '@/components/BuzzerNotification';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus, BuzzerNotification as BuzzerNotificationType } from '@/types';
import { useRouter } from 'next/navigation';
import { initializeNotifications, showLocalNotification, checkNotificationSupport } from '@/lib/notifications';
import { initializePushNotifications } from '@/lib/fcm-notifications';

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  bill_requested: 'Bill Requested',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const statusColors: Record<OrderStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'primary',
  ready: 'success',
  served: 'success',
  bill_requested: 'secondary',
  paid: 'success',
  cancelled: 'error',
};

interface OrderWithItems extends Order {
  order_items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    special_instructions: string | null;
  }>;
}

interface Bill {
  bill_id: string;
  table_number: string;
  orders: OrderWithItems[];
  total: number;
  settled_at?: string;
}

function DashboardContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buzzerNotifications, setBuzzerNotifications] = useState<BuzzerNotificationType[]>([]);
  const [currentNotification, setCurrentNotification] = useState<BuzzerNotificationType | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<BuzzerNotificationType[]>([]);
  const [viewTab, setViewTab] = useState<'unsettled' | 'settled'>('unsettled');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'order' | 'bill'; id?: string; bill?: Bill } | null>(null);
  const [settlingBill, setSettlingBill] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    pendingTotal: 0,
  });

  // Initialize web push notifications and FCM (for mobile)
  useEffect(() => {
    const setupNotifications = async () => {
      console.log('📱 Setting up notifications...');

      // Initialize FCM for mobile (native app)
      try {
        await initializePushNotifications();
        console.log('✅ FCM push notifications initialized');
        setNotificationsEnabled(true);
      } catch (error) {
        console.log('ℹ️ FCM not available (not on native platform)');
      }

      // Initialize web push notifications (for web)
      const support = checkNotificationSupport();
      console.log('Notification support:', support);

      if (support.supported && support.serviceWorkerSupported) {
        const initialized = await initializeNotifications();
        setNotificationsEnabled(initialized);
        if (initialized) {
          console.log('✅ Web push notifications enabled');
        } else {
          console.warn('⚠️ Web push notifications not enabled - user may need to grant permission');
        }
      } else {
        console.warn('⚠️ Web push notifications not supported on this browser');
      }
    };

    setupNotifications();
  }, []);

  // Handle notification queue - show one at a time
  useEffect(() => {
    if (!currentNotification && notificationQueue.length > 0) {
      const [nextNotification, ...rest] = notificationQueue;
      setCurrentNotification(nextNotification);
      setNotificationQueue(rest);
    }
  }, [currentNotification, notificationQueue]);

  // Debounced refresh to prevent multiple rapid calls
  const refreshTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const debouncedRefresh = React.useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      setRefreshing(true);
      fetchDashboardData();
    }, 500); // Wait 500ms before refreshing
  }, []);

  useEffect(() => {
    console.log('🚀 Dashboard mounted, setting up subscriptions...');
    fetchDashboardData();
    fetchActiveBuzzerNotifications();

    // Subscribe to real-time order updates
    const ordersChannel = supabase
      .channel('dashboard-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('📦 Order change detected:', payload.eventType, payload.new);
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        (payload) => {
          console.log('📝 Order item change detected:', payload.eventType);
          debouncedRefresh();
        }
      )
      .subscribe((status, err) => {
        console.log('📦 Orders channel status:', status);
        if (err) {
          console.error('❌ Orders channel error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to orders updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Orders channel error - check if real-time is enabled');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Orders subscription timed out');
        } else if (status === 'CLOSED') {
          console.error('❌ Orders channel closed');
        }
      });

    // Subscribe to real-time buzzer notifications
    console.log('🔔 Setting up buzzer notifications channel...');
    const buzzerChannel = supabase
      .channel('dashboard-buzzer')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buzzer_notifications',
        },
        async (payload) => {
          console.log('🔔 Buzzer notification received:', payload);
          const newNotification = payload.new as BuzzerNotificationType;
          if (newNotification.status === 'active') {
            console.log('✅ Adding buzzer notification for table:', newNotification.table_number);
            setBuzzerNotifications((prev) => [...prev, newNotification]);
            // Add to queue instead of showing directly
            setNotificationQueue((prev) => [...prev, newNotification]);

            // Show web push notification (works even when screen is off)
            if (notificationsEnabled) {
              const title = newNotification.notification_type === 'service_call'
                ? '🔔 Service Request!'
                : '🍽️ New Order!';
              const body = `Table ${newNotification.table_number} needs assistance`;

              await showLocalNotification(title, {
                body,
                tag: `buzzer-${newNotification.id}`,
                data: {
                  table_number: newNotification.table_number,
                  notification_type: newNotification.notification_type,
                  url: '/admin/dashboard'
                }
              });
              console.log('📱 Push notification sent');
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Buzzer channel status:', status);
        if (err) {
          console.error('❌ Buzzer channel error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to buzzer notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - check if table exists and real-time is enabled');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Subscription timed out');
        } else if (status === 'CLOSED') {
          console.error('❌ Channel closed');
        }
      });

    return () => {
      console.log('🧹 Cleaning up subscriptions...');
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(buzzerChannel);
    };
  }, [debouncedRefresh, notificationsEnabled]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch ALL orders with items
      const { data: allOrdersData, error: allOrdersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (allOrdersError) throw allOrdersError;

      const allOrders: OrderWithItems[] = allOrdersData || [];
      setOrders(allOrders);

      // Calculate stats for today's orders only
      const todayOrders = allOrders.filter(order =>
        new Date(order.created_at) >= today
      );

      const todayOrdersCount = todayOrders.length || 0;
      const todayRevenue =
        todayOrders
          .filter((o) => o.status === 'paid')
          .reduce((sum, o) => sum + o.total, 0) || 0;

      // Pending orders from ALL time
      const allPendingOrders = allOrders.filter((o) => o.status !== 'paid');
      const pendingOrdersCount = allPendingOrders.length || 0;
      const pendingTotal =
        allPendingOrders.reduce((sum, o) => sum + o.total, 0) || 0;

      setStats({
        todayOrders: todayOrdersCount,
        todayRevenue,
        pendingOrders: pendingOrdersCount,
        pendingTotal,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchActiveBuzzerNotifications = async () => {
    try {
      console.log('🔍 Fetching active buzzer notifications...');
      const { data, error } = await supabase
        .from('buzzer_notifications')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} active buzzer notifications`);
        setBuzzerNotifications(data);
        // Add all to queue - they'll be shown one at a time
        setNotificationQueue(data);
      } else {
        console.log('📭 No active buzzer notifications');
      }
    } catch (error) {
      console.error('❌ Error fetching active buzzer notifications:', error);
    }
  };

  const handleDismissBuzzer = async (notificationId: string) => {
    try {
      console.log('🔕 Dismissing buzzer notification:', notificationId);
      // Update the notification status in the database
      await supabase
        .from('buzzer_notifications')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
        .eq('id', notificationId);

      // Remove from local state
      setBuzzerNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );

      // Clear current notification to allow next one to show
      setCurrentNotification(null);
    } catch (error) {
      console.error('❌ Error dismissing buzzer notification:', error);
    }
  };

  const groupOrdersIntoBills = (): Bill[] => {
    let filteredOrders = orders.filter(order =>
      viewTab === 'unsettled' ? order.status !== 'paid' : order.status === 'paid'
    );

    // For settled bills, only show today's settled bills
    if (viewTab === 'settled') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredOrders = filteredOrders.filter(order =>
        new Date(order.updated_at) >= today
      );
    }

    if (viewTab === 'unsettled') {
      // For unsettled: show ALL pending orders (group by table)
      const grouped = filteredOrders.reduce((acc, order) => {
        const tableNum = order.table_number;
        if (!acc[tableNum]) {
          acc[tableNum] = [];
        }
        acc[tableNum].push(order);
        return acc;
      }, {} as Record<string, OrderWithItems[]>);

      return Object.entries(grouped).map(([tableNum, orders]) => ({
        bill_id: `table-${tableNum}-active`,
        table_number: tableNum,
        orders: orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        total: orders.reduce((sum, order) => sum + order.total, 0),
      })).sort((a, b) => {
        // Sort with "counter" first, then natural sort for numbers
        if (a.table_number === 'counter') return -1;
        if (b.table_number === 'counter') return 1;
        // Try to parse as numbers for numeric tables
        const aNum = parseInt(a.table_number);
        const bNum = parseInt(b.table_number);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        // Fallback to string comparison
        return a.table_number.localeCompare(b.table_number);
      });
    } else {
      // For settled: group by table + settlement time (orders settled together = one bill)
      const grouped = filteredOrders.reduce((acc, order) => {
        const tableNum = order.table_number;
        const settledTime = new Date(order.updated_at).toISOString().slice(0, 19); // Group by second
        const billKey = `${tableNum}-${settledTime}`;

        if (!acc[billKey]) {
          acc[billKey] = {
            table_number: tableNum,
            orders: [],
            settled_at: order.updated_at,
          };
        }
        acc[billKey].orders.push(order);
        return acc;
      }, {} as Record<string, { table_number: string; orders: OrderWithItems[]; settled_at: string }>);

      return Object.entries(grouped).map(([billKey, data]) => ({
        bill_id: billKey,
        table_number: data.table_number,
        orders: data.orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        total: data.orders.reduce((sum, order) => sum + order.total, 0),
        settled_at: data.settled_at,
      })).sort((a, b) => new Date(b.settled_at!).getTime() - new Date(a.settled_at!).getTime()); // Most recent first
    }
  };

  const handleSettleBill = async (bill: Bill) => {
    setSettlingBill(bill.bill_id);
    try {
      const orderIds = bill.orders.map(order => order.id);
      const settlementTime = new Date().toISOString();

      // Calculate bill totals
      const billSubtotal = bill.orders.reduce((sum, order) => sum + order.subtotal, 0);
      const billTotal = bill.orders.reduce((sum, order) => sum + order.total, 0);

      // Generate bill number (format: BILL-YYYYMMDD-HHMMSS)
      const now = new Date();
      const billNumber = `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

      // Create bill record
      const { data: billRecord, error: billError } = await supabase
        .from('bills')
        .insert({
          bill_number: billNumber,
          table_number: bill.table_number,
          subtotal: billSubtotal,
          total: billTotal,
          settled_at: settlementTime,
        })
        .select()
        .single();

      if (billError) throw billError;

      // Update orders with bill_id and mark as paid
      const { error: ordersError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          bill_id: billRecord.id,
          updated_at: settlementTime
        })
        .in('id', orderIds);

      if (ordersError) throw ordersError;

      await fetchDashboardData();
    } catch (error) {
      console.error('Error settling bill:', error);
      alert('Failed to settle bill. Please try again.');
    } finally {
      setSettlingBill(null);
    }
  };

  const handlePrintBill = (bill: Bill) => {
    // Create a printable HTML version of the bill
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print bills');
      return;
    }

    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill #${bill.bill_id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { text-align: center; color: #D4691A; }
          .header { text-align: center; margin-bottom: 30px; }
          .bill-info { margin-bottom: 20px; }
          .bill-info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: 600; }
          .text-right { text-align: right; }
          .order-section { margin: 30px 0; }
          .order-header { background-color: #f9f9f9; padding: 10px; margin: 15px 0 10px 0; font-weight: 600; }
          .totals { margin-top: 30px; border-top: 2px solid #333; padding-top: 15px; }
          .total-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          .grand-total { font-size: 18px; font-weight: 700; margin-top: 15px; padding-top: 15px; border-top: 2px solid #333; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Ramani's Cafe</h1>
          <p>Table: ${bill.table_number}</p>
          <p>Date: ${new Date(bill.settled_at || new Date()).toLocaleString()}</p>
        </div>

        ${bill.orders.map((order, index) => `
          <div class="order-section">
            <div class="order-header">Order #${index + 1} - ${new Date(order.created_at).toLocaleTimeString()}</div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.order_items.map(item => `
                  <tr>
                    <td>
                      ${item.name}
                      ${item.special_instructions ? `<br><small style="color: #666;">Note: ${item.special_instructions}</small>` : ''}
                    </td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">₹${item.price.toFixed(2)}</td>
                    <td class="text-right">₹${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${bill.total.toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹${bill.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>Ramani's Cafe - Premium South Indian Cuisine</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 30px; background: #D4691A; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Print Bill</button>
          <button onclick="window.close()" style="padding: 10px 30px; background: #666; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(billHTML);
    printWindow.document.close();
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      // Delete order items first
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Delete order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      await fetchDashboardData();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const handleDeleteBill = async (bill: Bill) => {
    try {
      const orderIds = bill.orders.map(order => order.id);

      // Delete all order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      // Delete all orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds);

      if (ordersError) throw ordersError;

      await fetchDashboardData();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Failed to delete bill');
    }
  };

  const openDeleteDialog = (type: 'order' | 'bill', id?: string, bill?: Bill) => {
    setDeleteTarget({ type, id, bill });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'order' && deleteTarget.id) {
      handleDeleteOrder(deleteTarget.id);
    } else if (deleteTarget.type === 'bill' && deleteTarget.bill) {
      handleDeleteBill(deleteTarget.bill);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const bills = groupOrdersIntoBills();

  return (
    <Box>
      {/* Buzzer Notifications - Show one at a time */}
      {currentNotification && (
        <BuzzerNotification
          key={currentNotification.id}
          tableNumber={currentNotification.table_number}
          notificationType={currentNotification.notification_type || 'service_call'}
          onDismiss={() => handleDismissBuzzer(currentNotification.id)}
        />
      )}

      <Typography variant="h4" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome to Ramani's Cafe Admin Panel
      </Typography>

      {/* Orders Section with Tabs */}
      <Card>
        <CardContent sx={{ pb: 0 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Orders Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {viewTab === 'unsettled'
              ? 'All pending bills • Settle bills when customers are ready to pay'
              : `Today's settled bills • ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
            }
          </Typography>
        </CardContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={viewTab} onChange={(e, newValue) => setViewTab(newValue)}>
            <Tab label="Pending Bills" value="unsettled" />
            <Tab label="Settled Bills (Today)" value="settled" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ReceiptLongIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Today's Orders
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700}>
                  {stats.todayOrders}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CurrencyRupeeIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Today's Revenue
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  ₹{stats.todayRevenue.toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon color="warning" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Pending Orders
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="warning.main">
                  {stats.pendingOrders}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CurrencyRupeeIcon color="info" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Pending Total
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color="info.main">
                  ₹{stats.pendingTotal.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {refreshing && (
                <Chip
                  label="Refreshing..."
                  size="small"
                  color="info"
                  sx={{
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.6 },
                    },
                  }}
                />
              )}
            </Box>
            <Button variant="outlined" onClick={() => router.push('/admin/orders')}>
              View All History
            </Button>
          </Box>

          {bills.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {viewTab === 'unsettled' ? 'No pending bills for today' : 'No settled bills for today'}
              </Typography>
            </Box>
          ) : (
            <Box>
              {bills.map((bill) => (
                <Accordion key={bill.bill_id} defaultExpanded={viewTab === 'unsettled'} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip label={`Table ${bill.table_number}`} color="primary" />
                        <Typography variant="body1" fontWeight={600}>
                          {bill.orders.length} order{bill.orders.length !== 1 ? 's' : ''}
                        </Typography>
                        {bill.settled_at && (
                          <Typography variant="body2" color="text.secondary">
                            {new Date(bill.settled_at).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        ₹{bill.total.toFixed(2)}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* Order Details */}
                    {bill.orders.map((order, index) => (
                      <Card key={order.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                Order #{index + 1}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(order.created_at).toLocaleString()}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip
                                label={statusLabels[order.status]}
                                color={statusColors[order.status]}
                                size="small"
                              />
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteDialog('order', order.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          {/* Order Items */}
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Item</TableCell>
                                  <TableCell align="center">Qty</TableCell>
                                  <TableCell align="right">Price</TableCell>
                                  <TableCell align="right">Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {order.order_items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      <Typography variant="body2">{item.name}</Typography>
                                      {item.special_instructions && (
                                        <Typography variant="caption" color="text.secondary">
                                          Note: {item.special_instructions}
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="center">{item.quantity}</TableCell>
                                    <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                                    <TableCell align="right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>

                          <Divider sx={{ my: 2 }} />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body1" fontWeight={600}>
                              Order Total
                            </Typography>
                            <Typography variant="body1" fontWeight={700} color="primary">
                              ₹{order.total.toFixed(2)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Bill Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => openDeleteDialog('bill', undefined, bill)}
                        >
                          Delete Bill
                        </Button>
                        {viewTab === 'settled' && (
                          <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={() => handlePrintBill(bill)}
                          >
                            Print Bill
                          </Button>
                        )}
                      </Box>
                      {viewTab === 'unsettled' && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleSettleBill(bill)}
                          disabled={settlingBill === bill.bill_id}
                        >
                          {settlingBill === bill.bill_id ? 'Settling...' : 'Settle Bill'}
                        </Button>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AdminDashboard() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <DashboardContent />
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

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
  AlertTitle,
  Collapse,
  Divider,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import BuzzerNotification from '@/components/BuzzerNotification';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus, BuzzerNotification as BuzzerNotificationType } from '@/types';
import { useRouter } from 'next/navigation';
import { initializeNotifications, showLocalNotification, checkNotificationSupport } from '@/lib/notifications';
import { initializePushNotifications } from '@/lib/fcm-notifications';
import { playNewOrderSound, playServiceCallSound } from '@/lib/sound';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

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
    gujarati_name?: string | null;
    price: number;
    quantity: number;
    special_instructions: string | null;
  }>;
  orderNumber?: number; // Assigned based on chronological order within bill
}

interface Bill {
  bill_id: string;
  display_bill_id?: number;
  table_number: string;
  orders: OrderWithItems[];
  total: number;
  settled_at?: string;
  most_recent_order?: string;
}

function FCMDebugPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const [fcmToken, setFcmToken] = useState<string>('');
  const [expanded, setExpanded] = useState(true);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('🔍 FCM Status Monitor starting...');
    const isNative = Capacitor.isNativePlatform();
    addLog(`Platform: ${Capacitor.getPlatform()}, Native: ${isNative}`);

    if (!isNative) {
      addLog('ℹ️ Not native - FCM handled by initializePushNotifications()');
      return;
    }

    // Check for existing token in localStorage
    const existingToken = localStorage.getItem('fcm_token');
    if (existingToken) {
      setFcmToken(existingToken);
      addLog(`✅ Existing token found: ${existingToken.substring(0, 30)}...`);
    }

    // Listen for token updates (initialization happens in DashboardContent)
    let tokenListener: any;
    let errorListener: any;
    let receivedListener: any;

    const setupListeners = async () => {
      tokenListener = await PushNotifications.addListener('registration', (token) => {
        addLog(`✅ Token registered: ${token.value.substring(0, 30)}...`);
        setFcmToken(token.value);
      });

      errorListener = await PushNotifications.addListener('registrationError', (error) => {
        addLog(`❌ Registration error: ${JSON.stringify(error)}`);
      });

      receivedListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        addLog(`📬 Push received: ${notification.title}`);
      });

      addLog('✅ FCM listeners attached');
    };

    setupListeners();

    return () => {
      if (tokenListener) tokenListener.remove();
      if (errorListener) errorListener.remove();
      if (receivedListener) receivedListener.remove();
    };
  }, []);

  return (
    <Alert
      severity={fcmToken ? 'success' : logs.some(l => l.includes('❌')) ? 'error' : 'info'}
      action={
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      }
    >
      <AlertTitle>
        {fcmToken ? '✅ FCM Active' : '⏳ FCM Debug'}
      </AlertTitle>
      <Collapse in={expanded}>
        <Box
          sx={{
            fontFamily: 'monospace',
            fontSize: 11,
            maxHeight: 300,
            overflow: 'auto',
            bgcolor: 'rgba(0,0,0,0.05)',
            p: 1,
            mt: 1,
            borderRadius: 1,
          }}
        >
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </Box>
      </Collapse>
    </Alert>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to get item name in current language
  const getItemName = (item: { name: string; gujarati_name?: string | null }) => {
    if (language === 'gu' && item.gujarati_name) {
      return item.gujarati_name;
    }
    return item.name;
  };
  const [activeNotifications, setActiveNotifications] = useState<BuzzerNotificationType[]>([]);
  const [viewTab, setViewTab] = useState<'unsettled' | 'settled' | 'diagnostics'>('unsettled');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'order' | 'bill'; id?: string; bill?: Bill } | null>(null);
  const [settlingBill, setSettlingBill] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [processedOrderIds, setProcessedOrderIds] = useState<Set<string>>(new Set());
  const [isAppActive, setIsAppActive] = useState(true);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    pendingTotal: 0,
  });

  // Track app visibility to prevent sound replay when returning to app
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isNowActive = !document.hidden;
      setIsAppActive(isNowActive);
      console.log(`📱 App visibility changed: ${isNowActive ? 'active' : 'background'}`);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          const order = payload.new as any;
          console.log('🆕 New order detected:', order);

          // Only play sound if app is active AND we haven't processed this order yet
          if (isAppActive && !processedOrderIds.has(order.id)) {
            console.log('🔊 Playing sound for new order (app is active)');
            await playNewOrderSound();
            setProcessedOrderIds(prev => new Set(prev).add(order.id));
          } else if (!isAppActive) {
            console.log('🔇 App is in background, skipping sound');
            // Mark as processed so sound doesn't play when returning
            setProcessedOrderIds(prev => new Set(prev).add(order.id));
          } else {
            console.log('🔇 Order already processed, skipping sound');
          }

          // Always show notification (OS handles this)
          if (notificationsEnabled) {
            await showLocalNotification('🍽️ New Order!', {
              body: `Table ${order.table_number} placed a new order`,
              tag: `order-${order.id}`,
              requireInteraction: true,
              data: {
                table_number: order.table_number,
                order_id: order.id,
                url: '/admin/dashboard'
              }
            });
          }

          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('📦 Order updated:', payload.new);
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('📦 Order deleted');
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
            console.log('✅ Adding notification toast for table:', newNotification.table_number);
            setActiveNotifications((prev) => [...prev, newNotification]);

            // Play notification sound
            await playServiceCallSound();

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
        console.log(`✅ Found ${data.length} active notifications`);
        setActiveNotifications(data);
      } else {
        console.log('📭 No active notifications');
      }
    } catch (error) {
      console.error('❌ Error fetching active buzzer notifications:', error);
    }
  };

  const handleDismissNotification = async (notificationId: string) => {
    try {
      console.log('🗑️ Dismissing notification:', notificationId);
      await supabase
        .from('buzzer_notifications')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
        .eq('id', notificationId);

      // Remove from local state
      setActiveNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('❌ Error dismissing notification:', error);
    }
  };

  const handleDismissAllNotifications = async () => {
    try {
      console.log('🗑️ Dismissing all notifications');
      if (activeNotifications.length === 0) return;

      const ids = activeNotifications.map(n => n.id);

      await supabase
        .from('buzzer_notifications')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
        .in('id', ids);

      // Clear all from local state
      setActiveNotifications([]);
    } catch (error) {
      console.error('❌ Error dismissing all notifications:', error);
    }
  };

  const groupOrdersIntoBills = (): Bill[] => {
    // Note: This function should be called after fetchDashboardData which populates the orders array
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

    const billsMap = new Map<string, Bill>();

    if (viewTab === 'unsettled') {
      // For unsettled: show ALL pending orders (group by table) - DRAFT bills
      const grouped = filteredOrders.reduce((acc, order) => {
        const tableNum = order.table_number;
        if (!acc[tableNum]) {
          acc[tableNum] = [];
        }
        acc[tableNum].push(order);
        return acc;
      }, {} as Record<string, OrderWithItems[]>);

      Object.entries(grouped).forEach(([tableNum, orders]) => {
        // First sort by creation time to assign proper order numbers (oldest = #1)
        const ordersWithNumbers = orders
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((order, index) => ({
            ...order,
            orderNumber: index + 1, // Assign order number based on chronological order
          }));

        // Then reverse for display (most recent first)
        const sortedOrders = [...ordersWithNumbers].reverse();

        billsMap.set(`draft-${tableNum}`, {
          bill_id: `draft-${tableNum}`,
          display_bill_id: 0, // 0 means draft
          table_number: tableNum,
          orders: sortedOrders,
          total: orders.reduce((sum, order) => sum + order.total, 0),
          // Track most recent order time for bill sorting
          most_recent_order: sortedOrders[0].created_at,
        });
      });

      return Array.from(billsMap.values()).sort((a, b) => {
        // Sort bills by most recent order first
        return new Date(b.most_recent_order || 0).getTime() - new Date(a.most_recent_order || 0).getTime();
      });
    } else {
      // For settled: use actual bill records from database (populated by fetchDashboardData)
      // Group paid orders by their bill_id
      const ordersByBillId = new Map<string, OrderWithItems[]>();
      filteredOrders.forEach((order) => {
        if (order.bill_id) {
          if (!ordersByBillId.has(order.bill_id)) {
            ordersByBillId.set(order.bill_id, []);
          }
          ordersByBillId.get(order.bill_id)!.push(order);
        }
      });

      // We would need to fetch bill records to get display_bill_id
      // For now, use bill_id grouping (this should be enhanced to fetch from bills table)
      ordersByBillId.forEach((orders, billId) => {
        const ordersWithNumbers = orders
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((order, index) => ({
            ...order,
            orderNumber: index + 1,
          }));

        const firstOrder = orders[0];
        billsMap.set(billId, {
          bill_id: billId,
          display_bill_id: 0, // Will be updated by fetchDashboardData
          table_number: firstOrder.table_number,
          orders: ordersWithNumbers,
          total: orders.reduce((sum, order) => sum + order.total, 0),
          settled_at: firstOrder.updated_at,
        });
      });

      return Array.from(billsMap.values()).sort((a, b) =>
        new Date(b.settled_at!).getTime() - new Date(a.settled_at!).getTime()
      );
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
        <title>Bill - Table ${bill.table_number}</title>
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
          <h2 style="border-bottom: none;">Table ${bill.table_number}</h2>
          <p>
          <p>Date: ${new Date(bill.settled_at || new Date()).toLocaleString()}</p>
        </div>

        ${bill.orders.map((order, index) => `
          <div class="order-section">
            <div class="order-header">Order #${order.orderNumber || index + 1} - ${new Date(order.created_at).toLocaleTimeString()}</div>
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
                      ${getItemName(item)}
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
          <div class="total-row" style="color: #22c55e; font-weight: 600;">
            <span>App Discount (10%):</span>
            <span>- ₹${(bill.total * 0.1).toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Final Amount:</span>
            <span>₹${(bill.total * 0.9).toFixed(2)}</span>
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
    <Box onClick={activeNotifications.length > 0 ? handleDismissAllNotifications : undefined}>
      {/* Toast Notifications - Stacked */}
      {activeNotifications.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            right: 24,
            zIndex: 2000,
            maxWidth: 320,
          }}
        >
          {activeNotifications.map((notification) => (
            <BuzzerNotification
              key={notification.id}
              tableNumber={notification.table_number}
              notificationType={notification.notification_type || 'service_call'}
              onDismiss={() => handleDismissNotification(notification.id)}
            />
          ))}
        </Box>
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
              : viewTab === 'settled'
              ? `Today's settled bills • ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
              : 'System diagnostics and push notification status'}
          </Typography>
        </CardContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={viewTab} onChange={(e, newValue) => setViewTab(newValue)}>
            <Tab label="Pending Bills" value="unsettled" />
            <Tab label="Settled Bills (Today)" value="settled" />
            <Tab label="System Status" value="diagnostics" />
          </Tabs>
        </Box>

        <CardContent>
          {viewTab === 'diagnostics' ? (
            <Box>
              <FCMDebugPanel />
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  System Information
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Platform: {typeof window !== 'undefined' ? Capacitor.getPlatform() : 'Loading...'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Native: {typeof window !== 'undefined' ? (Capacitor.isNativePlatform() ? 'Yes' : 'No') : 'Loading...'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {new Date().toLocaleString()}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ) : (
            <>
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
                        <Chip
                          label={`Table ${bill.table_number}`}
                          color="primary"
                          sx={{ fontWeight: 700, fontSize: '1.1rem', px: 2, py: 2.5 }}
                        />
                        <Typography variant="body1" fontWeight={600}>
                          {bill.orders.length} order{bill.orders.length !== 1 ? 's' : ''}
                        </Typography>
                        {bill.settled_at && (
                          <Typography variant="body2" color="text.secondary">
                            {new Date(bill.settled_at).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          ₹{bill.total.toFixed(2)}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          ₹{(bill.total * 0.9).toFixed(2)}
                        </Typography>
                      </Box>
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
                                Order #{order.orderNumber || index + 1}
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
                                      <Typography variant="body2">{getItemName(item)}</Typography>
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

                    {/* Bill Summary with Discount */}
                    <Card variant="outlined" sx={{ mt: 2, bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Bill Summary
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Subtotal ({bill.orders.length} order{bill.orders.length !== 1 ? 's' : ''})</Typography>
                          <Typography variant="body2">₹{bill.total.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            App Discount (10%)
                          </Typography>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            - ₹{(bill.total * 0.1).toFixed(2)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="h6" fontWeight={700}>
                            Final Amount
                          </Typography>
                          <Typography variant="h6" fontWeight={700} color="primary">
                            ₹{(bill.total * 0.9).toFixed(2)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>

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
            </>
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
        <AdminRouteGuard requireAdmin={true}>
          <AdminLayout>
            <DashboardContent />
          </AdminLayout>
        </AdminRouteGuard>
      </ProtectedRoute>
    </AuthProvider>
  );
}

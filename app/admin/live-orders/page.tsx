'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Tabs,
  Tab,
  Chip,
  Divider,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import BuzzerNotification from '@/components/BuzzerNotification';
import CreateAdminOrderDialog from '@/components/CreateAdminOrderDialog';
import EditOrderDialog from '@/components/EditOrderDialog';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus, BuzzerNotification as BuzzerNotificationType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { initializeNotifications, showLocalNotification, checkNotificationSupport } from '@/lib/notifications';
import { initializePushNotifications } from '@/lib/fcm-notifications';
import { stopNotificationSound } from '@/lib/sound'; // Only keep stopNotificationSound for tap-to-dismiss
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

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
  orderNumber?: number;
}

interface Bill {
  bill_id: string;
  display_bill_id: number;
  table_number: string | null; // null for admin orders
  orders: OrderWithItems[];
  total: number;
  created_at: string;
}

function LiveOrdersContent() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingReady, setMarkingReady] = useState<string | null>(null);
  const [settlingBill, setSettlingBill] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [processedOrderIds, setProcessedOrderIds] = useState<Set<string>>(new Set());
  const [billDiscounts, setBillDiscounts] = useState<Record<string, boolean>>({}); // Track discount state per bill (default true)
  const [isAppActive, setIsAppActive] = useState(true);
  const [activeNotifications, setActiveNotifications] = useState<BuzzerNotificationType[]>([]);
  const [createOrderDialogOpen, setCreateOrderDialogOpen] = useState(false);
  const [editOrderDialogOpen, setEditOrderDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Use refs to avoid stale closures in real-time subscriptions
  const isAppActiveRef = useRef(isAppActive);
  const processedOrderIdsRef = useRef(processedOrderIds);
  const notificationsEnabledRef = useRef(notificationsEnabled);

  useEffect(() => {
    isAppActiveRef.current = isAppActive;
  }, [isAppActive]);

  useEffect(() => {
    processedOrderIdsRef.current = processedOrderIds;
  }, [processedOrderIds]);

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);
  const { language, t } = useLanguage();

  // Helper function to get item name in current language
  const getItemName = (item: { name: string; gujarati_name?: string | null }) => {
    if (language === 'gu' && item.gujarati_name) {
      return item.gujarati_name;
    }
    return item.name;
  };

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

  // Initialize notifications
  useEffect(() => {
    const setupNotifications = async () => {
      console.log('📱 Setting up Live Orders notifications...');

      // For native mobile apps
      if (Capacitor.isNativePlatform()) {
        await initializePushNotifications();
        console.log('✅ FCM push notifications initialized');
        setNotificationsEnabled(true);
        return;
      }

      // For web
      const support = checkNotificationSupport();
      if (support.supported) {
        const initialized = await initializeNotifications();
        setNotificationsEnabled(initialized);
        if (initialized) {
          console.log('✅ Web push notifications enabled');
        }
      }
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    fetchBills();
    fetchActiveBuzzerNotifications();

    // Set up real-time subscription for orders
    const ordersChannel = supabase
      .channel('live-orders-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const order = payload.new as any;
          console.log('🆕 New order detected:', order);

          // Immediately refresh bills for instant UI update
          fetchBills();

          // DON'T play in-app sound - system notification handles sound
          // Mark order as processed to track it
          if (!processedOrderIdsRef.current.has(order.id)) {
            console.log('✅ New order detected - system notification will play 10s sound');
            setProcessedOrderIds(prev => new Set(prev).add(order.id));
          }

          // Always show notification (OS handles this) - non-blocking
          if (notificationsEnabledRef.current) {
            showLocalNotification('🍽️ New Order!', {
              body: `Table ${order.table_number} placed a new order`,
              tag: `order-${order.id}`,
              requireInteraction: true,
              data: {
                table_number: order.table_number,
                order_id: order.id,
                url: '/admin/live-orders'
              }
            }).catch(err => console.error('Notification error:', err));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchBills();
        }
      )
      .subscribe();

    // Subscribe to real-time buzzer notifications
    console.log('🔔 Setting up buzzer notifications channel...');
    const buzzerChannel = supabase
      .channel('live-orders-buzzer')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buzzer_notifications',
        },
        (payload) => {
          console.log('🔔 Buzzer notification received:', payload);
          const newNotification = payload.new as BuzzerNotificationType;
          if (newNotification.status === 'active') {
            console.log('✅ Adding notification toast for table:', newNotification.table_number);

            // Immediately update UI
            setActiveNotifications((prev) => [...prev, newNotification]);

            // DON'T play in-app sound - system notification handles sound
            console.log('✅ Waiter call detected - system notification will play 10s sound');

            // Show web push notification (works even when screen is off) - non-blocking
            if (notificationsEnabledRef.current) {
              const title = newNotification.notification_type === 'service_call'
                ? '🔔 Service Request!'
                : '🍽️ New Order!';
              const body = `Table ${newNotification.table_number} needs assistance`;

              showLocalNotification(title, {
                body,
                tag: `buzzer-${newNotification.id}`,
                data: {
                  table_number: newNotification.table_number,
                  notification_type: newNotification.notification_type,
                  url: '/admin/live-orders'
                }
              }).then(() => console.log('📱 Push notification sent'))
                .catch(err => console.error('Notification error:', err));
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

    // Refresh every 30 seconds as backup
    const interval = setInterval(fetchBills, 30000);

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(buzzerChannel);
      clearInterval(interval);
    };
  }, []); // Empty dependency array - subscriptions use refs to avoid stale closures

  const fetchBills = async () => {
    try {
      // Fetch only recent orders (last 7 days) for better performance
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch only recent settled bills (last 7 days) for better performance
      const { data: settledBillsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('settled_at', { ascending: false });

      if (billsError) throw billsError;

      // Group orders into bills based on table and payment status
      // Strategy: Orders are grouped by table. Once settled (paid), they form a completed bill.
      // New orders after settlement create a NEW bill for that table.

      // First, separate paid and unpaid orders
      const paidOrders = ordersData?.filter((o: any) => o.status === 'paid') || [];
      const unpaidOrders = ordersData?.filter((o: any) => o.status !== 'paid') || [];

      const billsMap = new Map<string, Bill>();

      // Process unpaid orders - group by table (these are DRAFT bills, no bill_id yet)
      unpaidOrders.forEach((order: any) => {
        const key = `${order.table_number}-active`;

        if (!billsMap.has(key)) {
          billsMap.set(key, {
            bill_id: `draft-${order.table_number}`,
            display_bill_id: 0, // 0 means draft/unsettled
            table_number: order.table_number,
            orders: [],
            total: 0,
            created_at: order.created_at,
          });
        }

        const bill = billsMap.get(key)!;
        bill.orders.push(order);
        bill.total += order.total;
      });

      // Process paid orders - use the actual bills from the database
      const billRecordsMap = new Map<string, any>();
      settledBillsData?.forEach((billRecord) => {
        billRecordsMap.set(billRecord.id, billRecord);
      });

      // Group paid orders by their bill_id
      const ordersByBillId = new Map<string, any[]>();
      paidOrders.forEach((order: any) => {
        if (order.bill_id) {
          if (!ordersByBillId.has(order.bill_id)) {
            ordersByBillId.set(order.bill_id, []);
          }
          ordersByBillId.get(order.bill_id)!.push(order);
        }
      });

      // Create bill objects from database records
      ordersByBillId.forEach((orders, billId) => {
        const billRecord = billRecordsMap.get(billId);
        if (billRecord) {
          billsMap.set(billId, {
            bill_id: billId,
            display_bill_id: billRecord.display_bill_id || 0,
            table_number: billRecord.table_number,
            orders: orders,
            total: billRecord.total,
            created_at: billRecord.created_at,
            settled_at: billRecord.settled_at,
          });
        }
      });

      // Convert map to array
      const billsArray = Array.from(billsMap.values());

      // Sort by created_at (newest first)
      billsArray.sort((a, b) => {
        const aTime = new Date(a.settled_at || a.created_at).getTime();
        const bTime = new Date(b.settled_at || b.created_at).getTime();
        return bTime - aTime;
      });

      // Assign order numbers within each bill
      billsArray.forEach((bill) => {
        // Sort orders within bill by created_at (oldest first for order numbering)
        const sortedOrders = [...bill.orders].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Assign order numbers
        sortedOrders.forEach((order, index) => {
          order.orderNumber = index + 1;
        });

        // Then reverse for display (newest first)
        bill.orders = sortedOrders.reverse();
      });

      setBills(billsArray);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
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

  const handleMarkAsReady = async (orderId: string) => {
    setMarkingReady(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      await fetchBills();
    } catch (error) {
      console.error('Error marking order as ready:', error);
      alert('Failed to mark order as ready');
    } finally {
      setMarkingReady(null);
    }
  };

  const getBillDiscount = (billId: string): boolean => {
    // Default to true (discount applied) if not explicitly set
    return billDiscounts[billId] !== undefined ? billDiscounts[billId] : true;
  };

  const toggleBillDiscount = (billId: string) => {
    setBillDiscounts(prev => ({
      ...prev,
      [billId]: !getBillDiscount(billId)
    }));
  };

  const handleSettleBill = async (bill: Bill) => {
    if (!confirm(`Settle bill for Table ${bill.table_number}?`)) {
      return;
    }

    setSettlingBill(bill.bill_id);
    try {
      const orderIds = bill.orders.map(order => order.id);
      const settlementTime = new Date().toISOString();

      // Calculate bill totals with discount consideration
      const billSubtotal = bill.orders.reduce((sum, order) => sum + order.subtotal, 0);
      const applyDiscount = getBillDiscount(bill.bill_id);
      const billTotal = applyDiscount ? billSubtotal * 0.9 : billSubtotal;

      // Generate bill number (format: BILL-YYYYMMDD-HHMMSS)
      const now = new Date();
      const billNumber = `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

      // Create bill record (display_bill_id will be auto-generated by the sequence)
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

      await fetchBills();
    } catch (error) {
      console.error('Error settling bill:', error);
      alert('Failed to settle bill');
    } finally {
      setSettlingBill(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      await fetchBills();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const handlePrintBill = (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Table ${bill.table_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #D4691A; }
          h2 { margin-top: 20px; border-bottom: 2px solid #D4691A; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .totals { margin-top: 20px; text-align: right; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
          .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>Ramani's Cafe</h1>
        <h2 style="text-align: center; border-bottom: none;">Table ${bill.table_number}</h2>
        <p style="text-align: center; font-size: 14px; color: #666;">
        <p><strong>Date:</strong> ${new Date(bill.created_at).toLocaleString()}</p>

        ${bill.orders.map((order, index) => `
          <h2>Order #${order.orderNumber} - ${statusLabels[order.status]}</h2>
          <p style="font-size: 12px; color: #666;">${new Date(order.created_at).toLocaleString()}</p>
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
          <p>Ramani's Cafe - Authentic South Indian Cafe</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 30px; background: #D4691A; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Print Bill</button>
          <button onclick="window.close()" style="padding: 10px 30px; background: #666; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>

        <script>
          // Auto-trigger print dialog when page loads
          window.onload = function() {
            window.print();
          };

          // Close window after printing (or if user cancels)
          window.onafterprint = function() {
            // Give user a moment to see the preview before closing
            setTimeout(function() {
              window.close();
              // If window.close() doesn't work (browser restriction), show a message
              setTimeout(function() {
                document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h2>You can close this tab now</h2><p>If this tab didn\'t close automatically, please close it manually.</p></div>';
              }, 100);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(billHTML);
    printWindow.document.close();
  };

  // Filter bills based on selected tab
  const getFilteredBills = () => {
    switch (selectedTab) {
      case 0: // New Orders - bills with at least one order not "ready" or "paid"
        return bills.filter(bill =>
          bill.orders.some(order =>
            order.status !== 'ready' &&
            order.status !== 'served' &&
            order.status !== 'bill_requested' &&
            order.status !== 'paid'
          )
        );
      case 1: // Settle Bill - bills with at least one order placed (not paid)
        return bills.filter(bill =>
          bill.orders.some(order => order.status !== 'paid')
        );
      case 2: // Past Bills - bills where all orders are paid
        return bills.filter(bill =>
          bill.orders.every(order => order.status === 'paid')
        );
      default:
        return [];
    }
  };

  const filteredBills = getFilteredBills();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      onClick={async () => {
        // Stop any playing notification sounds when user taps anywhere
        stopNotificationSound();

        // Also dismiss in-app toast notifications if any are active
        if (activeNotifications.length > 0) {
          handleDismissAllNotifications();
        }

        // Clear all Android system notifications from notification tray
        if (Capacitor.isNativePlatform()) {
          try {
            // Remove all delivered notifications from the notification tray
            await LocalNotifications.removeAllDeliveredNotifications();
            console.log('✅ Cleared all system notifications from tray');
          } catch (error) {
            console.error('Error clearing system notifications:', error);
          }
        }
      }}
    >
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

      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {t('liveOrders.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('liveOrders.subtitle')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOrderDialogOpen(true)}
            size="medium"
          >
            {t('adminOrder.createOrder') || 'Create Order'}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
          <Tab label={t('liveOrders.newOrders')} />
          <Tab label={t('liveOrders.settleBill')} />
          <Tab label={t('liveOrders.pastBills')} />
        </Tabs>
      </Box>

      {/* Content */}
      {filteredBills.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {selectedTab === 0 && t('liveOrders.noNewOrders')}
            {selectedTab === 1 && t('liveOrders.noBillsToSettle')}
            {selectedTab === 2 && t('liveOrders.noPastBills')}
          </Typography>
        </Box>
      ) : (
        <Box>
          {filteredBills.map((bill) => (
            <Accordion key={bill.bill_id} defaultExpanded={selectedTab !== 2} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={bill.table_number ? `Table ${bill.table_number}` : (t('adminOrder.adminOrder') || 'Admin Order')}
                      color={bill.table_number ? 'primary' : 'secondary'}
                      sx={{ fontWeight: 700, fontSize: '1.1rem', px: 2, py: 2.5 }}
                    />
                    <Typography variant="body1" fontWeight={600}>
                      {bill.orders.length} {bill.orders.length !== 1 ? t('liveOrders.orders') : t('liveOrders.order')}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    {selectedTab === 1 && (
                      <>
                        {getBillDiscount(bill.bill_id) ? (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                              ₹{bill.total.toFixed(2)}
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="success.main">
                              ₹{(bill.total * 0.9).toFixed(2)}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="h6" fontWeight={700} color="primary">
                            ₹{bill.total.toFixed(2)}
                          </Typography>
                        )}
                      </>
                    )}
                    {selectedTab !== 1 && (
                      <Typography variant="h6" fontWeight={700} color="primary">
                        ₹{bill.total.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {/* Orders in this bill */}
                {bill.orders.map((order, index) => {
                  // For "New Orders" tab, only show orders that are not ready/served/paid
                  if (selectedTab === 0 && (order.status === 'ready' || order.status === 'served' || order.status === 'bill_requested' || order.status === 'paid')) {
                    return null;
                  }

                  return (
                    <Card key={order.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Order #{order.orderNumber}
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
                            {selectedTab === 1 && order.status !== 'paid' && (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setEditingOrderId(order.id);
                                  setEditOrderDialogOpen(true);
                                }}
                                title={t('orderEdit.editOrder') || 'Edit Order'}
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                            {selectedTab !== 2 && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Order Items */}
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>{t('liveOrders.item')}</TableCell>
                                <TableCell align="center">{t('liveOrders.qty')}</TableCell>
                                <TableCell align="right">{t('liveOrders.price')}</TableCell>
                                <TableCell align="right">{t('bill.total')}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {order.order_items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <Typography variant="body2">{getItemName(item)}</Typography>
                                    {item.special_instructions && (
                                      <Typography variant="caption" color="text.secondary">
                                        {t('liveOrders.note')}: {item.special_instructions}
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

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            {selectedTab === 0 && order.status !== 'ready' && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handleMarkAsReady(order.id)}
                                disabled={markingReady === order.id}
                              >
                                {markingReady === order.id ? t('liveOrders.marking') : t('liveOrders.markAsReady')}
                              </Button>
                            )}
                          </Box>
                          <Typography variant="body1" fontWeight={700} color="primary">
                            ₹{order.total.toFixed(2)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Bill Summary and Actions (only for Settle Bill tab) */}
                {selectedTab === 1 && (
                  <>
                    <Card variant="outlined" sx={{ mt: 2, bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          {t('liveOrders.billSummary')}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{t('bill.subtotal')} ({bill.orders.length} {bill.orders.length !== 1 ? t('liveOrders.orders') : t('liveOrders.order')})</Typography>
                          <Typography variant="body2">₹{bill.total.toFixed(2)}</Typography>
                        </Box>

                        {/* Discount Checkbox */}
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={getBillDiscount(bill.bill_id)}
                              onChange={() => toggleBillDiscount(bill.bill_id)}
                            />
                          }
                          label={t('orderEdit.applyDiscount') || 'Apply 10% Discount'}
                          sx={{ mb: 1 }}
                        />

                        {getBillDiscount(bill.bill_id) && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="success.main" fontWeight={600}>
                              {t('liveOrders.appDiscount')}
                            </Typography>
                            <Typography variant="body2" color="success.main" fontWeight={600}>
                              - ₹{(bill.total * 0.1).toFixed(2)}
                            </Typography>
                          </Box>
                        )}

                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="h6" fontWeight={700}>
                            {t('liveOrders.finalAmount')}
                          </Typography>
                          <Typography variant="h6" fontWeight={700} color="primary">
                            ₹{(getBillDiscount(bill.bill_id) ? bill.total * 0.9 : bill.total).toFixed(2)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={() => handlePrintBill(bill)}
                      >
                        {t('actions.print')}
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleSettleBill(bill)}
                        disabled={settlingBill === bill.bill_id}
                      >
                        {settlingBill === bill.bill_id ? t('actions.settling') : t('actions.settle')}
                      </Button>
                    </Box>
                  </>
                )}

                {/* Past Bills - Show print option */}
                {selectedTab === 2 && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrintBill(bill)}
                      fullWidth
                    >
                      {t('actions.print')}
                    </Button>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Create Admin Order Dialog */}
      <CreateAdminOrderDialog
        open={createOrderDialogOpen}
        onClose={() => setCreateOrderDialogOpen(false)}
        onOrderCreated={() => {
          fetchBills(); // Refresh the bills list
          setCreateOrderDialogOpen(false);
        }}
      />

      {/* Edit Order Dialog */}
      <EditOrderDialog
        open={editOrderDialogOpen}
        orderId={editingOrderId}
        onClose={() => {
          setEditOrderDialogOpen(false);
          setEditingOrderId(null);
        }}
        onOrderUpdated={() => {
          fetchBills(); // Refresh the bills list
          setEditOrderDialogOpen(false);
          setEditingOrderId(null);
        }}
      />
    </Box>
  );
}

export default function LiveOrdersPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <LiveOrdersContent />
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

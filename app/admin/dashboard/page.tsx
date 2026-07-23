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
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import BuzzerNotification from '@/components/BuzzerNotification';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus, BuzzerNotification as BuzzerNotificationType } from '@/types';
import { useRouter } from 'next/navigation';
import { initializeNotifications, showLocalNotification, checkNotificationSupport } from '@/lib/notifications';

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
  table_number: number;
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
    monthlyOrders: 0,
    monthlyRevenue: 0,
  });

  // Initialize web push notifications
  useEffect(() => {
    const setupNotifications = async () => {
      console.log('📱 Setting up web push notifications...');
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

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Fetch today's orders with items
      const { data: todayOrdersData, error: todayOrdersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (todayOrdersError) throw todayOrdersError;

      const todayOrders: OrderWithItems[] = todayOrdersData || [];
      setOrders(todayOrders);

      // Fetch this month's orders for stats
      const { data: monthOrdersData, error: monthOrdersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', monthStart.toISOString());

      if (monthOrdersError) throw monthOrdersError;

      const monthOrders = monthOrdersData || [];

      // Calculate stats
      const todayOrdersCount = todayOrders.length || 0;
      const todayRevenue =
        todayOrders
          .filter((o) => o.status === 'paid')
          .reduce((sum, o) => sum + o.total, 0) || 0;
      const monthlyOrdersCount = monthOrders.length || 0;
      const monthlyRevenue =
        monthOrders
          .filter((o) => o.status === 'paid')
          .reduce((sum, o) => sum + o.total, 0) || 0;

      setStats({
        todayOrders: todayOrdersCount,
        todayRevenue,
        monthlyOrders: monthlyOrdersCount,
        monthlyRevenue,
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
    const filteredOrders = orders.filter(order =>
      viewTab === 'unsettled' ? order.status !== 'paid' : order.status === 'paid'
    );

    if (viewTab === 'unsettled') {
      // For unsettled: group by table (one active bill per table)
      const grouped = filteredOrders.reduce((acc, order) => {
        const tableNum = order.table_number;
        if (!acc[tableNum]) {
          acc[tableNum] = [];
        }
        acc[tableNum].push(order);
        return acc;
      }, {} as Record<number, OrderWithItems[]>);

      return Object.entries(grouped).map(([tableNum, orders]) => ({
        bill_id: `table-${tableNum}-active`,
        table_number: parseInt(tableNum),
        orders: orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        total: orders.reduce((sum, order) => sum + order.total, 0),
      })).sort((a, b) => a.table_number - b.table_number);
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
      }, {} as Record<string, { table_number: number; orders: OrderWithItems[]; settled_at: string }>);

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

      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: settlementTime })
        .in('id', orderIds);

      if (error) throw error;

      await fetchDashboardData();
    } catch (error) {
      console.error('Error settling bill:', error);
      alert('Failed to settle bill');
    } finally {
      setSettlingBill(null);
    }
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

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReceiptLongIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Today's Orders
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>
                {stats.todayOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CurrencyRupeeIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Today's Revenue
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="success.main">
                ₹{stats.todayRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Monthly Orders
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {stats.monthlyOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CurrencyRupeeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Monthly Revenue
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                ₹{stats.monthlyRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Orders Section with Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={viewTab} onChange={(e, newValue) => setViewTab(newValue)}>
            <Tab label="Unsettled Orders" value="unsettled" />
            <Tab label="Settled Orders" value="settled" />
          </Tabs>
        </Box>

        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                {viewTab === 'unsettled' ? 'Unsettled Orders' : 'Settled Bills'}
              </Typography>
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
              View History
            </Button>
          </Box>

          {bills.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No {viewTab} orders
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
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => openDeleteDialog('bill', undefined, bill)}
                      >
                        Delete Bill
                      </Button>
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

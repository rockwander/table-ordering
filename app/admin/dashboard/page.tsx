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
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import BuzzerNotification from '@/components/BuzzerNotification';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus, BuzzerNotification as BuzzerNotificationType } from '@/types';
import { useRouter } from 'next/navigation';

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

function DashboardContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [buzzerNotifications, setBuzzerNotifications] = useState<BuzzerNotificationType[]>([]);
  const [audioContextReady, setAudioContextReady] = useState(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    activeOrders: 0,
  });

  // Initialize AudioContext on user interaction
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log('🔊 AudioContext created, state:', audioContextRef.current.state);
        }

        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log('🔊 AudioContext resumed');
        }

        setAudioContextReady(true);
      } catch (error) {
        console.error('❌ Failed to initialize audio:', error);
      }
    };

    // Try to initialize audio on any user interaction
    const handleUserInteraction = () => {
      initAudio();
      // Remove listeners after first interaction
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    console.log('🚀 Dashboard mounted, setting up subscriptions...');
    fetchDashboardData();

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
        () => {
          fetchDashboardData();
        }
      )
      .subscribe((status) => {
        console.log('📦 Orders channel status:', status);
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
        (payload) => {
          console.log('🔔 Buzzer notification received:', payload);
          const newNotification = payload.new as BuzzerNotificationType;
          if (newNotification.status === 'active') {
            console.log('✅ Adding buzzer notification for table:', newNotification.table_number);
            setBuzzerNotifications((prev) => [...prev, newNotification]);
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
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(buzzerChannel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch ALL today's orders for accurate stats calculation
      const { data: allOrdersData, error: allOrdersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (allOrdersError) throw allOrdersError;

      const allOrders: Order[] = allOrdersData || [];

      // Fetch recent 10 orders for display
      const recentOrders = allOrders.slice(0, 10);
      setOrders(recentOrders);

      // Calculate stats from ALL orders, not just the recent 10
      const todayOrders = allOrders.length || 0;
      const todayRevenue =
        allOrders
          .filter((o) => o.status === 'paid')
          .reduce((sum, o) => sum + o.total, 0) || 0;
      const pendingOrders =
        allOrders.filter((o) => o.status === 'pending').length || 0;
      const activeOrders =
        allOrders.filter((o) =>
          ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
        ).length || 0;

      setStats({
        todayOrders,
        todayRevenue,
        pendingOrders,
        activeOrders,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/admin/orders?orderId=${orderId}`);
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
    } catch (error) {
      console.error('❌ Error dismissing buzzer notification:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Buzzer Notifications */}
      {buzzerNotifications.map((notification) => (
        <BuzzerNotification
          key={notification.id}
          tableNumber={notification.table_number}
          audioContext={audioContextRef.current}
          onDismiss={() => handleDismissBuzzer(notification.id)}
        />
      ))}

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
                <PendingActionsIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Pending Orders
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {stats.pendingOrders}
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
                  Active Orders
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {stats.activeOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              Recent Orders
            </Typography>
            <Button variant="outlined" onClick={() => router.push('/admin/orders')}>
              View All
            </Button>
          </Box>

          {orders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No orders today</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          #{order.id.slice(0, 8)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`Table ${order.table_number}`} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>₹{order.total.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[order.status]}
                          color={statusColors[order.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleViewOrder(order.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
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

'use client';

import { useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types';
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
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    activeOrders: 0,
  });

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to real-time order updates
    const channel = supabase
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;

      const orders: Order[] = ordersData || [];
      setOrders(orders);

      // Calculate stats
      const todayOrders = orders.length || 0;
      const todayRevenue =
        orders
          .filter((o) => o.status === 'paid')
          .reduce((sum, o) => sum + o.total, 0) || 0;
      const pendingOrders =
        orders.filter((o) => o.status === 'pending').length || 0;
      const activeOrders =
        orders.filter((o) =>
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
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

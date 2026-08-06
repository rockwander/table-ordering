'use client';

import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import InfoIcon from '@mui/icons-material/Info';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import BuzzerNotification from '@/components/BuzzerNotification';
import { supabase } from '@/lib/supabase';
import { Order, BuzzerNotification as BuzzerNotificationType } from '@/types';
import { initializeNotifications, checkNotificationSupport } from '@/lib/notifications';
import { initializePushNotifications } from '@/lib/fcm-notifications';
import { playNewOrderSound, playServiceCallSound } from '@/lib/sound';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  monthOrders: number;
  monthRevenue: number;
}

interface ChartData {
  name: string;
  revenue: number;
  orders: number;
}

// Error Boundary to catch rendering errors
class DashboardErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Dashboard Error
            </Typography>
            <Typography variant="body2" gutterBottom>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
          </Alert>
          <Button
            variant="contained"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload Dashboard
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

function FCMDebugPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const [fcmToken, setFcmToken] = useState<string>('');

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

    const existingToken = localStorage.getItem('fcm_token');
    if (existingToken) {
      setFcmToken(existingToken);
      addLog(`✅ Existing token found: ${existingToken.substring(0, 30)}...`);
    }

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
      tokenListener?.remove();
      errorListener?.remove();
      receivedListener?.remove();
    };
  }, []);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        FCM Push Notification Status
      </Typography>
      <Paper sx={{ p: 2, mb: 2, maxHeight: 300, overflow: 'auto', bgcolor: '#1e1e1e', color: '#00ff00', fontFamily: 'monospace', fontSize: '0.85rem' }}>
        {logs.map((log, index) => (
          <Box key={index}>{log}</Box>
        ))}
      </Paper>
      {fcmToken && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            FCM Token:
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {fcmToken}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

function DashboardContent() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [activeNotifications, setActiveNotifications] = useState<BuzzerNotificationType[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [processedOrderIds, setProcessedOrderIds] = useState<Set<string>>(new Set());
  const [isAppActive, setIsAppActive] = useState(true);
  const [systemStatusOpen, setSystemStatusOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    todayRevenue: 0,
    monthOrders: 0,
    monthRevenue: 0,
  });
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);

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

      try {
        await initializePushNotifications();
        console.log('✅ FCM push notifications initialized');
        setNotificationsEnabled(true);
      } catch (error) {
        console.error('❌ FCM initialization error:', error);
      }

      if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
        try {
          const supported = await checkNotificationSupport();
          if (supported) {
            await initializeNotifications();
            setNotificationsEnabled(true);
            console.log('✅ Web notifications initialized');
          }
        } catch (error) {
          console.error('❌ Web notification error:', error);
        }
      }
    };

    setupNotifications();
  }, []);

  // Fetch stats
  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);

      // Get Monday of current week
      const currentDay = today.getDay();
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday is 0, Monday is 1
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromMonday);
      weekStart.setHours(0, 0, 0, 0);

      // Fetch all settled bills (for revenue - post-discount)
      const { data: allBillsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .order('settled_at', { ascending: false });

      if (billsError) throw billsError;

      const allBills = allBillsData || [];

      // Fetch all orders (for order count)
      const { data: allOrdersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, status')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const allOrders = allOrdersData || [];

      // Calculate today's stats
      const todayBills = allBills.filter(bill =>
        new Date(bill.settled_at) >= today
      );
      const todayOrders = allOrders.filter(order =>
        new Date(order.created_at) >= today
      );

      const todayOrdersCount = todayOrders.length || 0;
      const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.total, 0) || 0;

      // Calculate month's stats
      const monthBills = allBills.filter(bill =>
        new Date(bill.settled_at) >= monthStart
      );
      const monthOrders = allOrders.filter(order =>
        new Date(order.created_at) >= monthStart
      );

      const monthOrdersCount = monthOrders.length || 0;
      const monthRevenue = monthBills.reduce((sum, bill) => sum + bill.total, 0) || 0;

      setStats({
        todayOrders: todayOrdersCount,
        todayRevenue,
        monthOrders: monthOrdersCount,
        monthRevenue,
      });

      // Calculate weekly data (Monday to Sunday)
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyChartData: ChartData[] = weekDays.map((day, index) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + index);
        const nextDay = new Date(dayDate);
        nextDay.setDate(dayDate.getDate() + 1);

        // Get bills settled on this day (for revenue - post-discount)
        const dayBills = allBills.filter(bill => {
          const billDate = new Date(bill.settled_at);
          return billDate >= dayDate && billDate < nextDay;
        });

        // Get orders created on this day (for count)
        const dayOrders = allOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= dayDate && orderDate < nextDay;
        });

        const dayRevenue = dayBills.reduce((sum, bill) => sum + bill.total, 0);

        return {
          name: day,
          revenue: dayRevenue,
          orders: dayOrders.length,
        };
      });
      setWeeklyData(weeklyChartData);

      // Calculate monthly data (day by day for current month)
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const monthlyChartData: ChartData[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(today.getFullYear(), today.getMonth(), day);
        dayDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(dayDate);
        nextDay.setDate(dayDate.getDate() + 1);

        // Get bills settled on this day (for revenue - post-discount)
        const dayBills = allBills.filter(bill => {
          const billDate = new Date(bill.settled_at);
          return billDate >= dayDate && billDate < nextDay;
        });

        // Get orders created on this day (for count)
        const dayOrders = allOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= dayDate && orderDate < nextDay;
        });

        const dayRevenue = dayBills.reduce((sum, bill) => sum + bill.total, 0);

        monthlyChartData.push({
          name: `${day}`,
          revenue: dayRevenue,
          orders: dayOrders.length,
        });
      }
      setMonthlyData(monthlyChartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveBuzzerNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('buzzer_notifications')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setActiveNotifications(data || []);
    } catch (error) {
      console.error('Error fetching buzzer notifications:', error);
    }
  };

  useEffect(() => {
    // Set a timeout to force loading to false if data fetch takes too long
    const loadingTimeout = setTimeout(() => {
      console.warn('Dashboard loading timeout - forcing loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    fetchDashboardData().finally(() => {
      clearTimeout(loadingTimeout);
    });
    fetchActiveBuzzerNotifications();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Real-time subscriptions for notifications and sounds
  useEffect(() => {
    const processedOrderIdsRef = { current: processedOrderIds };
    const notificationsEnabledRef = { current: notificationsEnabled };
    const isAppActiveRef = { current: isAppActive };

    processedOrderIdsRef.current = processedOrderIds;
    notificationsEnabledRef.current = notificationsEnabled;
    isAppActiveRef.current = isAppActive;

    const ordersSubscription = supabase
      .channel('dashboard-orders-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          const newOrder = payload.new as Order;

          if (processedOrderIdsRef.current.has(newOrder.id)) {
            return;
          }

          setProcessedOrderIds(prev => new Set([...prev, newOrder.id]));

          if (isAppActiveRef.current) {
            playNewOrderSound();
          }

          fetchDashboardData();
        }
      )
      .subscribe();

    const buzzersSubscription = supabase
      .channel('dashboard-buzzers-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buzzer_notifications',
        },
        async (payload) => {
          const newNotification = payload.new as BuzzerNotificationType;

          if (newNotification.status === 'active') {
            if (isAppActiveRef.current) {
              playServiceCallSound();
            }
            fetchActiveBuzzerNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      buzzersSubscription.unsubscribe();
    };
  }, [processedOrderIds, notificationsEnabled, isAppActive]);

  const handleDismissNotification = async (id: string) => {
    try {
      await supabase
        .from('buzzer_notifications')
        .update({ status: 'dismissed' })
        .eq('id', id);
      fetchActiveBuzzerNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Buzzer Notifications */}
      {activeNotifications.map((notification) => (
        <BuzzerNotification
          key={notification.id}
          notification={notification}
          onDismiss={() => handleDismissNotification(notification.id)}
        />
      ))}

      {/* Header with System Status Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to Ramani's Cafe Admin Panel
          </Typography>
        </Box>
        <IconButton
          onClick={() => setSystemStatusOpen(true)}
          sx={{
            bgcolor: 'primary.50',
            border: '1px solid',
            borderColor: 'primary.200',
            '&:hover': { bgcolor: 'primary.100' },
          }}
        >
          <InfoIcon color="primary" />
        </IconButton>
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={3}>
        {/* Today's Orders */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptLongIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Today's Orders
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>
                {stats.todayOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CurrencyRupeeIcon color="success" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Today's Revenue
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: 'success.main' }}>
                ₹{stats.todayRevenue.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Paid orders only
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Orders */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarMonthIcon color="info" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Monthly Orders
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: 'info.main' }}>
                {stats.monthOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="warning" sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="body2" color="text.secondary">
                  Monthly Revenue
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: 'warning.main' }}>
                ₹{stats.monthRevenue.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Paid orders only
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales Charts */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Weekly Sales Chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Weekly Sales (Mon - Sun)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current week's revenue and order count
              </Typography>
              {weeklyData && weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return `₹${value.toFixed(2)}`;
                      return value;
                    }}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue (₹)" />
                  <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading chart data...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Sales Chart */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Monthly Sales
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Daily breakdown
              </Typography>
              {monthlyData && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#ff7300" />
                  <YAxis yAxisId="right" orientation="right" stroke="#387908" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return `₹${value.toFixed(2)}`;
                      return value;
                    }}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#ff7300" name="Revenue (₹)" />
                  <Bar yAxisId="right" dataKey="orders" fill="#387908" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading chart data...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Status Dialog */}
      <Dialog
        open={systemStatusOpen}
        onClose={() => setSystemStatusOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              System Status
            </Typography>
            <IconButton onClick={() => setSystemStatusOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
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
                Notifications Enabled: {notificationsEnabled ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last Updated: {new Date().toLocaleString()}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
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
            <DashboardErrorBoundary>
              <DashboardContent />
            </DashboardErrorBoundary>
          </AdminLayout>
        </AdminRouteGuard>
      </ProtectedRoute>
    </AuthProvider>
  );
}

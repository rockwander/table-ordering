'use client';

import React, { useEffect, useState } from 'react';
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

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  monthOrders: number;
  monthRevenue: number;
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

      // Fetch all orders
      const { data: allOrdersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item:menu_items (
              name,
              gujarati_name
            ),
            quantity,
            price,
            special_instructions
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const allOrders = allOrdersData || [];

      // Calculate today's stats
      const todayOrders = allOrders.filter(order =>
        new Date(order.created_at) >= today
      );

      const todayOrdersCount = todayOrders.length || 0;
      const todayRevenue = todayOrders
        .filter((o) => o.status === 'paid')
        .reduce((sum, o) => sum + o.total, 0) || 0;

      // Calculate month's stats
      const monthOrders = allOrders.filter(order =>
        new Date(order.created_at) >= monthStart
      );

      const monthOrdersCount = monthOrders.length || 0;
      const monthRevenue = monthOrders
        .filter((o) => o.status === 'paid')
        .reduce((sum, o) => sum + o.total, 0) || 0;

      setStats({
        todayOrders: todayOrdersCount,
        todayRevenue,
        monthOrders: monthOrdersCount,
        monthRevenue,
      });
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
    fetchDashboardData();
    fetchActiveBuzzerNotifications();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
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
              <Typography variant="h4" fontWeight={700} color="success.main">
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
              <Typography variant="h4" fontWeight={700} color="info.main">
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
              <Typography variant="h4" fontWeight={700} color="warning.main">
                ₹{stats.monthRevenue.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Paid orders only
              </Typography>
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
            <DashboardContent />
          </AdminLayout>
        </AdminRouteGuard>
      </ProtectedRoute>
    </AuthProvider>
  );
}

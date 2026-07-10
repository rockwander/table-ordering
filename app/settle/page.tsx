'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  CircularProgress,
  List,
  ListItem,
  Chip,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { RestaurantSettings } from '@/types';

interface Order {
  id: string;
  table_number: number;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: string;
  order_items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    special_instructions: string | null;
  }>;
}

function SettleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableNumber = searchParams.get('table');

  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!tableNumber) {
      router.push('/');
      return;
    }
    fetchData();
  }, [tableNumber, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('restaurant_settings')
        .select('*')
        .single();

      if (settingsError) throw settingsError;
      setSettings(settingsData);

      // Fetch all outstanding orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('table_number', parseInt(tableNumber!))
        .neq('status', 'paid')
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  const handleSettleBill = async () => {
    if (orders.length === 0) {
      setError('No outstanding orders to settle');
      return;
    }

    setSettling(true);
    setError('');

    try {
      // Update all orders to 'paid' status
      const orderIds = orders.map((order) => order.id);
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .in('id', orderIds);

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/menu?table=${tableNumber}`);
      }, 2000);
    } catch (error) {
      console.error('Error settling bill:', error);
      setError('Failed to settle bill. Please try again.');
    } finally {
      setSettling(false);
    }
  };

  const grandTotal = orders.reduce((sum, order) => sum + order.total, 0);

  if (!tableNumber) {
    return null;
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (success) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Bill Settled!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Thank you for dining with us
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Redirecting...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <Header tableNumber={parseInt(tableNumber)} showCart={false} />

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <ReceiptIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Settle Bill - Table {tableNumber}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review all orders before settling
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {orders.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              No outstanding orders
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              All orders have been settled
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push(`/menu?table=${tableNumber}`)}
            >
              Back to Menu
            </Button>
          </Card>
        ) : (
          <>
            {/* Order Details */}
            {orders.map((order, orderIndex) => (
              <Card key={order.id} sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Order #{orderIndex + 1}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status.toUpperCase()}
                      color={order.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <List dense>
                    {order.order_items.map((item) => (
                      <ListItem key={item.id} sx={{ px: 0 }}>
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {item.name} × {item.quantity}
                            </Typography>
                            {item.special_instructions && (
                              <Typography variant="body2" color="text.secondary" fontSize="0.875rem">
                                Note: {item.special_instructions}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="body1" fontWeight={600}>
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight={600}>
                      Order Total
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="primary">
                      ₹{order.total.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}

            {/* Grand Total Card */}
            <Card sx={{ mb: 3, bgcolor: 'primary.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    Total Amount
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{grandTotal.toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {orders.length} order{orders.length !== 1 ? 's' : ''} • Tax included
                </Typography>
              </CardContent>
            </Card>

            {/* Settle Button */}
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              onClick={handleSettleBill}
              disabled={settling}
              sx={{ py: 2, fontSize: '1.1rem', fontWeight: 700 }}
            >
              {settling ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Settle Bill - ₹${grandTotal.toFixed(2)}`
              )}
            </Button>

            <Button
              variant="text"
              fullWidth
              onClick={() => router.push(`/cart?table=${tableNumber}`)}
              sx={{ mt: 2 }}
            >
              Back to Cart
            </Button>
          </>
        )}
      </Container>
    </Box>
  );
}

export default function SettlePage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <SettleContent />
    </Suspense>
  );
}

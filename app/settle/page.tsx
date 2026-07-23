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
import ReceiptIcon from '@mui/icons-material/Receipt';
import StarIcon from '@mui/icons-material/Star';
import RateReviewIcon from '@mui/icons-material/RateReview';
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
  const [error, setError] = useState('');

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

            {/* Payment Instructions */}
            <Card sx={{ bgcolor: 'info.light', mb: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom textAlign="center">
                  Payment Instructions
                </Typography>
                <Typography variant="body1" textAlign="center">
                  Please pay the total bill amount of <strong>₹{grandTotal.toFixed(2)}</strong> at the counter
                </Typography>
              </CardContent>
            </Card>

            {/* Google Review Card */}
            <Card
              component="a"
              href="https://g.page/r/CdvZ90aTouPzEBM/review"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                mb: 2,
                bgcolor: 'warning.light',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                  <RateReviewIcon sx={{ fontSize: 32, color: 'warning.dark' }} />
                  <Typography variant="h6" fontWeight={700} color="warning.dark">
                    Liked the food?
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} sx={{ fontSize: 28, color: '#FFD700' }} />
                  ))}
                </Box>
                <Typography variant="body1" textAlign="center" fontWeight={600} color="text.primary">
                  Please rate us on Google!
                </Typography>
                <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 0.5 }}>
                  Tap here to leave a review
                </Typography>
              </CardContent>
            </Card>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push(`/menu?table=${tableNumber}`)}
              sx={{ mt: 2 }}
            >
              Back to Menu
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

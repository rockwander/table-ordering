'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
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
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem, OrderStatus } from '@/types';

const statusSteps: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'served'];

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Order Placed',
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

function OrderPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = params.id as string;
  const tableNumber = searchParams.get('table');

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingBill, setRequestingBill] = useState(false);

  useEffect(() => {
    if (!orderId || !tableNumber) {
      router.push('/');
      return;
    }

    fetchOrder();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, tableNumber, router]);

  const fetchOrder = async () => {
    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrder(orderData);
      setOrderItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBill = async () => {
    setRequestingBill(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'bill_requested', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error requesting bill:', error);
    } finally {
      setRequestingBill(false);
    }
  };

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

  if (!order) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header tableNumber={tableNumber ? parseInt(tableNumber) : undefined} />
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Alert severity="error">Order not found</Alert>
        </Container>
      </Box>
    );
  }

  const activeStep = statusSteps.indexOf(order.status);
  const isOrderComplete = ['served', 'bill_requested', 'paid'].includes(order.status);
  const canRequestBill = order.status === 'served';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <Header tableNumber={parseInt(tableNumber!)} showCart={false} />

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Order Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Order #{orderId.slice(0, 8)}
              </Typography>
            </Box>
            <Chip
              label={statusLabels[order.status]}
              color={statusColors[order.status]}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        {order.status !== 'cancelled' && !isOrderComplete && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stepper activeStep={activeStep} sx={{ py: 2 }}>
                {statusSteps.map((status) => (
                  <Step key={status}>
                    <StepLabel>{statusLabels[status]}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        )}

        {order.status === 'served' && (
          <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
            Your order has been served! Enjoy your meal.
          </Alert>
        )}

        {order.status === 'bill_requested' && (
          <Alert severity="info" sx={{ mb: 3 }} icon={<ReceiptIcon />}>
            Bill requested. Our staff will bring it to your table shortly.
          </Alert>
        )}

        {order.status === 'cancelled' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            This order has been cancelled.
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Order Items
            </Typography>
            <List>
              {orderItems.map((item, index) => (
                <Box key={item.id}>
                  <ListItem sx={{ px: 0 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {item.name} × {item.quantity}
                      </Typography>
                      {item.special_instructions && (
                        <Typography variant="body2" color="text.secondary">
                          Note: {item.special_instructions}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body1" fontWeight={600}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </ListItem>
                  {index < orderItems.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              Bill Summary
            </Typography>
            <Box sx={{ my: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography variant="body1">Subtotal</Typography>
                <Typography variant="body1">₹{order.subtotal.toFixed(2)}</Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography variant="body1">Tax</Typography>
                <Typography variant="body1">₹{order.tax.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  ₹{order.total.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {canRequestBill && (
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<ReceiptIcon />}
                onClick={handleRequestBill}
                disabled={requestingBill}
                sx={{ mt: 2 }}
              >
                {requestingBill ? <CircularProgress size={24} /> : 'Request Bill'}
              </Button>
            )}
          </CardContent>
        </Card>

        {order.notes && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Order Notes
              </Typography>
              <Typography variant="body1">{order.notes}</Typography>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/menu?table=${tableNumber}`)}
            fullWidth
          >
            Back to Menu
          </Button>
          <Button
            variant="contained"
            startIcon={<RestaurantIcon />}
            onClick={() => router.push(`/menu?table=${tableNumber}`)}
            fullWidth
          >
            Order More
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <OrderPageContent />
    </Suspense>
  );
}

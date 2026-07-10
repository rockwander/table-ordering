'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  List,
  ListItem,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
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

function CartContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableNumber = searchParams.get('table');

  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [outstandingOrders, setOutstandingOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(true);

  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();

  useEffect(() => {
    if (!tableNumber) {
      router.push('/');
      return;
    }
    fetchSettings();
    fetchOutstandingOrders();
  }, [tableNumber, router]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchOutstandingOrders = async () => {
    try {
      setFetchingOrders(true);
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('table_number', parseInt(tableNumber!))
        .neq('status', 'paid')
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;
      setOutstandingOrders(orders || []);
    } catch (error) {
      console.error('Error fetching outstanding orders:', error);
    } finally {
      setFetchingOrders(false);
    }
  };

  const calculateTax = (subtotal: number) => {
    if (!settings) return 0;
    return (subtotal * settings.tax_rate) / 100;
  };

  const newCartSubtotal = getCartTotal();
  const newCartTax = calculateTax(newCartSubtotal);
  const newCartTotal = newCartSubtotal + newCartTax;

  const outstandingTotal = outstandingOrders.reduce((sum, order) => sum + order.total, 0);
  const grandTotal = outstandingTotal + newCartTotal;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_number: parseInt(tableNumber!),
          status: 'pending',
          subtotal: newCartSubtotal,
          tax: newCartTax,
          total: newCartTotal,
          notes: orderNotes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: item.quantity,
        special_instructions: item.specialInstructions || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart, refresh outstanding orders, and stay on cart page
      clearCart();
      setOrderNotes('');
      await fetchOutstandingOrders();
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tableNumber) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <Header tableNumber={parseInt(tableNumber)} showCart={false} />

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push(`/menu?table=${tableNumber}`)}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight={700}>
              Table {tableNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {outstandingOrders.length > 0 ? 'Outstanding orders & new items' : 'Review your order before placing'}
            </Typography>
          </Box>
          {(outstandingOrders.length > 0 || cartItems.length > 0) && (
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={() => router.push(`/settle?table=${tableNumber}`)}
              sx={{ fontWeight: 700 }}
            >
              Settle Bill
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Outstanding Orders */}
        {outstandingOrders.length > 0 && (
          <>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
              Outstanding Orders
            </Typography>
            {outstandingOrders.map((order, orderIndex) => (
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
                    <Typography variant="h6" fontWeight={700}>
                      Order Total
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      ₹{order.total.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* New Cart Items */}
        {cartItems.length === 0 && outstandingOrders.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <ShoppingBagIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Your cart is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add items from the menu to get started
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push(`/menu?table=${tableNumber}`)}
            >
              Browse Menu
            </Button>
          </Card>
        ) : cartItems.length > 0 ? (
          <>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
              New Order
            </Typography>
            <Card sx={{ mb: 3 }}>
              <List>
                {cartItems.map((item, index) => (
                  <Box key={`${item.menuItem.id}-${index}`}>
                    <ListItem
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        py: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {item.menuItem.name}
                          </Typography>
                          {item.specialInstructions && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Note: {item.specialInstructions}
                            </Typography>
                          )}
                          <Typography variant="body1" color="primary" fontWeight={600}>
                            ₹{item.menuItem.price.toFixed(2)} each
                          </Typography>
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => removeFromCart(item.menuItem.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              updateQuantity(item.menuItem.id, item.quantity - 1)
                            }
                            color="primary"
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography
                            variant="h6"
                            sx={{
                              minWidth: 40,
                              textAlign: 'center',
                              fontWeight: 600,
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() =>
                              updateQuantity(item.menuItem.id, item.quantity + 1)
                            }
                            color="primary"
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="h6" fontWeight={700}>
                          ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < cartItems.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <TextField
                  fullWidth
                  label="Order Notes (Optional)"
                  multiline
                  rows={3}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special requests or allergies?"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={700}>
                  Order Summary
                </Typography>
                <Box sx={{ my: 2 }}>
                  {outstandingOrders.length > 0 && (
                    <>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body1" color="text.secondary">
                          Outstanding Orders ({outstandingOrders.length})
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          ₹{outstandingTotal.toFixed(2)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                    </>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body1">New Order Subtotal</Typography>
                    <Typography variant="body1">₹{newCartSubtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body1">
                      Tax ({settings?.tax_rate || 0}%)
                    </Typography>
                    <Typography variant="body1">₹{newCartTax.toFixed(2)}</Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body1">New Order Total</Typography>
                    <Typography variant="body1">₹{newCartTotal.toFixed(2)}</Typography>
                  </Box>
                  {outstandingOrders.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          bgcolor: 'primary.light',
                          p: 1.5,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h6" fontWeight={700}>
                          Grand Total
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          ₹{grandTotal.toFixed(2)}
                        </Typography>
                      </Box>
                    </>
                  )}
                  {outstandingOrders.length === 0 && (
                    <>
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
                          ₹{newCartTotal.toFixed(2)}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : null}

        {/* Show outstanding orders summary when no cart items */}
        {cartItems.length === 0 && outstandingOrders.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={700}>
                Total Outstanding
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  bgcolor: 'primary.light',
                  p: 2,
                  borderRadius: 1,
                  mt: 2,
                }}
              >
                <Typography variant="h5" fontWeight={700}>
                  Grand Total
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  ₹{outstandingTotal.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Add more items from the menu or settle your bill
              </Typography>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}

export default function CartPage() {
  return <CartContent />;
}

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

function CartContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableNumber = searchParams.get('table');

  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();

  useEffect(() => {
    if (!tableNumber) {
      router.push('/');
      return;
    }
    fetchSettings();
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

  const calculateTax = (subtotal: number) => {
    if (!settings) return 0;
    return (subtotal * settings.tax_rate) / 100;
  };

  const subtotal = getCartTotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

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
          subtotal,
          tax,
          total,
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

      // Clear cart and redirect
      clearCart();
      router.push(`/order/${order.id}?table=${tableNumber}`);
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
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Your Cart
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review your order before placing
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {cartItems.length === 0 ? (
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
        ) : (
          <>
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
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="body1">Subtotal</Typography>
                    <Typography variant="body1">₹{subtotal.toFixed(2)}</Typography>
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
                    <Typography variant="body1">₹{tax.toFixed(2)}</Typography>
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
                      ₹{total.toFixed(2)}
                    </Typography>
                  </Box>
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
        )}
      </Container>
    </Box>
  );
}

export default function CartPage() {
  return <CartContent />;
}

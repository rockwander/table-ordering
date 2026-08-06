'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface MenuItem {
  id: string;
  name: string;
  gujarati_name?: string | null;
  price: number;
  category_id: string;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  gujarati_name?: string | null;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  special_instructions: string;
}

interface CreateAdminOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export default function CreateAdminOrderDialog({
  open,
  onClose,
  onOrderCreated,
}: CreateAdminOrderDialogProps) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get name in current language
  const getName = (item: { name: string; gujarati_name?: string | null }) => {
    if (language === 'gu' && item.gujarati_name) {
      return item.gujarati_name;
    }
    return item.name;
  };

  // Load categories and menu items
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('display_order');

      if (itemsError) throw itemsError;

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);

      // Auto-select first category
      if (categoriesData && categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching menu data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (menuItem: MenuItem) => {
    const existingIndex = cart.findIndex(item => item.menuItem.id === menuItem.id);

    if (existingIndex >= 0) {
      // Increment quantity
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      // Add new item
      setCart([...cart, { menuItem, quantity: 1, special_instructions: '' }]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;

    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }

    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateInstructions = (index: number, instructions: string) => {
    const newCart = [...cart];
    newCart[index].special_instructions = instructions;
    setCart(newCart);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const subtotal = calculateTotal();
      const total = subtotal * 0.9; // 10% discount applied

      // Create order with table_number = NULL for admin orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_number: null, // NULL indicates admin order
          subtotal: subtotal,
          total: total,
          status: 'confirmed', // Admin orders start as confirmed
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price,
        name: item.menuItem.name,
        gujarati_name: item.menuItem.gujarati_name,
        special_instructions: item.special_instructions || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Success!
      console.log('✅ Admin order created successfully');
      onOrderCreated();
      handleClose();
    } catch (err: any) {
      console.error('Error creating admin order:', err);
      setError(err.message || 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setCart([]);
    setSelectedCategory(null);
    setError(null);
    onClose();
  };

  const filteredMenuItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>
            {t('adminOrder.createOrder') || 'Create Admin Order'}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {/* Left Side: Menu Items */}
            <Grid item xs={12} md={7}>
              {/* Category Tabs */}
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={getName(category)}
                    onClick={() => setSelectedCategory(category.id)}
                    color={selectedCategory === category.id ? 'primary' : 'default'}
                    variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>

              {/* Menu Items Grid */}
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                <Grid container spacing={1}>
                  {filteredMenuItems.map((item) => (
                    <Grid item xs={6} key={item.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 2 },
                          height: '100%',
                        }}
                        onClick={() => addToCart(item)}
                      >
                        <CardContent>
                          <Typography variant="body2" fontWeight={600} gutterBottom>
                            {getName(item)}
                          </Typography>
                          <Typography variant="h6" color="primary" fontWeight={700}>
                            ₹{item.price}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            fullWidth
                            variant="outlined"
                            sx={{ mt: 1 }}
                          >
                            Add
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>

            {/* Right Side: Cart */}
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {t('adminOrder.orderItems') || 'Order Items'} ({cart.length})
              </Typography>

              {cart.length === 0 ? (
                <Alert severity="info">
                  {t('adminOrder.noItems') || 'No items added yet'}
                </Alert>
              ) : (
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {cart.map((item, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box display="flex" justifyContent="space-between" alignItems="start">
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={600}>
                              {getName(item.menuItem)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ₹{item.menuItem.price} × {item.quantity} = ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(index, -1)}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 20, textAlign: 'center' }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => updateQuantity(index, 1)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCart(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder={t('adminOrder.specialInstructions') || 'Special instructions (optional)'}
                          value={item.special_instructions}
                          onChange={(e) => updateInstructions(index, e.target.value)}
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Cart Summary */}
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{t('bill.subtotal') || 'Subtotal'}:</Typography>
                  <Typography variant="body2">₹{calculateTotal().toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="success.main">
                    {t('liveOrders.appDiscount') || 'Discount (10%)'}:
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    - ₹{(calculateTotal() * 0.1).toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={700}>
                    {t('bill.total') || 'Total'}:
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    ₹{(calculateTotal() * 0.9).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={creating}>
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={handleCreateOrder}
          disabled={creating || cart.length === 0}
        >
          {creating ? (
            <CircularProgress size={24} />
          ) : (
            t('adminOrder.createOrder') || 'Create Order'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

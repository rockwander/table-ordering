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
  Divider,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface MenuItem {
  id: string;
  name: string;
  gujarati_name?: string | null;
  price: number;
}

interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  gujarati_name?: string | null;
  price: number;
  quantity: number;
  special_instructions: string | null;
}

interface OrderData {
  id: string;
  subtotal: number;
  discount: number;
  total: number;
  order_items: OrderItem[];
}

interface EditOrderDialogProps {
  open: boolean;
  orderId: string | null;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export default function EditOrderDialog({
  open,
  orderId,
  onClose,
  onOrderUpdated,
}: EditOrderDialogProps) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [removeAppDiscount, setRemoveAppDiscount] = useState(false);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showAddItems, setShowAddItems] = useState(false);

  // Helper function to get name in current language
  const getName = (item: { name: string; gujarati_name?: string | null }) => {
    if (language === 'gu' && item.gujarati_name) {
      return item.gujarati_name;
    }
    return item.name;
  };

  // Load order data when dialog opens
  useEffect(() => {
    if (open && orderId) {
      fetchOrderData();
      fetchMenuItems();
    }
  }, [open, orderId]);

  const fetchOrderData = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const { data, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      setOrderItems(data.order_items || []);

      // Calculate if app discount was applied
      const expectedTotal = data.subtotal * 0.9; // With 10% discount
      const hasAppDiscount = Math.abs(data.total - expectedTotal) < 0.01;
      setRemoveAppDiscount(!hasAppDiscount);

      // Check if there's a custom discount (total is less than subtotal but not 10%)
      if (!hasAppDiscount && data.total < data.subtotal) {
        setCustomDiscount(data.subtotal - data.total);
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, gujarati_name, price')
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const newItems = [...orderItems];
    newItems[index].quantity += delta;

    if (newItems[index].quantity <= 0) {
      newItems.splice(index, 1);
    }

    setOrderItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const updateInstructions = (index: number, instructions: string) => {
    const newItems = [...orderItems];
    newItems[index].special_instructions = instructions;
    setOrderItems(newItems);
  };

  const addMenuItem = (menuItem: MenuItem) => {
    const existingIndex = orderItems.findIndex(
      item => item.menu_item_id === menuItem.id
    );

    if (existingIndex >= 0) {
      updateQuantity(existingIndex, 1);
    } else {
      setOrderItems([
        ...orderItems,
        {
          id: '', // New item, no ID yet
          menu_item_id: menuItem.id,
          name: menuItem.name,
          gujarati_name: menuItem.gujarati_name,
          price: menuItem.price,
          quantity: 1,
          special_instructions: null,
        },
      ]);
    }
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();

    if (customDiscount > 0) {
      return customDiscount;
    }

    if (!removeAppDiscount) {
      return subtotal * 0.1; // 10% app discount
    }

    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleSave = async () => {
    if (orderItems.length === 0) {
      setError('Order must have at least one item');
      return;
    }

    if (!orderId) return;

    setSaving(true);
    setError(null);

    try {
      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      // Update order totals (discount is calculated on the fly, not stored)
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          subtotal,
          total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Delete all existing order items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (deleteError) throw deleteError;

      // Insert updated order items
      const itemsToInsert = orderItems.map(item => ({
        order_id: orderId,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        gujarati_name: item.gujarati_name,
        special_instructions: item.special_instructions,
      }));

      const { error: insertError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      console.log('✅ Order updated successfully');
      onOrderUpdated();
      handleClose();
    } catch (err: any) {
      console.error('Error updating order:', err);
      setError(err.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOrderItems([]);
    setRemoveAppDiscount(false);
    setCustomDiscount(0);
    setShowAddItems(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon />
            <Typography variant="h6" fontWeight={700}>
              {t('orderEdit.editOrder') || 'Edit Order'}
            </Typography>
          </Box>
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
          <>
            {/* Order Items */}
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('orderEdit.items') || 'Order Items'}
            </Typography>

            {orderItems.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('orderEdit.noItems') || 'No items in order'}
              </Alert>
            ) : (
              <Box sx={{ mb: 2 }}>
                {orderItems.map((item, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={600}>
                            {getName(item)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <IconButton size="small" onClick={() => updateQuantity(index, -1)}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="body2" fontWeight={600} sx={{ minWidth: 20, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton size="small" onClick={() => updateQuantity(index, 1)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => removeItem(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder={t('orderEdit.specialInstructions') || 'Special instructions'}
                        value={item.special_instructions || ''}
                        onChange={(e) => updateInstructions(index, e.target.value)}
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {/* Add Items Section - Multiselect Dropdown with Search */}
            <Autocomplete
              multiple
              options={menuItems}
              getOptionLabel={(option) => `${getName(option)} - ₹${option.price}`}
              onChange={(event, newValue) => {
                // Add all selected items
                newValue.forEach((item) => {
                  // Check if item already exists in order
                  const existingIndex = orderItems.findIndex(
                    orderItem => orderItem.menu_item_id === item.id
                  );

                  if (existingIndex === -1) {
                    // Item not in order, add it
                    addMenuItem(item);
                  }
                });
              }}
              value={[]} // Always reset after selection
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('orderEdit.addItems') || 'Add Items'}
                  placeholder={t('orderEdit.searchItems') || 'Search items...'}
                />
              )}
              sx={{ mb: 2 }}
              size="small"
              filterSelectedOptions={false}
              clearOnEscape
              disableCloseOnSelect
            />

            <Divider sx={{ my: 2 }} />

            {/* Discount Options */}
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('orderEdit.discounts') || 'Discounts'}
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={removeAppDiscount}
                  onChange={(e) => {
                    setRemoveAppDiscount(e.target.checked);
                    if (e.target.checked) {
                      setCustomDiscount(0); // Reset custom discount
                    }
                  }}
                />
              }
              label={t('orderEdit.removeAppDiscount') || 'Remove 10% App Discount'}
            />

            <TextField
              fullWidth
              type="number"
              label={t('orderEdit.customDiscount') || 'Custom Discount Amount'}
              value={customDiscount}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setCustomDiscount(value);
                if (value > 0) {
                  setRemoveAppDiscount(true); // Auto-remove app discount
                }
              }}
              disabled={!removeAppDiscount}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              sx={{ mt: 1 }}
            />

            <Divider sx={{ my: 2 }} />

            {/* Bill Summary */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {t('orderEdit.summary') || 'Summary'}
              </Typography>

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">{t('bill.subtotal') || 'Subtotal'}:</Typography>
                <Typography variant="body2">₹{calculateSubtotal().toFixed(2)}</Typography>
              </Box>

              {calculateDiscount() > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="success.main">
                    {customDiscount > 0
                      ? (t('orderEdit.customDiscount') || 'Custom Discount')
                      : (t('liveOrders.appDiscount') || 'App Discount (10%)')
                    }:
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    - ₹{calculateDiscount().toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6" fontWeight={700}>
                  {t('bill.total') || 'Total'}:
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  ₹{calculateTotal().toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || orderItems.length === 0}
        >
          {saving ? <CircularProgress size={24} /> : (t('orderEdit.saveChanges') || 'Save Changes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

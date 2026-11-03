'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Category, Order } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { isNewOrder } from '@/lib/orderStatus';
import { initializeNotifications, showLocalNotification, checkNotificationSupport } from '@/lib/notifications';
import { initializePushNotifications } from '@/lib/fcm-notifications';
import { stopNotificationSound } from '@/lib/sound';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const CATEGORY_STORAGE_KEY = 'kitchen_category_filters';
// Single-category filter saved before multi-select; migrated on first load
const LEGACY_CATEGORY_STORAGE_KEY = 'kitchen_category_filter';

interface KitchenOrder extends Order {
  order_items: Array<{
    id: string;
    menu_item_id: string | null;
    name: string;
    gujarati_name?: string | null;
    quantity: number;
    special_instructions: string | null;
    menu_items?: { category_id: string | null } | null;
  }>;
  orderNumber: number;
}

// One chip in a row: an order that contains the row's item
interface ItemOrderRef {
  order: KitchenOrder;
  quantity: number;
  notes: string[];
}

// One row: an item aggregated across all open orders
interface KitchenRow {
  key: string;
  name: string;
  gujarati_name?: string | null;
  totalQuantity: number;
  orders: ItemOrderRef[];
}

function KitchenViewContent() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // Empty means all categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingOrderIds, setAcceptingOrderIds] = useState<Set<string>>(new Set());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { language, t } = useLanguage();

  // Refs avoid stale closures in real-time subscriptions
  const notificationsEnabledRef = useRef(notificationsEnabled);
  // Drops responses from older fetches that resolve after newer ones
  const fetchSeqRef = useRef(0);

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  const getItemName = (item: { name: string; gujarati_name?: string | null }) => {
    if (language === 'gu' && item.gujarati_name) {
      return item.gujarati_name;
    }
    return item.name;
  };

  const getOrderLabel = (order: KitchenOrder) =>
    t('kitchen.chipLabel')
      .replace('{table}', order.table_number ?? t('kitchen.adminShort'))
      .replace('{n}', String(order.orderNumber));

  // Restore this device's category filter (e.g. a station that only makes dosas)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSelectedCategories(parsed.filter(id => typeof id === 'string'));
        return;
      }

      const legacy = localStorage.getItem(LEGACY_CATEGORY_STORAGE_KEY);
      if (legacy && legacy !== 'all') setSelectedCategories([legacy]);
    } catch {
      // Storage unavailable or corrupt - fall back to all categories
    }
  }, []);

  const handleCategoriesChange = (categoryIds: string[]) => {
    setSelectedCategories(categoryIds);
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categoryIds));
      localStorage.removeItem(LEGACY_CATEGORY_STORAGE_KEY);
    } catch {
      // Storage unavailable - filter just won't persist
    }
  };

  // Ignore saved categories that were since deleted or deactivated
  const activeSelectedCategories = useMemo(
    () => selectedCategories.filter(id => categories.some(category => category.id === id)),
    [selectedCategories, categories]
  );
  const isFiltered = activeSelectedCategories.length > 0;

  // Initialize notifications (same setup as Live Orders, so sound works if the app opens here)
  useEffect(() => {
    const setupNotifications = async () => {
      if (Capacitor.isNativePlatform()) {
        await initializePushNotifications();
        setNotificationsEnabled(true);
        return;
      }

      const support = checkNotificationSupport();
      if (support.supported) {
        const initialized = await initializeNotifications();
        setNotificationsEnabled(initialized);
      }
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchCategories();

    const channel = supabase
      .channel('kitchen-view-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as Order;
          fetchOrders();

          // Web notification for new orders only - no toasts, no waiter calls
          if (notificationsEnabledRef.current) {
            showLocalNotification('🍽️ New Order!', {
              body: `Table ${order.table_number} placed a new order`,
              tag: `order-${order.id}`,
              requireInteraction: true,
              data: {
                table_number: order.table_number,
                order_id: order.id,
                url: '/admin/kitchen'
              }
            }).catch(err => console.error('Notification error:', err));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      // Order items are inserted after the order row, so refetch when they land
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => fetchOrders()
      )
      // Diner orders insert this row after their items - a reliable "items are in" signal
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'buzzer_notifications' },
        () => fetchOrders()
      )
      .subscribe();

    // Refresh every 30 seconds as backup
    const interval = setInterval(fetchOrders, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []); // Subscriptions use refs to avoid stale closures

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchOrders = async () => {
    const seq = ++fetchSeqRef.current;
    try {
      // Same window as Live Orders so order numbers match
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*, menu_items (category_id))
        `)
        .neq('status', 'paid')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (seq !== fetchSeqRef.current) return;

      // Number orders within each table's open bill, matching Live Orders
      const countByTable = new Map<string, number>();
      const numbered = ((data || []) as Omit<KitchenOrder, 'orderNumber'>[]).map((order) => {
        const tableKey = order.table_number !== null ? order.table_number : 'admin';
        const orderNumber = (countByTable.get(tableKey) || 0) + 1;
        countByTable.set(tableKey, orderNumber);
        return { ...order, orderNumber };
      });

      setOrders(numbered.filter(order => order.status !== 'cancelled'));
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  };

  const handleAcceptOrder = async (order: KitchenOrder) => {
    if (!isNewOrder(order) || acceptingOrderIds.has(order.id)) return;

    setAcceptingOrderIds(prev => new Set(prev).add(order.id));
    // Optimistically turn the chips red; the realtime refetch confirms it
    setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: 'ready' } : o)));

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error accepting order:', error);
      setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: order.status } : o)));
      alert(t('kitchen.acceptFailed'));
    } finally {
      setAcceptingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  // Aggregate items across orders, honoring the category filter
  const rows = useMemo(() => {
    const rowsMap = new Map<string, KitchenRow>();

    orders.forEach(order => {
      order.order_items.forEach(item => {
        if (isFiltered && !activeSelectedCategories.includes(item.menu_items?.category_id ?? '')) {
          return;
        }

        const key = item.menu_item_id || item.name;
        if (!rowsMap.has(key)) {
          rowsMap.set(key, {
            key,
            name: item.name,
            gujarati_name: item.gujarati_name,
            totalQuantity: 0,
            orders: [],
          });
        }

        const row = rowsMap.get(key)!;
        row.totalQuantity += item.quantity;

        // The same item can appear twice in one order (e.g. with different notes)
        let ref = row.orders.find(r => r.order.id === order.id);
        if (!ref) {
          ref = { order, quantity: 0, notes: [] };
          row.orders.push(ref);
        }
        ref.quantity += item.quantity;
        if (item.special_instructions) ref.notes.push(item.special_instructions);
      });
    });

    // Rows with orders still to accept come first, oldest waiting order first
    const oldestNewOrderTime = (row: KitchenRow) => {
      const newRef = row.orders.find(r => isNewOrder(r.order));
      return newRef ? new Date(newRef.order.created_at).getTime() : Infinity;
    };

    return Array.from(rowsMap.values()).sort((a, b) => {
      const aTime = oldestNewOrderTime(a);
      const bTime = oldestNewOrderTime(b);
      if (aTime !== bTime) return aTime < bTime ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [orders, activeSelectedCategories, isFiltered]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      onClick={async () => {
        // Stop any playing notification sounds when user taps anywhere
        stopNotificationSound();

        // Clear Android system notifications from the tray
        if (Capacitor.isNativePlatform()) {
          try {
            await LocalNotifications.removeAllDeliveredNotifications();
          } catch (error) {
            console.error('Error clearing system notifications:', error);
          }
        }
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('kitchen.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('kitchen.subtitle')}
        </Typography>
      </Box>

      {/* Category filter */}
      <FormControl size="small" sx={{ mb: 2, width: { xs: '100%', sm: 360 } }}>
        <InputLabel id="kitchen-category-filter-label" shrink>
          {t('kitchen.categories')}
        </InputLabel>
        <Select
          labelId="kitchen-category-filter-label"
          multiple
          displayEmpty
          value={activeSelectedCategories}
          onChange={(e) => {
            const value = e.target.value;
            handleCategoriesChange(typeof value === 'string' ? value.split(',') : value);
          }}
          input={<OutlinedInput notched label={t('kitchen.categories')} />}
          renderValue={(selected) =>
            selected.length === 0 ? (
              t('kitchen.allCategories')
            ) : (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {selected.map(id => (
                  <Chip
                    key={id}
                    size="small"
                    label={categories.find(category => category.id === id)?.name ?? id}
                  />
                ))}
              </Box>
            )
          }
        >
          {categories.map(category => (
            <MenuItem key={category.id} value={category.id}>
              <Checkbox checked={activeSelectedCategories.includes(category.id)} />
              <ListItemText primary={category.name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip size="small" color="success" label=" " sx={{ width: 24 }} />
          <Typography variant="body2" color="text.secondary">{t('kitchen.legendNew')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip size="small" color="error" label=" " sx={{ width: 24 }} />
          <Typography variant="body2" color="text.secondary">{t('kitchen.legendAccepted')}</Typography>
        </Box>
      </Box>

      {rows.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {t(isFiltered ? 'kitchen.noItemsInCategory' : 'kitchen.noItems')}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '40%' }}>{t('kitchen.itemQty')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('kitchen.tableOrder')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => {
                const notes = row.orders.flatMap(ref =>
                  ref.notes.map(note => ({ label: getOrderLabel(ref.order), note }))
                );

                return (
                  <TableRow key={row.key}>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {getItemName(row)} × {row.totalQuantity}
                      </Typography>
                      {notes.map((n, i) => (
                        <Typography key={i} variant="caption" color="text.secondary" component="div">
                          {t('liveOrders.note')} ({n.label}): {n.note}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {row.orders.map(ref => {
                          const isNew = isNewOrder(ref.order);
                          const quantitySuffix = ref.quantity > 1 ? ` × ${ref.quantity}` : '';
                          return (
                            <Chip
                              key={ref.order.id}
                              label={`${getOrderLabel(ref.order)}${quantitySuffix}`}
                              color={isNew ? 'success' : 'error'}
                              onClick={isNew ? () => handleAcceptOrder(ref.order) : undefined}
                              disabled={acceptingOrderIds.has(ref.order.id)}
                              sx={{ fontWeight: 700 }}
                            />
                          );
                        })}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default function KitchenViewPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <KitchenViewContent />
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

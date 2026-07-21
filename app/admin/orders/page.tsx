'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem, OrderStatus } from '@/types';

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
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

const filterOptions: ('all' | OrderStatus)[] = [
  'all',
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'bill_requested',
  'paid',
];

interface TableOrders {
  table_number: number;
  orders: Order[];
  total: number;
  hasUnviewed: boolean;
}

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableOrders | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [updating, setUpdating] = useState(false);
  const [settlingBill, setSettlingBill] = useState(false);
  const [viewMode, setViewMode] = useState<'unsettled' | 'settled'>('unsettled');
  const [error, setError] = useState('');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    // Initialize audio context
    if (typeof window !== 'undefined') {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    }

    fetchOrders();

    // Subscribe to real-time order updates
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        () => {
          playBuzzer();
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const playBuzzer = () => {
    if (!audioContext) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing buzzer:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const groupOrdersByTable = (orders: Order[]): TableOrders[] => {
    const filteredOrders = orders.filter(order =>
      viewMode === 'unsettled' ? order.status !== 'paid' : order.status === 'paid'
    );

    const grouped = filteredOrders.reduce((acc, order) => {
      const tableNum = order.table_number;
      if (!acc[tableNum]) {
        acc[tableNum] = [];
      }
      acc[tableNum].push(order);
      return acc;
    }, {} as Record<number, Order[]>);

    return Object.entries(grouped).map(([tableNum, orders]) => ({
      table_number: parseInt(tableNum),
      orders: orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      total: orders.reduce((sum, order) => sum + order.total, 0),
      hasUnviewed: orders.some(order => !(order as any).viewed_by_admin),
    })).sort((a, b) => a.table_number - b.table_number);
  };

  const handleOpenTable = (tableOrders: TableOrders) => {
    setSelectedTable(tableOrders);

    // Mark all orders as viewed
    tableOrders.orders.forEach(async (order) => {
      if (!(order as any).viewed_by_admin) {
        await supabase
          .from('orders')
          .update({ viewed_by_admin: true })
          .eq('id', order.id);
      }
    });
  };

  const handleCloseTable = () => {
    setSelectedTable(null);
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const handleOpenOrder = async (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);

    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const handleCloseOrder = () => {
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    setError('');

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      await fetchOrders();
      handleCloseOrder();
    } catch (error) {
      console.error('Error updating order:', error);
      setError('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSettleBill = async () => {
    if (!selectedTable) return;

    setSettlingBill(true);
    setError('');

    try {
      const orderIds = selectedTable.orders.map(order => order.id);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .in('id', orderIds);

      if (error) throw error;

      // Create buzzer notification for settled bill
      const { error: buzzerError } = await supabase
        .from('buzzer_notifications')
        .insert({
          table_number: selectedTable.table_number,
          status: 'active',
          notification_type: 'settle_bill',
        });

      if (buzzerError) {
        console.error('❌ Error creating buzzer notification:', buzzerError);
        // Don't throw - bill was settled successfully, just notification failed
      } else {
        console.log('✅ Buzzer notification sent for settled bill');
      }

      await fetchOrders();
      handleCloseTable();
    } catch (error) {
      console.error('Error settling bill:', error);
      setError('Failed to settle bill');
    } finally {
      setSettlingBill(false);
    }
  };

  const tableGroups = groupOrdersByTable(orders);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Orders Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View orders grouped by table
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchOrders}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={viewMode}
            onChange={(_, value) => setViewMode(value)}
          >
            <Tab label="Unsettled Orders" value="unsettled" />
            <Tab label="Settled Orders" value="settled" />
          </Tabs>
        </Box>

        <CardContent>
          {tableGroups.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {viewMode === 'unsettled' ? 'No unsettled orders' : 'No settled orders'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
              {tableGroups.map((tableGroup) => (
                <Card
                  key={tableGroup.table_number}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': { boxShadow: 2 },
                    border: tableGroup.hasUnviewed ? '2px solid' : '1px solid',
                    borderColor: tableGroup.hasUnviewed ? 'warning.main' : 'divider',
                  }}
                  onClick={() => handleOpenTable(tableGroup)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h5" fontWeight={700}>
                        Table {tableGroup.table_number}
                      </Typography>
                      {tableGroup.hasUnviewed && (
                        <Chip
                          label="NEW"
                          color="warning"
                          size="small"
                          sx={{ animation: 'pulse 2s infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } } }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {tableGroup.orders.length} order{tableGroup.orders.length !== 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="h6" color="primary" fontWeight={700}>
                      ₹{tableGroup.total.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Table Orders Dialog */}
      <Dialog
        open={!!selectedTable}
        onClose={handleCloseTable}
        maxWidth="lg"
        fullWidth
      >
        {selectedTable && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    Table {selectedTable.table_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTable.orders.length} order{selectedTable.orders.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                {viewMode === 'unsettled' && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSettleBill}
                    disabled={settlingBill}
                  >
                    {settlingBill ? <CircularProgress size={20} /> : `Settle Bill - ₹${selectedTable.total.toFixed(2)}`}
                  </Button>
                )}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {selectedTable.orders.map((order, index) => (
                <Card key={order.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          Order #{index + 1}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={statusLabels[order.status]}
                          color={statusColors[order.status]}
                          size="small"
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenOrder(order)}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Box>
                    <Typography variant="h6" color="primary" fontWeight={700}>
                      ₹{order.total.toFixed(2)}
                    </Typography>
                    {order.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Note: {order.notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Card variant="outlined" sx={{ bgcolor: 'primary.light', mt: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>
                      Total Amount
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      ₹{selectedTable.total.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleCloseTable}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog
        open={!!selectedOrder}
        onClose={handleCloseOrder}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Order #{selectedOrder.id.slice(0, 8)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Table {selectedOrder.table_number} •{' '}
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Order Items
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.name}
                            </Typography>
                            {item.special_instructions && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                Note: {item.special_instructions}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">
                            ₹{item.price.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {selectedOrder.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Order Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">{selectedOrder.notes}</Typography>
                  </Paper>
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Bill Summary
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Subtotal</Typography>
                    <Typography variant="body2">
                      ₹{selectedOrder.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tax</Typography>
                    <Typography variant="body2">
                      ₹{selectedOrder.tax.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body1" fontWeight={700}>
                      Total
                    </Typography>
                    <Typography variant="body1" fontWeight={700} color="primary">
                      ₹{selectedOrder.total.toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </Box>

              <Box>
                <FormControl fullWidth>
                  <InputLabel>Order Status</InputLabel>
                  <Select
                    value={newStatus}
                    label="Order Status"
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleCloseOrder}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === selectedOrder.status}
              >
                {updating ? <CircularProgress size={20} /> : 'Update Status'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default function AdminOrders() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <OrdersContent />
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

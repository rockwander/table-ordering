'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface OrderWithItems extends Order {
  order_items: Array<{
    id: string;
    name: string;
    gujarati_name?: string | null;
    price: number;
    quantity: number;
    special_instructions: string | null;
  }>;
  orderNumber?: number;
}

interface Bill {
  bill_id: string;
  display_bill_id: number;
  table_number: string;
  orders: OrderWithItems[];
  total: number;
  created_at: string;
}

function LiveOrdersContent() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingReady, setMarkingReady] = useState<string | null>(null);
  const [settlingBill, setSettlingBill] = useState<string | null>(null);
  const { language, getItemName } = useLanguage();

  useEffect(() => {
    fetchBills();

    // Set up real-time subscription
    const channel = supabase
      .channel('live-orders-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchBills();
        }
      )
      .subscribe();

    // Refresh every 30 seconds as backup
    const interval = setInterval(fetchBills, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchBills = async () => {
    try {
      // Fetch all orders with items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Group orders by table_number to create bills
      const billsMap = new Map<string, Bill>();

      ordersData?.forEach((order: any) => {
        const key = `${order.table_number}`;

        if (!billsMap.has(key)) {
          // Generate bill ID based on table and first order time
          const billId = `${order.table_number}-${new Date(order.created_at).getTime()}`;
          billsMap.set(key, {
            bill_id: billId,
            display_bill_id: 0, // Will be set properly later
            table_number: order.table_number,
            orders: [],
            total: 0,
            created_at: order.created_at,
          });
        }

        const bill = billsMap.get(key)!;
        bill.orders.push(order);
        bill.total += order.total;
      });

      // Convert map to array and assign sequential bill IDs
      const billsArray = Array.from(billsMap.values());

      // Sort by created_at (newest first)
      billsArray.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Assign sequential bill IDs (cycling from 1-999)
      billsArray.forEach((bill, index) => {
        bill.display_bill_id = ((index % 999) + 1);

        // Sort orders within bill by created_at (newest first)
        bill.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Assign order numbers within bill
        bill.orders.forEach((order, orderIndex) => {
          order.orderNumber = orderIndex + 1;
        });
      });

      setBills(billsArray);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReady = async (orderId: string) => {
    setMarkingReady(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      await fetchBills();
    } catch (error) {
      console.error('Error marking order as ready:', error);
      alert('Failed to mark order as ready');
    } finally {
      setMarkingReady(null);
    }
  };

  const handleSettleBill = async (bill: Bill) => {
    if (!confirm(`Settle bill #${String(bill.display_bill_id).padStart(3, '0')} for Table ${bill.table_number}?`)) {
      return;
    }

    setSettlingBill(bill.bill_id);
    try {
      const orderIds = bill.orders.map(order => order.id);

      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .in('id', orderIds);

      if (error) throw error;
      await fetchBills();
    } catch (error) {
      console.error('Error settling bill:', error);
      alert('Failed to settle bill');
    } finally {
      setSettlingBill(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      await fetchBills();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const handlePrintBill = (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill #${String(bill.display_bill_id).padStart(3, '0')} - Table ${bill.table_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #D4691A; }
          h2 { margin-top: 20px; border-bottom: 2px solid #D4691A; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .totals { margin-top: 20px; text-align: right; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
          .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>Ramani's Cafe</h1>
        <p style="text-align: center;">Bill #${String(bill.display_bill_id).padStart(3, '0')}</p>
        <p><strong>Table:</strong> ${bill.table_number}</p>
        <p><strong>Date:</strong> ${new Date(bill.created_at).toLocaleString()}</p>

        ${bill.orders.map((order, index) => `
          <h2>Order #${order.orderNumber} - ${statusLabels[order.status]}</h2>
          <p style="font-size: 12px; color: #666;">${new Date(order.created_at).toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items.map(item => `
                <tr>
                  <td>
                    ${getItemName(item)}
                    ${item.special_instructions ? `<br><small style="color: #666;">Note: ${item.special_instructions}</small>` : ''}
                  </td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">₹${item.price.toFixed(2)}</td>
                  <td class="text-right">₹${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('')}

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${bill.total.toFixed(2)}</span>
          </div>
          <div class="total-row" style="color: #22c55e; font-weight: 600;">
            <span>App Discount (10%):</span>
            <span>- ₹${(bill.total * 0.1).toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Final Amount:</span>
            <span>₹${(bill.total * 0.9).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>Ramani's Cafe - Premium South Indian Cuisine</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 30px; background: #D4691A; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Print Bill</button>
          <button onclick="window.close()" style="padding: 10px 30px; background: #666; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(billHTML);
    printWindow.document.close();
  };

  // Filter bills based on selected tab
  const getFilteredBills = () => {
    switch (selectedTab) {
      case 0: // New Orders - bills with at least one order not "ready" or "paid"
        return bills.filter(bill =>
          bill.orders.some(order =>
            order.status !== 'ready' &&
            order.status !== 'served' &&
            order.status !== 'bill_requested' &&
            order.status !== 'paid'
          )
        );
      case 1: // Settle Bill - bills with at least one order placed (not paid)
        return bills.filter(bill =>
          bill.orders.some(order => order.status !== 'paid')
        );
      case 2: // Past Bills - bills where all orders are paid
        return bills.filter(bill =>
          bill.orders.every(order => order.status === 'paid')
        );
      default:
        return [];
    }
  };

  const filteredBills = getFilteredBills();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Live Orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time order management and billing
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
          <Tab label="New Orders" />
          <Tab label="Settle Bill" />
          <Tab label="Past Bills" />
        </Tabs>
      </Box>

      {/* Content */}
      {filteredBills.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {selectedTab === 0 && 'No new orders'}
            {selectedTab === 1 && 'No bills to settle'}
            {selectedTab === 2 && 'No past bills'}
          </Typography>
        </Box>
      ) : (
        <Box>
          {filteredBills.map((bill) => (
            <Accordion key={bill.bill_id} defaultExpanded={selectedTab !== 2} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`Bill #${String(bill.display_bill_id).padStart(3, '0')}`}
                      color="secondary"
                      sx={{ fontWeight: 700 }}
                    />
                    <Chip label={`Table ${bill.table_number}`} color="primary" />
                    <Typography variant="body1" fontWeight={600}>
                      {bill.orders.length} order{bill.orders.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    {selectedTab === 1 && (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          ₹{bill.total.toFixed(2)}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          ₹{(bill.total * 0.9).toFixed(2)}
                        </Typography>
                      </>
                    )}
                    {selectedTab !== 1 && (
                      <Typography variant="h6" fontWeight={700} color="primary">
                        ₹{bill.total.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {/* Orders in this bill */}
                {bill.orders.map((order, index) => {
                  // For "New Orders" tab, only show orders that are not ready/served/paid
                  if (selectedTab === 0 && (order.status === 'ready' || order.status === 'served' || order.status === 'bill_requested' || order.status === 'paid')) {
                    return null;
                  }

                  return (
                    <Card key={order.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Order #{order.orderNumber}
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
                            {selectedTab !== 2 && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Order Items */}
                        <TableContainer>
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
                              {order.order_items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <Typography variant="body2">{getItemName(item)}</Typography>
                                    {item.special_instructions && (
                                      <Typography variant="caption" color="text.secondary">
                                        Note: {item.special_instructions}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center">{item.quantity}</TableCell>
                                  <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
                                  <TableCell align="right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            {selectedTab === 0 && order.status !== 'ready' && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handleMarkAsReady(order.id)}
                                disabled={markingReady === order.id}
                              >
                                {markingReady === order.id ? 'Marking...' : 'Mark as Ready'}
                              </Button>
                            )}
                          </Box>
                          <Typography variant="body1" fontWeight={700} color="primary">
                            ₹{order.total.toFixed(2)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Bill Summary and Actions (only for Settle Bill tab) */}
                {selectedTab === 1 && (
                  <>
                    <Card variant="outlined" sx={{ mt: 2, bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Bill Summary
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Subtotal ({bill.orders.length} order{bill.orders.length !== 1 ? 's' : ''})</Typography>
                          <Typography variant="body2">₹{bill.total.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            App Discount (10%)
                          </Typography>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            - ₹{(bill.total * 0.1).toFixed(2)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="h6" fontWeight={700}>
                            Final Amount
                          </Typography>
                          <Typography variant="h6" fontWeight={700} color="primary">
                            ₹{(bill.total * 0.9).toFixed(2)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={() => handlePrintBill(bill)}
                      >
                        Print Bill
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleSettleBill(bill)}
                        disabled={settlingBill === bill.bill_id}
                      >
                        {settlingBill === bill.bill_id ? 'Settling...' : 'Settle Bill'}
                      </Button>
                    </Box>
                  </>
                )}

                {/* Past Bills - Show print option */}
                {selectedTab === 2 && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrintBill(bill)}
                      fullWidth
                    >
                      Print Bill
                    </Button>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function LiveOrdersPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <LiveOrdersContent />
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DownloadIcon from '@mui/icons-material/Download';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Table } from '@/types';
import QRCode from 'qrcode';

function TablesContent() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableDialog, setTableDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableForm, setTableForm] = useState({
    table_number: 1,
    is_active: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{ table: Table; qrUrl: string } | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (table: Table) => {
    try {
      const baseUrl = window.location.origin;
      const menuUrl = `${baseUrl}/menu?table=${table.table_number}`;
      const qrDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#D4691A',
          light: '#FFFFFF',
        },
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const handleOpenDialog = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setTableForm({
        table_number: table.table_number,
        is_active: table.is_active,
      });
    } else {
      setEditingTable(null);
      const nextTableNumber = tables.length > 0
        ? Math.max(...tables.map(t => t.table_number)) + 1
        : 1;
      setTableForm({
        table_number: nextTableNumber,
        is_active: true,
      });
    }
    setTableDialog(true);
  };

  const handleSaveTable = async () => {
    setSaving(true);
    setError('');

    try {
      if (editingTable) {
        const { error } = await supabase
          .from('tables')
          .update({ ...tableForm, updated_at: new Date().toISOString() })
          .eq('id', editingTable.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tables').insert(tableForm);
        if (error) throw error;
      }

      await fetchTables();
      setTableDialog(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      const { error } = await supabase.from('tables').delete().eq('id', id);
      if (error) throw error;
      await fetchTables();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleShowQR = async (table: Table) => {
    try {
      const qrUrl = await generateQRCode(table);
      setSelectedQR({ table, qrUrl });
      setQrDialog(true);
    } catch (error) {
      setError('Failed to generate QR code');
    }
  };

  const handleDownloadQR = () => {
    if (!selectedQR) return;

    const link = document.createElement('a');
    link.download = `table-${selectedQR.table.table_number}-qr.png`;
    link.href = selectedQR.qrUrl;
    link.click();
  };

  const handleDownloadAllQRs = async () => {
    for (const table of tables.filter(t => t.is_active)) {
      try {
        const qrUrl = await generateQRCode(table);
        const link = document.createElement('a');
        link.download = `table-${table.table_number}-qr.png`;
        link.href = qrUrl;
        link.click();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download QR for table ${table.table_number}`, error);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Tables & QR Codes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage tables and generate QR codes for customers
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadAllQRs}
          >
            Download All QRs
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Table
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {tables.map((table) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h5" fontWeight={700}>
                    Table {table.table_number}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(table)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteTable(table.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={table.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={table.is_active ? 'success' : 'default'}
                  />
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<QrCode2Icon />}
                  onClick={() => handleShowQR(table)}
                >
                  View QR Code
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {tables.length === 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <QrCode2Icon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No tables yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first table to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Table
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Table Dialog */}
      <Dialog open={tableDialog} onClose={() => setTableDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTable ? 'Edit Table' : 'Add Table'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Table Number"
              type="number"
              value={tableForm.table_number}
              onChange={(e) => setTableForm({ ...tableForm, table_number: parseInt(e.target.value) })}
              required
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={tableForm.is_active}
                  onChange={(e) => setTableForm({ ...tableForm, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTableDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTable} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialog} onClose={() => setQrDialog(false)} maxWidth="sm" fullWidth>
        {selectedQR && (
          <>
            <DialogTitle>
              QR Code for Table {selectedQR.table.table_number}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Box
                  component="img"
                  src={selectedQR.qrUrl}
                  alt={`QR Code for Table ${selectedQR.table.table_number}`}
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    height: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Customers can scan this QR code to access the menu
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {window.location.origin}/menu?table={selectedQR.table.table_number}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setQrDialog(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadQR}
              >
                Download QR Code
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default function AdminTables() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <TablesContent />
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}

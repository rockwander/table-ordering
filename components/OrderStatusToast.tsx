'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, Paper, Typography, keyframes } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTableOrdersRealtime } from '@/hooks/useTableOrdersRealtime';
import { OrderStatus } from '@/types';

// Statuses that show a toast to diners, mapped to their message key.
// Add more statuses here (e.g. served) to toast them too.
const TOAST_STATUSES: Partial<Record<OrderStatus, string>> = {
  ready: 'orderToast.ready',
};

const TOAST_DURATION_MS = 5000;

const slideDown = keyframes`
  from { transform: translateY(-16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

interface Toast {
  key: string; // `${orderId}:${status}`
  message: string;
}

// Remembers which order/status toasts this device has already shown, per table
const seenStorageKey = (tableNumber: string) => `order-toasts-seen:${tableNumber}`;

function loadSeen(tableNumber: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenStorageKey(tableNumber)) || '[]'));
  } catch {
    return new Set();
  }
}

function saveSeen(tableNumber: string, seen: Set<string>) {
  try {
    localStorage.setItem(seenStorageKey(tableNumber), JSON.stringify([...seen]));
  } catch {
    // Storage unavailable (private mode) - toasts may repeat on reload, which is harmless
  }
}

export default function OrderStatusToast({ tableNumber }: { tableNumber: string }) {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const checkOrders = useCallback(async () => {
    // Same numbering diners see in cart/settle: unpaid orders, oldest first
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, created_at')
      .eq('table_number', tableNumber)
      .neq('status', 'paid')
      .order('created_at', { ascending: true });

    if (error || !data) return;

    const seen = loadSeen(tableNumber);
    const newToasts: Toast[] = [];

    data.forEach((order, index) => {
      const messageKey = TOAST_STATUSES[order.status as OrderStatus];
      const key = `${order.id}:${order.status}`;
      if (messageKey && !seen.has(key)) {
        seen.add(key);
        newToasts.push({ key, message: t(messageKey).replace('{n}', String(index + 1)) });
      }
    });

    // Keep only entries for orders still open, so storage doesn't grow forever
    const openIds = new Set(data.map((order) => order.id));
    saveSeen(tableNumber, new Set([...seen].filter((key) => openIds.has(key.split(':')[0]))));

    if (newToasts.length > 0) {
      setToasts((prev) => [...prev, ...newToasts]);
    }
  }, [tableNumber, t]);

  // Initial check also catches orders that became ready while the page was closed
  useEffect(() => {
    checkOrders();
  }, [checkOrders]);

  useTableOrdersRealtime(tableNumber, checkOrders);

  const dismiss = useCallback(
    (key: string) => setToasts((prev) => prev.filter((toast) => toast.key !== key)),
    []
  );

  if (toasts.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 72,
        left: 16,
        right: 16,
        zIndex: 1100, // Above sticky category bar and Call Waiter
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.key} toast={toast} onDismiss={dismiss} />
      ))}
    </Box>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (key: string) => void }) {
  useEffect(() => {
    const timeout = setTimeout(() => onDismiss(toast.key), TOAST_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [toast.key, onDismiss]);

  return (
    <Paper
      elevation={6}
      onClick={() => onDismiss(toast.key)}
      sx={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        maxWidth: 420,
        width: '100%',
        bgcolor: 'success.main',
        color: 'white',
        borderRadius: 2,
        cursor: 'pointer',
        animation: `${slideDown} 0.3s ease-out`,
      }}
    >
      <CheckCircleIcon />
      <Typography variant="body1" fontWeight={700} sx={{ color: 'inherit' }}>
        {toast.message}
      </Typography>
    </Paper>
  );
}

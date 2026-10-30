'use client';

import { Chip } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

const statusLabelKeys: Record<string, string> = {
  pending: 'status.pending',
  confirmed: 'status.confirmed',
  preparing: 'status.preparing',
  ready: 'status.ready',
  served: 'status.served',
  bill_requested: 'status.billRequested',
  paid: 'status.paid',
  cancelled: 'status.cancelled',
};

// Order status badge for diner-facing pages
export default function OrderStatusChip({ status }: { status: string }) {
  const { t } = useLanguage();
  const isDone = status === 'ready' || status === 'served';
  const labelKey = statusLabelKeys[status];

  return (
    <Chip
      label={(labelKey ? t(labelKey) : status).toUpperCase()}
      color={isDone ? 'success' : 'warning'}
      size="small"
    />
  );
}

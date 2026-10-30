'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// Calls onChange whenever any order for this table is inserted or updated,
// and when the page becomes visible again (the socket may have dropped while hidden).
export function useTableOrdersRealtime(tableNumber: string | null | undefined, onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!tableNumber) return;

    // Unique name so several components on one page can each listen
    const channelName = `table-orders-${tableNumber}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `table_number=eq.${tableNumber}`,
        },
        () => onChangeRef.current()
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (!document.hidden) onChangeRef.current();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tableNumber]);
}

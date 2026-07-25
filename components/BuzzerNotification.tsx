'use client';

import React, { useEffect } from 'react';
import { Box, Paper, Typography, keyframes } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import RestaurantIcon from '@mui/icons-material/Restaurant';

const slideIn = keyframes`
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

type NotificationType = 'service_call' | 'new_order';

interface NotificationConfig {
  color: string;
  icon: React.ReactNode;
  title: string;
}

const notificationConfigs: Record<NotificationType, NotificationConfig> = {
  service_call: {
    color: 'error.main',
    icon: <NotificationsActiveIcon sx={{ fontSize: 40 }} />,
    title: 'Service Request!',
  },
  new_order: {
    color: 'warning.main',
    icon: <RestaurantIcon sx={{ fontSize: 40 }} />,
    title: 'New Order!',
  },
};

interface BuzzerNotificationProps {
  tableNumber: string;
  notificationType: NotificationType;
  onDismiss: () => void;
}

export default function BuzzerNotification({ tableNumber, notificationType, onDismiss }: BuzzerNotificationProps) {
  const config = notificationConfigs[notificationType];

  useEffect(() => {
    console.log('📬 Toast notification for Table', tableNumber, 'Type:', notificationType);

    // Auto-dismiss after 5 seconds
    const dismissTimeout = setTimeout(() => {
      console.log('✅ Auto-dismissing toast notification');
      onDismiss();
    }, 5000);

    return () => {
      clearTimeout(dismissTimeout);
    };
  }, [onDismiss, tableNumber, notificationType]);

  return (
    <Paper
      elevation={4}
      onClick={onDismiss}
      sx={{
        position: 'relative',
        p: 2,
        mb: 1,
        bgcolor: config.color,
        color: 'white',
        animation: `${slideIn} 0.3s ease-out`,
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.9,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box>
          {config.icon}
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {config.title}
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            Table {tableNumber}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

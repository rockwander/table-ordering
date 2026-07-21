'use client';

import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, keyframes } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PaymentIcon from '@mui/icons-material/Payment';

const ringAnimation = keyframes`
  0%, 10% {
    transform: rotate(0deg);
  }
  2%, 4%, 6%, 8% {
    transform: rotate(-15deg);
  }
  3%, 5%, 7%, 9% {
    transform: rotate(15deg);
  }
`;

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

type NotificationType = 'service_call' | 'new_order' | 'settle_bill';

interface NotificationConfig {
  soundUrl: string;
  color: string;
  icon: React.ReactNode;
  title: string;
}

const notificationConfigs: Record<NotificationType, NotificationConfig> = {
  service_call: {
    soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    color: 'error.main',
    icon: <NotificationsActiveIcon sx={{ fontSize: 48 }} />,
    title: 'Service Request!',
  },
  new_order: {
    soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
    color: 'warning.main',
    icon: <RestaurantIcon sx={{ fontSize: 48 }} />,
    title: 'New Order!',
  },
  settle_bill: {
    soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
    color: 'success.main',
    icon: <PaymentIcon sx={{ fontSize: 48 }} />,
    title: 'Bill Settled!',
  },
};

interface BuzzerNotificationProps {
  tableNumber: number;
  notificationType: NotificationType;
  audioContext?: AudioContext | null;
  onDismiss: () => void;
}

export default function BuzzerNotification({ tableNumber, notificationType, onDismiss }: BuzzerNotificationProps) {
  const [ringCount, setRingCount] = useState(0);
  const config = notificationConfigs[notificationType];

  useEffect(() => {
    console.log('🔔 BuzzerNotification mounted for Table', tableNumber, 'Type:', notificationType);

    const buzzerSound = new Audio(config.soundUrl);
    buzzerSound.volume = 0.7;

    // Play ring animation 5 times over 10 seconds
    const ringIntervals = [0, 2000, 4000, 6000, 8000];
    const timeouts: NodeJS.Timeout[] = [];

    const playBuzzingBell = () => {
      try {
        // Clone the audio to allow overlapping plays
        const sound = buzzerSound.cloneNode() as HTMLAudioElement;
        sound.volume = 0.7;

        const playPromise = sound.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('🔊 Buzzer played successfully');
            })
            .catch((error) => {
              console.warn('⚠️ Audio blocked (click page to enable):', error.message);
            });
        }
      } catch (error: any) {
        console.error('❌ Audio error:', error.message || error);
      }
    };

    ringIntervals.forEach((delay, index) => {
      const timeout = setTimeout(() => {
        console.log(`🔔 Ring ${index + 1} of ${ringIntervals.length}`);
        setRingCount(prev => prev + 1);
        playBuzzingBell();
      }, delay);
      timeouts.push(timeout);
    });

    // Auto-dismiss after 10 seconds
    const dismissTimeout = setTimeout(() => {
      console.log('✅ Auto-dismissing buzzer notification');
      onDismiss();
    }, 10000);

    return () => {
      timeouts.forEach(t => clearTimeout(t));
      clearTimeout(dismissTimeout);
    };
  }, [onDismiss, tableNumber, notificationType, config.soundUrl]);

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        top: 80,
        right: 24,
        zIndex: 2000,
        p: 3,
        minWidth: 280,
        bgcolor: config.color,
        color: 'white',
        animation: `${pulseAnimation} 1s ease-in-out infinite`,
        border: '2px solid',
        borderColor: 'rgba(0,0,0,0.2)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            animation: ringCount > 0 ? `${ringAnimation} 0.5s ease-in-out` : 'none',
          }}
          key={ringCount} // Force re-animation on each ring
        >
          {config.icon}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {config.title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
            Table {tableNumber}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

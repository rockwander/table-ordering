'use client';

import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, keyframes } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import RestaurantIcon from '@mui/icons-material/Restaurant';

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

type NotificationType = 'service_call' | 'new_order';

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
    soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    color: 'warning.main',
    icon: <RestaurantIcon sx={{ fontSize: 48 }} />,
    title: 'New Order!',
  },
};

interface BuzzerNotificationProps {
  tableNumber: number;
  notificationType: NotificationType;
  audioContext?: AudioContext | null;
  onDismiss: () => void;
  index: number;
}

export default function BuzzerNotification({ tableNumber, notificationType, onDismiss, index }: BuzzerNotificationProps) {
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

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [onDismiss, tableNumber, notificationType, config.soundUrl]);

  return (
    <Paper
      elevation={8}
      onClick={onDismiss}
      sx={{
        position: 'fixed',
        top: { xs: 70 + (index * 120), sm: 80 + (index * 120) },
        right: { xs: 16, sm: 24 },
        left: { xs: 16, sm: 'auto' },
        zIndex: 2000 + index,
        p: { xs: 2, sm: 3 },
        minWidth: { xs: 'auto', sm: 280 },
        bgcolor: config.color,
        color: 'white',
        animation: `${pulseAnimation} 1s ease-in-out infinite`,
        border: '2px solid',
        borderColor: 'rgba(0,0,0,0.2)',
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.9,
        },
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
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {config.title}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Table {tableNumber}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, opacity: 0.8 }}>
        Click to dismiss
      </Typography>
    </Paper>
  );
}

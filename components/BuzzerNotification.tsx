'use client';

import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, keyframes } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

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

interface BuzzerNotificationProps {
  tableNumber: number;
  audioContext?: AudioContext | null;
  onDismiss: () => void;
}

export default function BuzzerNotification({ tableNumber, onDismiss }: BuzzerNotificationProps) {
  const [ringCount, setRingCount] = useState(0);

  useEffect(() => {
    console.log('🔔 BuzzerNotification mounted for Table', tableNumber);

    // Use a notification bell sound from a free CDN
    // This is a real bell/buzzer sound that's more prominent
    const buzzerSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
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
  }, [onDismiss, tableNumber]);

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
        bgcolor: 'error.main',
        color: 'white',
        animation: `${pulseAnimation} 1s ease-in-out infinite`,
        border: '2px solid',
        borderColor: 'error.dark',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <NotificationsActiveIcon
          sx={{
            fontSize: 48,
            animation: ringCount > 0 ? `${ringAnimation} 0.5s ease-in-out` : 'none',
          }}
          key={ringCount} // Force re-animation on each ring
        />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Service Request!
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
            Table {tableNumber}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

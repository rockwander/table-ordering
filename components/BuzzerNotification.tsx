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
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    console.log('🔔 BuzzerNotification mounted for Table', tableNumber);

    // Create a simple beep sound using data URL
    // This is a base64 encoded WAV file of a short beep
    const beepDataUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMnBSl+zPLaizsIGGS57OihUhELTKXh8bllHAU2jdXzzn0vBSZ7yvDZiTcIGGW67OajUhELS6Xh8bplHAU2jdXzzn0vBSZ7yvDZiTcIGGa67OajUhELS6Xh8bplHAU2jdXzzn0vBSZ7yvDZiTcIGGa67OajUhELS6Xh8bplHAU2jdXzzn0vBSZ7yvDZiTcIGGa67OajUhELS6Xh8bplHAU2jdXzzn0vBSZ7yvDZiTcIGGa67OajUhELS6Xh8bplHAU2jdXzzn0vBSZ7yvDZiTcIGGa67OajUhELS6Xh8bplHAU2jdXzzn0vBSZ7yvDZiTcI';

    // Try to create and play audio
    if (!audioRef.current) {
      audioRef.current = new Audio(beepDataUrl);
      audioRef.current.volume = 0.3;
    }

    // Play ring animation 3 times (every 2 seconds for 6 seconds total)
    const ringIntervals = [0, 2000, 4000];
    const timeouts: NodeJS.Timeout[] = [];

    const playBeep = () => {
      try {
        if (audioRef.current) {
          // Clone and play the audio to allow multiple concurrent plays
          const sound = audioRef.current.cloneNode() as HTMLAudioElement;
          sound.volume = 0.3;
          const playPromise = sound.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('🔊 Beep played successfully');
              })
              .catch((error) => {
                console.warn('⚠️ Audio play blocked (user interaction required):', error.message);
              });
          }
        }
      } catch (error) {
        console.error('❌ Audio error:', error);
      }
    };

    ringIntervals.forEach((delay, index) => {
      const timeout = setTimeout(() => {
        console.log(`🔔 Ring ${index + 1} of 3`);
        setRingCount(prev => prev + 1);
        playBeep();
      }, delay);
      timeouts.push(timeout);
    });

    // Auto-dismiss after 6 seconds
    const dismissTimeout = setTimeout(() => {
      console.log('✅ Auto-dismissing buzzer notification');
      onDismiss();
    }, 6000);

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

'use client';

import { useEffect, useState } from 'react';
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
  onDismiss: () => void;
}

export default function BuzzerNotification({ tableNumber, onDismiss }: BuzzerNotificationProps) {
  const [ringCount, setRingCount] = useState(0);

  useEffect(() => {
    // Play ring animation 3 times (every 2 seconds for 6 seconds total)
    const ringIntervals = [0, 2000, 4000];

    ringIntervals.forEach((delay, index) => {
      setTimeout(() => {
        setRingCount(prev => prev + 1);

        // Play a beep sound (if browser supports it)
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 800;
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
          console.log('Audio not supported');
        }
      }, delay);
    });

    // Auto-dismiss after 6 seconds
    const dismissTimeout = setTimeout(() => {
      onDismiss();
    }, 6000);

    return () => {
      clearTimeout(dismissTimeout);
    };
  }, [onDismiss]);

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

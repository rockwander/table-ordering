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

    // Play ring animation 5 times over 10 seconds
    const ringIntervals = [0, 2000, 4000, 6000, 8000];
    const timeouts: NodeJS.Timeout[] = [];

    // Create a buzzing bell sound using Web Audio API
    const playBuzzingBell = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create a complex buzzer sound with multiple frequencies
        const createBuzzer = (startTime: number, duration: number) => {
          // Main bell frequency (around 800Hz)
          const osc1 = audioContext.createOscillator();
          const gain1 = audioContext.createGain();

          osc1.frequency.value = 800;
          osc1.type = 'sine';

          // Second harmonic for richness
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();

          osc2.frequency.value = 1200;
          osc2.type = 'sine';

          // Buzzing modulation
          const lfo = audioContext.createOscillator();
          const lfoGain = audioContext.createGain();

          lfo.frequency.value = 15; // 15Hz tremolo for buzzing effect
          lfoGain.gain.value = 0.3;

          lfo.connect(lfoGain);
          lfoGain.connect(gain1.gain);
          lfoGain.connect(gain2.gain);

          // Connect oscillators
          osc1.connect(gain1);
          osc2.connect(gain2);
          gain1.connect(audioContext.destination);
          gain2.connect(audioContext.destination);

          // Envelope - quick attack, sustained, quick release
          const now = audioContext.currentTime + startTime;

          gain1.gain.setValueAtTime(0, now);
          gain1.gain.linearRampToValueAtTime(0.4, now + 0.01);
          gain1.gain.setValueAtTime(0.4, now + duration - 0.05);
          gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);

          gain2.gain.setValueAtTime(0, now);
          gain2.gain.linearRampToValueAtTime(0.2, now + 0.01);
          gain2.gain.setValueAtTime(0.2, now + duration - 0.05);
          gain2.gain.exponentialRampToValueAtTime(0.01, now + duration);

          // Start oscillators
          osc1.start(now);
          osc2.start(now);
          lfo.start(now);

          // Stop oscillators
          osc1.stop(now + duration);
          osc2.stop(now + duration);
          lfo.stop(now + duration);
        };

        // Create a rapid buzzing pattern (3 short buzzes)
        createBuzzer(0, 0.15);
        createBuzzer(0.2, 0.15);
        createBuzzer(0.4, 0.15);

        console.log('🔊 Buzzing bell played successfully');
      } catch (error: any) {
        console.warn('⚠️ Audio play blocked (user interaction required):', error.message);
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

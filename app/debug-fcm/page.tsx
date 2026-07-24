'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';

export default function DebugFCM() {
  const [logs, setLogs] = useState<string[]>([]);
  const [fcmToken, setFcmToken] = useState<string>('');

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('🔍 Starting FCM debug...');

    // Check platform
    const isNative = Capacitor.isNativePlatform();
    addLog(`Platform: ${Capacitor.getPlatform()}`);
    addLog(`Is Native: ${isNative}`);

    if (!isNative) {
      addLog('❌ Not running on native platform - FCM will not work');
      return;
    }

    // Try to initialize FCM
    const initFCM = async () => {
      try {
        addLog('Checking push notification permissions...');
        let permStatus = await PushNotifications.checkPermissions();
        addLog(`Permission status: ${permStatus.receive}`);

        if (permStatus.receive === 'prompt') {
          addLog('Requesting permissions...');
          permStatus = await PushNotifications.requestPermissions();
          addLog(`Permission after request: ${permStatus.receive}`);
        }

        if (permStatus.receive !== 'granted') {
          addLog('❌ Push notification permission denied');
          return;
        }

        addLog('Registering for push notifications...');
        await PushNotifications.register();
        addLog('✅ Registration initiated');

        // Add listeners
        PushNotifications.addListener('registration', (token) => {
          addLog(`✅ FCM Token received: ${token.value.substring(0, 20)}...`);
          setFcmToken(token.value);

          // Try to save token
          fetch('/api/save-fcm-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token.value }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.error) {
                addLog(`❌ Error saving token: ${data.error}`);
              } else {
                addLog('✅ Token saved to database');
              }
            })
            .catch(err => addLog(`❌ Error saving token: ${err.message}`));
        });

        PushNotifications.addListener('registrationError', (error) => {
          addLog(`❌ Registration error: ${JSON.stringify(error)}`);
        });

      } catch (error: any) {
        addLog(`❌ Error initializing FCM: ${error.message}`);
      }
    };

    initFCM();
  }, []);

  const testNotification = async () => {
    if (!fcmToken) {
      addLog('❌ No FCM token available');
      return;
    }

    addLog('📤 Sending test notification...');
    try {
      const response = await fetch('/api/test-fcm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: fcmToken }),
      });
      const result = await response.json();
      addLog(`✅ Test result: ${JSON.stringify(result)}`);
    } catch (error: any) {
      addLog(`❌ Test error: ${error.message}`);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        FCM Debug Page
      </Typography>

      {fcmToken && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            <strong>FCM Token:</strong> {fcmToken}
          </Typography>
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={testNotification}
        disabled={!fcmToken}
        sx={{ mb: 2 }}
      >
        Send Test Notification
      </Button>

      <Paper sx={{ p: 2, bgcolor: '#000', color: '#0f0', fontFamily: 'monospace', fontSize: 12 }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
        {logs.length === 0 && <div>No logs yet...</div>}
      </Paper>
    </Box>
  );
}

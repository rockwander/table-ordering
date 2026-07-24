'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Box, Alert, AlertTitle, Collapse, IconButton, Button, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TranslateIcon from '@mui/icons-material/Translate';
import AdminDashboard from '@/app/admin/dashboard/page';
import { useLanguage } from '@/contexts/LanguageContext';

function FCMDebugBanner() {
  const [logs, setLogs] = useState<string[]>([]);
  const [fcmToken, setFcmToken] = useState<string>('');
  const [expanded, setExpanded] = useState(true);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('🔍 FCM Debug starting...');
    const isNative = Capacitor.isNativePlatform();
    addLog(`Platform: ${Capacitor.getPlatform()}, Native: ${isNative}`);

    if (!isNative) {
      addLog('❌ Not native - FCM unavailable');
      return;
    }

    const initFCM = async () => {
      try {
        addLog('Checking permissions...');
        let permStatus = await PushNotifications.checkPermissions();
        addLog(`Permission: ${permStatus.receive}`);

        if (permStatus.receive === 'prompt') {
          addLog('Requesting permissions...');
          permStatus = await PushNotifications.requestPermissions();
          addLog(`After request: ${permStatus.receive}`);
        }

        if (permStatus.receive !== 'granted') {
          addLog('❌ Permission denied');
          return;
        }

        addLog('Registering FCM...');
        await PushNotifications.register();

        PushNotifications.addListener('registration', (token) => {
          addLog(`✅ Token: ${token.value.substring(0, 30)}...`);
          setFcmToken(token.value);

          fetch('/api/save-fcm-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token.value }),
          })
            .then(res => res.json())
            .then(data => {
              if (data.error) {
                addLog(`❌ Save error: ${data.error}`);
              } else {
                addLog('✅ Token saved to DB');
              }
            })
            .catch(err => addLog(`❌ Save failed: ${err.message}`));
        });

        PushNotifications.addListener('registrationError', (error) => {
          addLog(`❌ Registration error: ${JSON.stringify(error)}`);
        });

      } catch (error: any) {
        addLog(`❌ Init error: ${error.message}`);
      }
    };

    initFCM();
  }, []);

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      <Alert
        severity={fcmToken ? 'success' : logs.some(l => l.includes('❌')) ? 'error' : 'info'}
        sx={{ borderRadius: 0 }}
        action={
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      >
        <AlertTitle>
          {fcmToken ? '✅ FCM Active' : '⏳ FCM Debug'}
        </AlertTitle>
        <Collapse in={expanded}>
          <Box
            sx={{
              fontFamily: 'monospace',
              fontSize: 11,
              maxHeight: 200,
              overflow: 'auto',
              bgcolor: 'rgba(0,0,0,0.05)',
              p: 1,
              mt: 1,
              borderRadius: 1,
            }}
          >
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </Box>
        </Collapse>
      </Alert>
    </Box>
  );
}

export default function MobileDashboard() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1001, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', p: 1 }}>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button
            size="small"
            variant={language === 'en' ? 'contained' : 'outlined'}
            onClick={() => setLanguage('en')}
          >
            English
          </Button>
          <Button
            size="small"
            variant={language === 'gu' ? 'contained' : 'outlined'}
            onClick={() => setLanguage('gu')}
            startIcon={<TranslateIcon />}
          >
            ગુજરાતી
          </Button>
        </Stack>
      </Box>
      <FCMDebugBanner />
      <AdminDashboard />
    </>
  );
}

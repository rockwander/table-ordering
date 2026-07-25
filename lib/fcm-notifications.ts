import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    type: 'order' | 'buzzer';
    orderId?: string;
    tableNumber?: string;
  };
}

// Track handled notifications to prevent duplicate sounds
const handledNotifications = new Map<string, number>(); // ID -> timestamp

export const initializePushNotifications = async () => {
  // Only run on native platforms
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications only work on native platforms');
    return;
  }

  try {
    console.log('🚀 Initializing FCM Push Notifications...');

    // STEP 1: Create notification channel for Android with alarm sound
    console.log('📢 Creating notification channel with alarm.ogg...');
    await LocalNotifications.createChannel({
      id: 'orders',
      name: 'Order Notifications',
      description: 'Notifications for new orders and waiter calls',
      sound: 'alarm.ogg', // Custom alarm sound
      importance: 5, // Max importance - shows as heads-up notification
      visibility: 1, // Public
      lights: true,
      lightColor: '#FF0000',
      vibration: true,
    });
    console.log('✅ Notification channel created');

    // STEP 2: Request permissions for local notifications
    const localPerm = await LocalNotifications.requestPermissions();
    console.log('📱 Local notification permission:', localPerm);

    // STEP 3: Request permission for push notifications
    let pushPerm = await PushNotifications.checkPermissions();
    console.log('📱 Push notification permission (initial):', pushPerm);

    if (pushPerm.receive === 'prompt') {
      pushPerm = await PushNotifications.requestPermissions();
      console.log('📱 Push notification permission (after request):', pushPerm);
    }

    if (pushPerm.receive !== 'granted') {
      console.error('❌ Push notification permission denied');
      return;
    }

    // STEP 4: Register for push notifications
    console.log('📝 Registering for push notifications...');
    await PushNotifications.register();

    // STEP 5: Listen for registration success
    PushNotifications.addListener('registration', (token) => {
      console.log('✅ Push registration success, token:', token.value.substring(0, 30) + '...');
      saveFCMToken(token.value);
    });

    // STEP 6: Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Push registration error:', error);
    });

    // STEP 7: Handle notification received when app is OPEN (foreground)
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('🔔 ========== PUSH RECEIVED (APP OPEN) ==========');
      console.log('📬 Notification:', JSON.stringify(notification, null, 2));

      // Create unique ID for deduplication
      const notificationId = `${notification?.data?.type || 'unknown'}-${notification?.data?.tableNumber || 'none'}`;
      const now = Date.now();

      // Check if we handled this notification recently (within 10 seconds)
      const lastHandled = handledNotifications.get(notificationId);
      if (lastHandled && (now - lastHandled) < 10000) {
        console.log('⏭️ Notification handled recently (within 10s), skipping');
        return;
      }

      // Mark as handled
      handledNotifications.set(notificationId, now);

      // Clean up old entries
      const cutoffTime = now - 30000;
      for (const [id, timestamp] of handledNotifications.entries()) {
        if (timestamp < cutoffTime) {
          handledNotifications.delete(id);
        }
      }

      console.log('🆕 New notification, triggering sound...');

      // Show local notification with sound
      try {
        await showLocalNotificationWithSound(notification);
      } catch (error) {
        console.error('❌ Error showing local notification:', error);
      }
    });

    // STEP 8: Handle notification tapped (app in background/closed)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('👆 Push notification tapped:', notification);
      handleNotificationAction(notification.notification.data);
    });

    console.log('✅ FCM Push Notifications initialized successfully');

  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
  }
};

const showLocalNotificationWithSound = async (notification: any) => {
  console.log('🔊 ========== SHOWING LOCAL NOTIFICATION ==========');

  try {
    // Extract title and body
    const title = notification?.notification?.title || notification?.title || 'New Notification';
    const body = notification?.notification?.body || notification?.body || '';

    console.log(`📢 Title: "${title}"`);
    console.log(`📢 Body: "${body}"`);
    console.log(`🔔 Sound: alarm.ogg`);
    console.log(`📡 Channel: orders`);

    const notificationId = Date.now();

    // Schedule local notification with sound
    const result = await LocalNotifications.schedule({
      notifications: [
        {
          title: title,
          body: body,
          id: notificationId,
          sound: 'alarm.ogg',
          channelId: 'orders',
          extra: notification?.data || {},
        },
      ],
    });

    console.log('✅ Local notification scheduled successfully');
    console.log('📊 Result:', JSON.stringify(result, null, 2));

  } catch (error: any) {
    console.error('❌ ERROR in showLocalNotificationWithSound:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
  }
};

const saveFCMToken = async (token: string) => {
  localStorage.setItem('fcm_token', token);
  console.log('💾 FCM token saved to localStorage');

  try {
    const response = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ Failed to save FCM token to DB:', data.error);
    } else {
      console.log('✅ FCM token saved to database');
    }
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
  }
};

const handleNotificationAction = (data: any) => {
  console.log('🔄 Handling notification action:', data);
  // Navigate to appropriate screen
  if (data?.type === 'order' || data?.type === 'buzzer') {
    window.location.href = '/mobile/dashboard';
  }
};

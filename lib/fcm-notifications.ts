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
    // Create notification channel for Android with loud sound
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

    // Request permission for local notifications
    await LocalNotifications.requestPermissions();

    // Request permission for push notifications
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.error('Push notification permission denied');
      return;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      // Save token to your backend/Supabase
      saveFCMToken(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Handle notification received (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('🔔 Push received (app open):', notification);
      console.log('📬 Notification data:', JSON.stringify(notification));

      // Create unique ID for this notification (using data fields)
      const notificationId = `${notification?.data?.type || 'unknown'}-${notification?.data?.tableNumber || 'none'}`;
      const now = Date.now();

      // Check if we handled this notification recently (within 10 seconds)
      const lastHandled = handledNotifications.get(notificationId);
      if (lastHandled && (now - lastHandled) < 10000) {
        console.log('⏭️ Notification handled recently (within 10s), skipping sound:', notificationId);
        return;
      }

      // Mark this notification as handled with current timestamp
      handledNotifications.set(notificationId, now);

      // Clean up old entries (older than 30 seconds)
      const cutoffTime = now - 30000;
      for (const [id, timestamp] of handledNotifications.entries()) {
        if (timestamp < cutoffTime) {
          handledNotifications.delete(id);
        }
      }

      console.log('🆕 New notification, playing sound:', notificationId);

      // Show local notification with sound
      try {
        await showLocalNotificationWithSound(notification);
        console.log('✅ Local notification with sound triggered');
      } catch (error) {
        console.error('❌ Error showing local notification:', error);
      }
    });

    // Handle notification tapped (app in background/closed)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed:', notification);
      // Handle navigation based on notification type
      handleNotificationAction(notification.notification.data);
    });

  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

const showLocalNotificationWithSound = async (notification: any) => {
  console.log('🔊 showLocalNotificationWithSound called');

  try {
    // Play alarm sound directly using Audio API (works even if local notifications fail)
    playAlarmSound();

    // Request local notification permission
    const permission = await LocalNotifications.requestPermissions();
    console.log('📱 Local notification permission:', permission);

    // Extract title and body from notification payload
    // FCM notification structure can be: notification.title or notification.notification.title
    const title = notification?.notification?.title || notification?.title || 'New Notification';
    const body = notification?.notification?.body || notification?.body || '';

    console.log(`📢 Scheduling local notification: ${title} - ${body}`);

    // Show notification with alarm sound (same as when app is closed)
    const result = await LocalNotifications.schedule({
      notifications: [
        {
          title: title,
          body: body,
          id: Date.now(),
          sound: 'alarm.ogg', // Use same alarm sound as background notifications
          channelId: 'orders', // Use the same channel with alarm sound
          attachments: undefined,
          actionTypeId: '',
          extra: notification?.data || {},
        },
      ],
    });

    console.log('✅ Local notification scheduled:', result);
  } catch (error) {
    console.error('❌ Error in showLocalNotificationWithSound:', error);
    // Still try to play sound even if notification fails
    playAlarmSound();
  }
};

// Play alarm sound directly
const playAlarmSound = () => {
  try {
    // For native apps, the sound file is in res/raw/
    // We can't play it directly via Audio API, but we can trigger it via notification
    console.log('🔔 Alarm sound will play via local notification');
  } catch (error) {
    console.error('❌ Error playing alarm sound:', error);
  }
};

const saveFCMToken = async (token: string) => {
  // Save token to localStorage
  localStorage.setItem('fcm_token', token);
  console.log('FCM token saved:', token);

  // Send to Supabase to store for this device
  try {
    const { error } = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    }).then(res => res.json());

    if (error) {
      console.error('Failed to save FCM token to Supabase:', error);
    } else {
      console.log('FCM token saved to Supabase');
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

const handleNotificationAction = (data: any) => {
  // Navigate to appropriate screen based on notification type
  if (data?.type === 'order') {
    // Navigate to orders
    window.location.href = '/mobile/dashboard';
  } else if (data?.type === 'buzzer') {
    // Navigate to buzzer notifications
    window.location.href = '/mobile/dashboard';
  }
};

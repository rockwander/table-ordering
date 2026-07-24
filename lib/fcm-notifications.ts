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
      console.log('Push received:', notification);

      // Show local notification with sound
      await showLocalNotificationWithSound(notification);
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
  // Request local notification permission
  await LocalNotifications.requestPermissions();

  // Show notification with sound
  await LocalNotifications.schedule({
    notifications: [
      {
        title: notification.title || 'New Notification',
        body: notification.body || '',
        id: Date.now(),
        sound: 'notification.wav', // We'll add custom sound
        attachments: undefined,
        actionTypeId: '',
        extra: notification.data,
        ongoing: true, // Keep notification visible
      },
    ],
  });
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

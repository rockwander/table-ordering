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

    // STEP 1: Create TWO notification channels - one for orders, one for waiter calls
    console.log('📢 Creating notification channels...');

    // Channel for NEW ORDERS (casino bells sound)
    await LocalNotifications.createChannel({
      id: 'new_orders',
      name: 'New Orders',
      description: 'Notifications for new customer orders',
      sound: 'new_order.wav',
      importance: 5, // Max importance - shows as heads-up notification
      visibility: 1, // Public
      lights: true,
      lightColor: '#FF9800', // Orange for orders
      vibration: true,
    });
    console.log('✅ New Orders channel created with new_order.wav');

    // Channel for WAITER CALLS (happy bells sound)
    await LocalNotifications.createChannel({
      id: 'waiter_calls',
      name: 'Waiter Calls',
      description: 'Notifications for waiter service requests',
      sound: 'waiter_call.wav',
      importance: 5, // Max importance - shows as heads-up notification
      visibility: 1, // Public
      lights: true,
      lightColor: '#F44336', // Red for urgent waiter calls
      vibration: true,
    });
    console.log('✅ Waiter Calls channel created with waiter_call.wav');

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
      console.log('📢 Type:', notification?.data?.type);

      // DON'T show system notification when app is in foreground
      // The Live Orders page handles this with in-app sound (10s loop, tap to stop)
      // This prevents duplicate sounds (system + in-app)

      console.log('✅ App is in foreground - notification handled by in-app sound');
      console.log('⏭️ Skipping system notification to avoid duplicate sound');

      // Note: The Realtime subscription in Live Orders page will:
      // - Play the appropriate sound (10-second loop)
      // - Allow tap-to-stop functionality
      // - Show toast notification in the app UI
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
    const notificationType = notification?.data?.type || 'order';

    // Determine channel and sound based on notification type
    const isWaiterCall = notificationType === 'buzzer';
    const channelId = isWaiterCall ? 'waiter_calls' : 'new_orders';
    const sound = isWaiterCall ? 'waiter_call.wav' : 'new_order.wav';

    console.log(`📢 Title: "${title}"`);
    console.log(`📢 Body: "${body}"`);
    console.log(`📢 Type: ${notificationType}`);
    console.log(`🔔 Sound: ${sound}`);
    console.log(`📡 Channel: ${channelId}`);

    const notificationId = Date.now();

    // Schedule local notification with appropriate sound and channel
    const result = await LocalNotifications.schedule({
      notifications: [
        {
          title: title,
          body: body,
          id: notificationId,
          sound: sound,
          channelId: channelId,
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
    // Get current Supabase session to include auth header
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      console.log('📝 Saving FCM token with user authentication');
    } else {
      console.log('📝 Saving FCM token anonymously (no user session)');
    }

    const response = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers,
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ Failed to save FCM token to DB:', data.error);
    } else {
      console.log('✅ FCM token saved to database', data.userId ? `(user: ${data.userId})` : '(anonymous)');
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

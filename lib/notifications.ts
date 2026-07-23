// Notification utilities for web push notifications

// Extend NotificationOptions to include vibrate (Vibration API)
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[] | number;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.error('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted');
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service Worker is ready');

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function showLocalNotification(
  title: string,
  options: ExtendedNotificationOptions = {}
): Promise<void> {
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const notificationOptions: ExtendedNotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      requireInteraction: true,
      ...options
    };

    await registration.showNotification(title, notificationOptions);

    console.log('Local notification shown:', title);
  } catch (error) {
    console.error('Error showing notification:', error);

    // Fallback to regular notification if service worker fails
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }
}

export async function initializeNotifications(): Promise<boolean> {
  console.log('Initializing notifications...');

  // Request permission
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return false;
  }

  // Register service worker
  const registration = await registerServiceWorker();
  if (!registration) {
    console.warn('Service Worker registration failed');
    return false;
  }

  console.log('Notifications initialized successfully');
  return true;
}

export function checkNotificationSupport(): {
  supported: boolean;
  permission: NotificationPermission;
  serviceWorkerSupported: boolean;
} {
  return {
    supported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'denied',
    serviceWorkerSupported: 'serviceWorker' in navigator
  };
}

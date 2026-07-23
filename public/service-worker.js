// Service Worker for Push Notifications
// This enables notifications even when the screen is off

const CACHE_NAME = 'table-ordering-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'Service Request',
    body: 'A customer needs assistance',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: 'buzzer-notification',
    requireInteraction: true, // Keeps notification visible
    data: {
      url: '/admin/dashboard'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.notification_type === 'service_call' ? 'Service Request!' : 'New Order!',
        body: `Table ${data.table_number} needs assistance`,
        data: {
          ...notificationData.data,
          table_number: data.table_number,
          notification_type: data.notification_type
        }
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(promiseChain);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Open or focus the admin dashboard
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if admin dashboard is already open
        for (const client of clientList) {
          if (client.url.includes('/admin/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not found
        if (clients.openWindow) {
          return clients.openWindow('/admin/dashboard');
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

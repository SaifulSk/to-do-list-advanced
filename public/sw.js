// Zenith Todo PWA Service Worker
const CACHE_NAME = 'zenith-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push events if sent from web push backend
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'Zenith Todo';
    const options = {
      body: data.message || data.body || '',
      icon: './favicon.svg',
      badge: './favicon.svg',
      tag: data.tag || 'zenith-push',
      vibrate: [200, 100, 200],
      data: data
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.warn('Error handling push event in SW:', err);
  }
});

// Focus or open application when a notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
    })
  );
});

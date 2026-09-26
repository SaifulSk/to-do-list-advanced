// Zenith Todo PWA Service Worker
const CACHE_NAME = 'zenith-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push events from Apple APNs / Google FCM (delivered even when PWA is killed)
self.addEventListener('push', (event) => {
  let title = 'Zenith Todo';
  let body = 'You have a new task update.';
  let tag = 'zenith-push-' + Date.now();
  let payloadData = {};

  if (event.data) {
    try {
      const json = event.data.json();
      title = json.title || title;
      body = json.body || json.message || body;
      tag = json.tag || tag;
      payloadData = json.data || json;
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  const options = {
    body: body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: tag,
    renotify: true,
    vibrate: [200, 100, 200],
    data: payloadData
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle direct showNotification messages from client app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(self.registration.showNotification(title, options));
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

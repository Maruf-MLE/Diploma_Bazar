// service-worker.js
console.log('📝 Service worker loaded');

self.addEventListener('install', event => {
  console.log('🔧 Service worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('✅ Service worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', event => {
  console.log('🔔 Push event received:', event);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
    console.log('📊 Push data:', data);
  } catch (error) {
    console.error('❌ Error parsing push data:', error);
  }
  
  const {
    title = 'Notification',
    body = 'You have a new notification',
    icon = '/favicon.ico',
    url = '/',
    badge = '/favicon.ico',
    tag = 'default'
  } = data;

  const notificationOptions = {
    body,
    // Don't include icon if it might be missing
    // icon,
    // badge,
    tag,
    data: { url },
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  console.log('🔔 Showing notification:', title, notificationOptions);
  
  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
      .then(() => console.log('✅ Notification shown successfully'))
      .catch(error => console.error('❌ Error showing notification:', error))
  );
});

self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  const action = event.action;
  
  console.log('🔗 Opening URL:', url);
  console.log('🎯 Action:', action);
  
  if (action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        console.log('📝 Found clients:', clientList.length);
        
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            console.log('✅ Focusing existing window');
            return client.focus();
          }
        }
        
        // If no existing window, open a new one
        console.log('🆕 Opening new window');
        return clients.openWindow(url);
      })
      .catch(error => console.error('❌ Error handling notification click:', error))
  );
});

self.addEventListener('pushsubscriptionchange', event => {
  console.log('🔄 Push subscription changed:', event);
  
  event.waitUntil(
    // Handle subscription change
    // You might want to re-subscribe here
    Promise.resolve()
  );
});

self.addEventListener('error', event => {
  console.error('❌ Service worker error:', event);
});

self.addEventListener('unhandledrejection', event => {
  console.error('❌ Service worker unhandled rejection:', event);
});


// Service Worker for Push Notifications
// বই-চাপা-বাজার Push Notification Service Worker

const CACHE_NAME = 'boi-chapa-bazar-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event
self.addEventListener('install', event => {
  console.log('📦 Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📂 Service Worker: Caching important files');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('❌ Service Worker: Cache failed', error);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event
self.addEventListener('push', event => {
  console.log('🔔 Service Worker: Push event received');
  
  let notificationData = {
    title: 'নতুন নোটিফিকেশন',
    body: 'আপনার জন্য নতুন আপডেট এসেছে',
    icon: '/images/Logo.png',
    badge: '/images/Logo.png',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: {
          url: data.url || '/'
        }
      };
    } catch (error) {
      console.error('❌ Service Worker: Error parsing push data', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'দেখুন',
          icon: '/images/Logo.png'
        }
      ]
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('👆 Service Worker: Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Check if any client (tab) is already open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      
      // If no client is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync (for offline support)
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Add any background sync logic here
      Promise.resolve()
    );
  }
});

// Message event (for communication with main thread)
self.addEventListener('message', event => {
  console.log('💬 Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🎉 Service Worker: Loaded successfully');
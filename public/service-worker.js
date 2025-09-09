// service-worker.js
console.log('📝 Service worker loaded at:', new Date().toISOString());

// Cache name for versioning
// ⚠️ Increment the cache version on each deploy to avoid stale HTML/JS mismatch
const CACHE_NAME = 'book-exchange-v2';

// Files to cache for offline access
// Cache only static assets that rarely change. We purposely skip '/' so that the
// latest index.html is always fetched from the network and contains the correct
// hashed JS chunk names.
const urlsToCache = [
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', event => {
  console.log('🔧 Service worker installing...');
  
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service worker activated');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service worker is ready to handle fetches');
      return clients.claim();
    })
  );
});

self.addEventListener('push', event => {
  console.log('🔔 Push event received:', event);
  console.log('🔔 Push event data:', event.data);
  
  let data = {};
  try {
    if (event.data) {
      const rawData = event.data.text();
      console.log('📄 Raw push data:', rawData);
      
      // Try to parse as JSON, fallback to simple text
      try {
        data = JSON.parse(rawData);
        console.log('📊 Parsed JSON data:', data);
      } catch (jsonError) {
        console.log('📝 Data is not JSON, treating as text:', rawData);
        data = {
          title: 'নতুন বিজ্ঞপ্তি',
          body: rawData
        };
      }
    } else {
      console.log('📭 No data in push event');
      data = {
        title: 'নতুন বিজ্ঞপ্তি',
        body: 'আপনার একটি নতুন বিজ্ঞপ্তি আছে'
      };
    }
  } catch (error) {
    console.error('❌ Error processing push data:', error);
    data = {
      title: 'নতুন বিজ্ঞপ্তি',
      body: 'আপনার একটি নতুন বিজ্ঞপ্তি আছে'
    };
  }
  
  const {
    title = 'নতুন বিজ্ঞপ্তি',
    body = 'আপনার একটি নতুন বিজ্ঞপ্তি আছে',
    icon = '/images/Logo.png',
    url = '/',
    badge = '/images/Logo.png',
    tag = 'notification-' + Date.now(),
    timestamp = Date.now()
  } = data;

  const notificationOptions = {
    body,
    icon: icon || '/images/Logo.png',
    badge: badge || '/images/Logo.png',
    tag,
    timestamp,
    data: { url },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'খুলুন'
      },
      {
        action: 'close',
        title: 'বন্ধ করুন'
      }
    ]
  };

  console.log('🔔 Showing notification:', title, notificationOptions);
  
  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
      .then(() => console.log('✅ Notification shown successfully'))
      .catch(error => {
        console.error('❌ Error showing notification:', error);
        // Fallback notification without icon if there's an error
        const fallbackOptions = {
          body,
          tag,
          data: { url }
        };
        return self.registration.showNotification(title, fallbackOptions);
      })
  );
});

self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked:', event);
  console.log('🔔 Notification action:', event.action);
  console.log('🔔 Notification data:', event.notification.data);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const url = notificationData.url || '/';
  const action = event.action;
  
  console.log('🔗 Target URL:', url);
  console.log('🎯 Action:', action);
  
  if (action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
      .then(clientList => {
        console.log('📝 Found clients:', clientList.length);
        
        // Try to find and focus an existing window
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrl = new URL(url, self.location.origin);
          
          // Check if it's the same origin and path
          if (clientUrl.origin === targetUrl.origin && 
              clientUrl.pathname === targetUrl.pathname) {
            console.log('✅ Focusing existing window');
            return client.focus();
          }
        }
        
        // If no existing window, open a new one
        console.log('🆕 Opening new window for URL:', url);
        return clients.openWindow(url);
      })
      .catch(error => {
        console.error('❌ Error handling notification click:', error);
        // Try to open window without checking existing clients
        return clients.openWindow(url);
      })
  );
});

// Handle fetch events for offline support
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request);
      })
      .catch(error => {
        console.error('Fetch failed:', error);
        // You could return a custom offline page here
      })
  );
});

self.addEventListener('pushsubscriptionchange', event => {
  console.log('🔄 Push subscription changed:', event);
  console.log('🔄 Old subscription:', event.oldSubscription);
  console.log('🔄 New subscription:', event.newSubscription);
  
  event.waitUntil(
    // Re-subscribe logic would go here
    // This would involve getting a new subscription and sending it to your server
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey
    })
    .then(newSubscription => {
      console.log('✅ Re-subscribed with new subscription:', newSubscription);
      // Here you would send the new subscription to your server
    })
    .catch(error => {
      console.error('❌ Re-subscription failed:', error);
    })
  );
});

self.addEventListener('error', event => {
  console.error('❌ Service worker error:', event);
});

self.addEventListener('unhandledrejection', event => {
  console.error('❌ Service worker unhandled rejection:', event);
});

// Log service worker version for debugging
console.log('📌 Service Worker Version: 1.0.1');


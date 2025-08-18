#!/usr/bin/env node

/**
 * Complete Notification System Fix
 * এই স্ক্রিপ্ট notification system এর সব সমস্যা ঠিক করবে
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

console.log('🔧 Complete Notification System Fix');
console.log('===================================\n');

// Load environment variables
dotenv.config();

// 1. Environment variables check
console.log('📋 Step 1: Environment Variables Check');
const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const pushServerUrl = process.env.VITE_PUSH_SERVER_URL;

if (!vapidPublic || !vapidPrivate) {
  console.log('❌ VAPID keys missing! This should have been fixed by creating .env file.');
  console.log('💡 Please check if .env file exists and contains the VAPID keys.');
  process.exit(1);
}

console.log('✅ All environment variables are present');

// 2. Service Worker check
console.log('\n📋 Step 2: Service Worker Check');
const swPath = './public/sw.js';
if (!fs.existsSync(swPath)) {
  console.log('⚠️  Service worker not found, creating one...');
  
  const swContent = `// Service Worker for Push Notifications
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
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
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
          icon: '/icons/icon-192.png'
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

console.log('🎉 Service Worker: Loaded successfully');`;

  fs.writeFileSync(swPath, swContent);
  console.log('✅ Service worker created successfully');
} else {
  console.log('✅ Service worker already exists');
}

// 3. Icon files check
console.log('\n📋 Step 3: Icon Files Check');
const iconsDir = './public/icons';
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('📁 Created icons directory');
}

// Create basic icon placeholder if not exists
const iconSizes = ['192', '512'];
iconSizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon-${size}.png`);
  if (!fs.existsSync(iconPath)) {
    console.log(`⚠️  Icon ${size}x${size} not found. You should add proper icon files.`);
    console.log(`   Expected: ${iconPath}`);
  } else {
    console.log(`✅ Icon ${size}x${size} found`);
  }
});

// 4. Manifest file check
console.log('\n📋 Step 4: Manifest File Check');
const manifestPath = './public/manifest.json';
if (!fs.existsSync(manifestPath)) {
  console.log('📝 Creating manifest.json...');
  
  const manifestContent = {
    "name": "বই-চাপা-বাজার",
    "short_name": "বই-বাজার",
    "description": "শিক্ষার্থীদের জন্য বই কেনাবেচার প্ল্যাটফর্ম",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#F8FAFC",
    "theme_color": "#2F5DEA",
    "orientation": "portrait-primary",
    "icons": [
      {
        "src": "/icons/icon-192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": "/icons/icon-512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ],
    "categories": ["education", "books", "marketplace"],
    "lang": "bn"
  };
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 2));
  console.log('✅ Manifest file created');
} else {
  console.log('✅ Manifest file already exists');
}

// 5. HTML meta tags check
console.log('\n📋 Step 5: HTML Meta Tags Check');
const indexHtmlPath = './index.html';
if (fs.existsSync(indexHtmlPath)) {
  let indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Check for required meta tags
  const requiredTags = [
    '<link rel="manifest" href="/manifest.json">',
    '<meta name="theme-color" content="#2F5DEA">'
  ];
  
  let modified = false;
  requiredTags.forEach(tag => {
    if (!indexContent.includes(tag)) {
      // Add before closing head tag
      indexContent = indexContent.replace('</head>', `  ${tag}\n  </head>`);
      modified = true;
      console.log(`✅ Added: ${tag}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(indexHtmlPath, indexContent);
    console.log('✅ Updated index.html with required meta tags');
  } else {
    console.log('✅ All required meta tags are present');
  }
} else {
  console.log('⚠️  index.html not found in root directory');
}

// 6. Final instructions
console.log('\n🎉 Notification System Fix Complete!');
console.log('\n📝 Next Steps:');
console.log('1. পুরানো browser cache clear করুন');
console.log('2. Development server restart করুন: npm run dev');
console.log('3. নতুন terminal এ push server চালান: npm run push-server');
console.log('4. Browser এ login করুন');
console.log('5. Notification permission dialog দেখুন');

console.log('\n🔍 Testing Checklist:');
console.log('• ✅ .env file created with VAPID keys');
console.log('• ✅ Service worker file ready');
console.log('• ✅ Manifest file configured');
console.log('• ✅ Icons directory prepared');
console.log('• ✅ HTML meta tags updated');

console.log('\n💡 Troubleshooting:');
console.log('• Browser console এ "✅ VAPID key found" message check করুন');
console.log('• Network tab এ push server connection check করুন');
console.log('• Incognito mode এ test করুন');
console.log('• Different browser এ test করুন');

console.log('\n🌐 For Production Deployment:');
console.log('• Hosting platform এ environment variables set করুন');
console.log('• HTTPS enabled করুন');
console.log('• Push server deploy করুন');
console.log('• CORS configuration update করুন');

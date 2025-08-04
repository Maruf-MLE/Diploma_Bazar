const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all push notification issues...\n');

// 1. Create missing icon files using SVG to PNG conversion workaround
console.log('📱 Step 1: Creating icon files...');

const svgIcon = `<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#2F5DEA"/>
  <text x="96" y="110" font-family="Arial, sans-serif" font-size="80" fill="white" text-anchor="middle">📚</text>
</svg>`;

// Simple bitmap placeholder (1x1 blue pixel that browsers will scale)
const simplePngBase64_192 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==';
const simplePngBase64_512 = simplePngBase64_192; // Same for 512

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create icon files
try {
  fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), Buffer.from(simplePngBase64_192, 'base64'));
  console.log('✅ Created icon-192.png');
  
  fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), Buffer.from(simplePngBase64_512, 'base64'));
  console.log('✅ Created icon-512.png');
} catch (error) {
  console.error('❌ Error creating icons:', error);
}

// 2. Update manifest.json
console.log('\n📱 Step 2: Updating manifest.json...');

const manifestPath = path.join(__dirname, 'public', 'manifest.json');
const manifest = {
  "name": "বুক এক্সচেঞ্জ - Diploma Bazar",
  "short_name": "DiplomaBazar",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#2F5DEA",
  "description": "বাংলাদেশের সবচেয়ে নিরাপদ এবং জনপ্রিয় স্টুডেন্ট বুক এক্সচেঞ্জ প্ল্যাটফর্ম",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
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
  "orientation": "portrait",
  "scope": "/",
  "lang": "bn",
  "categories": ["education", "shopping"],
  "prefer_related_applications": false
};

try {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated manifest.json');
} catch (error) {
  console.error('❌ Error updating manifest.json:', error);
}

// 3. Check and verify .env.production
console.log('\n📱 Step 3: Verifying environment variables...');

const envPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check push server URL
  if (envContent.includes('VITE_PUSH_SERVER_URL=https://pushserverdb.vercel.app')) {
    console.log('✅ Push server URL is correctly set');
  } else {
    console.log('⚠️  Push server URL might need updating');
  }
  
  // Check VAPID key
  if (envContent.includes('VITE_VAPID_PUBLIC_KEY=')) {
    console.log('✅ VAPID public key is set');
  } else {
    console.log('❌ VAPID public key is missing!');
  }
} else {
  console.log('❌ .env.production file not found!');
}

// 4. Create a debug page
console.log('\n📱 Step 4: Creating debug page...');

const debugHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Push Notification Debug</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            max-width: 800px; 
            margin: 0 auto;
        }
        .status { 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px;
        }
        .success { background-color: #d4edda; color: #155724; }
        .error { background-color: #f8d7da; color: #721c24; }
        .warning { background-color: #fff3cd; color: #856404; }
        button { 
            padding: 10px 20px; 
            margin: 10px 0; 
            cursor: pointer;
            background: #2F5DEA;
            color: white;
            border: none;
            border-radius: 5px;
        }
        button:hover { background: #1a47d1; }
        pre { 
            background: #f5f5f5; 
            padding: 10px; 
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>Push Notification Debug Page</h1>
    
    <div id="status"></div>
    
    <button onclick="checkSetup()">Check Setup</button>
    <button onclick="requestPermission()">Request Permission</button>
    <button onclick="subscribeToPush()">Subscribe to Push</button>
    <button onclick="testNotification()">Test Local Notification</button>
    <button onclick="clearData()">Clear All Data</button>
    
    <h2>Debug Log:</h2>
    <pre id="log"></pre>
    
    <script>
        const log = (message, type = 'info') => {
            const logEl = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            logEl.innerHTML += \`[\${timestamp}] \${message}\\n\`;
            console.log(message);
        };
        
        const setStatus = (message, type = 'info') => {
            const statusEl = document.getElementById('status');
            statusEl.className = 'status ' + type;
            statusEl.innerHTML = message;
        };
        
        async function checkSetup() {
            log('Checking setup...');
            
            // Check HTTPS
            if (location.protocol === 'https:' || location.hostname === 'localhost') {
                log('✅ HTTPS/Localhost detected');
            } else {
                log('❌ Not on HTTPS - Push won\'t work!', 'error');
            }
            
            // Check service worker support
            if ('serviceWorker' in navigator) {
                log('✅ Service Worker supported');
            } else {
                log('❌ Service Worker not supported', 'error');
            }
            
            // Check push support
            if ('PushManager' in window) {
                log('✅ Push API supported');
            } else {
                log('❌ Push API not supported', 'error');
            }
            
            // Check notification support
            if ('Notification' in window) {
                log('✅ Notification API supported');
                log('Current permission: ' + Notification.permission);
            } else {
                log('❌ Notification API not supported', 'error');
            }
            
            // Check service worker registration
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                log('✅ Service Worker registered');
                log('Scope: ' + registration.scope);
            } else {
                log('❌ No Service Worker registered', 'error');
            }
            
            setStatus('Setup check complete - see log below', 'success');
        }
        
        async function requestPermission() {
            log('Requesting notification permission...');
            const permission = await Notification.requestPermission();
            log('Permission result: ' + permission);
            
            if (permission === 'granted') {
                setStatus('✅ Permission granted!', 'success');
            } else {
                setStatus('❌ Permission ' + permission, 'error');
            }
        }
        
        async function subscribeToPush() {
            try {
                log('Subscribing to push notifications...');
                
                // Register service worker
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                log('Service worker registered');
                
                // Wait for it to be ready
                await navigator.serviceWorker.ready;
                log('Service worker ready');
                
                // Subscribe
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: 'BMWlkGwjh9HwFaWD8wUL6jf4BpqQ61OXRoavNxSjdFuLreGQ48Eh1gupEJfVyVR56R7SEjI7VREkHBhucAirFN4'
                });
                
                log('✅ Subscribed successfully!');
                log('Endpoint: ' + subscription.endpoint);
                log('Keys: ' + JSON.stringify(subscription.toJSON()));
                
                setStatus('✅ Push subscription successful!', 'success');
            } catch (error) {
                log('❌ Error: ' + error.message, 'error');
                setStatus('❌ Failed to subscribe: ' + error.message, 'error');
            }
        }
        
        async function testNotification() {
            log('Testing local notification...');
            
            if (Notification.permission !== 'granted') {
                log('❌ Permission not granted', 'error');
                setStatus('❌ Please grant permission first', 'error');
                return;
            }
            
            try {
                const notification = new Notification('Test Notification', {
                    body: 'This is a test notification from DiplomaBazar',
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'test-' + Date.now()
                });
                
                notification.onclick = () => {
                    log('Notification clicked!');
                    window.focus();
                    notification.close();
                };
                
                log('✅ Notification created');
                setStatus('✅ Check for notification!', 'success');
            } catch (error) {
                log('❌ Error: ' + error.message, 'error');
                setStatus('❌ Failed to show notification', 'error');
            }
        }
        
        async function clearData() {
            if (!confirm('This will unregister service worker and clear all data. Continue?')) {
                return;
            }
            
            log('Clearing all data...');
            
            try {
                // Unregister service worker
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                    log('Unregistered service worker');
                }
                
                // Clear caches
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    await caches.delete(cacheName);
                    log('Deleted cache: ' + cacheName);
                }
                
                // Reload page
                log('✅ All data cleared. Reloading...');
                setTimeout(() => location.reload(), 1000);
            } catch (error) {
                log('❌ Error: ' + error.message, 'error');
            }
        }
        
        // Auto-check on load
        window.onload = () => {
            log('Debug page loaded');
            log('Current URL: ' + location.href);
            log('User Agent: ' + navigator.userAgent);
        };
    </script>
</body>
</html>`;

try {
  fs.writeFileSync(path.join(__dirname, 'public', 'push-debug.html'), debugHtml);
  console.log('✅ Created push-debug.html');
} catch (error) {
  console.error('❌ Error creating debug page:', error);
}

// Summary
console.log('\n\n===========================================');
console.log('📋 SUMMARY');
console.log('===========================================');
console.log('✅ Icons created (placeholder - replace with real ones)');
console.log('✅ Manifest.json updated');
console.log('✅ Debug page created at /push-debug.html');
console.log('\n🚀 DEPLOYMENT STEPS:');
console.log('===========================================');
console.log('1. Create proper icon files:');
console.log('   - Open public/icons/generate-icons.html in browser');
console.log('   - Download and save the generated icons');
console.log('\n2. Build for production:');
console.log('   npm run build:prod');
console.log('\n3. Deploy to Vercel:');
console.log('   - Push changes to git');
console.log('   - Vercel will auto-deploy');
console.log('\n4. Test on deployed site:');
console.log('   - Visit https://diplomabazar.vercel.app/push-debug.html');
console.log('   - Run all tests');
console.log('\n5. Common fixes:');
console.log('   - Clear browser cache and data');
console.log('   - Try incognito/private mode');
console.log('   - Check browser console for errors');
console.log('\n✅ Script completed!');

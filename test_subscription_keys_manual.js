// Manual test for subscription key generation
// Run this in browser console on your site

console.log('🧪 Manual Push Subscription Key Generation Test');
console.log('==============================================');

async function testSubscriptionKeyGeneration() {
  try {
    // Check basic support
    console.log('📋 Checking browser support...');
    console.log('ServiceWorker:', 'serviceWorker' in navigator);
    console.log('PushManager:', 'PushManager' in window);
    console.log('Notification:', 'Notification' in window);
    console.log('Secure Context:', window.isSecureContext);
    console.log('Permission:', Notification.permission);
    
    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service Workers not supported');
      return;
    }
    
    if (!('PushManager' in window)) {
      console.error('❌ Push Manager not supported');
      return;
    }
    
    // Request permission
    if (Notification.permission === 'default') {
      console.log('🔔 Requesting permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('❌ Permission not granted');
        return;
      }
    }
    
    console.log('✅ Browser support and permission OK');
    
    // Register service worker if needed
    console.log('📋 Registering service worker...');
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service worker registered');
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      return;
    }
    
    // Wait for service worker to be ready
    const readyRegistration = await navigator.serviceWorker.ready;
    console.log('✅ Service worker ready');
    
    // Get VAPID key from your environment
    const vapidPublicKey = 'BMWlkGwjh9HwFaWD8wUL6jf4BpqQ61OXRoavNxSjdFuLreGQ48Eh1gupEJfVyVR56R7SEjI7VREkHBhucAirFN4'; // Your actual key
    
    console.log('📋 VAPID Key:', vapidPublicKey.substring(0, 20) + '...');
    
    // Convert VAPID key
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const rawData = atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
    
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    console.log('✅ VAPID key converted, length:', applicationServerKey.length);
    
    if (applicationServerKey.length !== 65) {
      console.error('❌ Invalid VAPID key length');
      return;
    }
    
    // Clear existing subscription
    let existingSub = await readyRegistration.pushManager.getSubscription();
    if (existingSub) {
      console.log('🧹 Removing existing subscription...');
      await existingSub.unsubscribe();
    }
    
    // Create subscription - multiple attempts
    let subscription = null;
    const maxAttempts = 5;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🧪 Attempt ${attempt}/${maxAttempts}...`);
      
      try {
        // Add delay between attempts
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        subscription = await readyRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });
        
        console.log(`✅ Subscription created on attempt ${attempt}`);
        console.log('Endpoint:', subscription.endpoint);
        console.log('Has keys:', !!subscription.keys);
        
        if (subscription.keys) {
          console.log('Auth key:', !!subscription.keys.auth);
          console.log('P256dh key:', !!subscription.keys.p256dh);
          console.log('Auth key length:', subscription.keys.auth ? subscription.keys.auth.byteLength : 0);
          console.log('P256dh key length:', subscription.keys.p256dh ? subscription.keys.p256dh.byteLength : 0);
          
          if (subscription.keys.auth && subscription.keys.p256dh) {
            console.log('🎉 SUCCESS! Subscription keys generated successfully!');
            
            // Test key conversion
            function arrayBufferToBase64(buffer) {
              const bytes = new Uint8Array(buffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              return btoa(binary);
            }
            
            const authKey = arrayBufferToBase64(subscription.keys.auth);
            const p256dhKey = arrayBufferToBase64(subscription.keys.p256dh);
            
            console.log('✅ Keys converted to base64:');
            console.log('Auth key base64 length:', authKey.length);
            console.log('P256dh key base64 length:', p256dhKey.length);
            
            // Success - keys are generated!
            return subscription;
          }
        }
        
        console.log(`⚠️ Attempt ${attempt}: No keys generated`);
        
        // Unsubscribe and try again
        if (subscription) {
          await subscription.unsubscribe();
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        
        if (error.name === 'NotSupportedError') {
          console.log('❌ Push not supported - stopping attempts');
          break;
        }
        
        if (error.name === 'NotAllowedError') {
          console.log('❌ Push not allowed - stopping attempts');
          break;
        }
      }
    }
    
    console.log('❌ All attempts failed to generate keys');
    console.log('🔍 Browser details:');
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('Online:', navigator.onLine);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSubscriptionKeyGeneration();

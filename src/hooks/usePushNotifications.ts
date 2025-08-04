// src/hooks/usePushNotifications.ts
import { useEffect, useState } from 'react';
import { registerServiceWorker } from '../registerServiceWorker';

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
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

export function usePushNotifications(userId?: string) {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    async function subscribe() {
      console.log('🔔 Push notification setup starting...');
      console.log('User ID:', userId);
      console.log('PUBLIC_KEY:', PUBLIC_KEY ? 'Found' : 'Missing');
      console.log('Notification support:', 'Notification' in window);
      console.log('Current permission:', Notification.permission);
      console.log('Location protocol:', window.location.protocol);
      console.log('Is secure context:', window.isSecureContext);
      
      if (!userId) {
        console.log('❌ No userId provided, skipping subscription');
        return;
      }
      
      if (!('Notification' in window)) {
        console.log('❌ Notifications not supported');
        return;
      }
      
      if (Notification.permission === 'denied') {
        console.log('❌ Notification permission denied');
        return;
      }
      
      if (!PUBLIC_KEY) {
        console.error('❌ VAPID public key not found in environment variables');
        console.log('Available env vars:', Object.keys(import.meta.env));
        return;
      }

      try {
        console.log('📋 Registering service worker...');
        const registration = await registerServiceWorker();
        if (!registration) {
          console.log('❌ Service worker registration failed');
          return;
        }
        console.log('✅ Service worker registered successfully');

        let subscription = await registration.pushManager.getSubscription();
        console.log('Existing subscription:', !!subscription);

        if (!subscription) {
          try {
            console.log('🔔 Creating new push subscription...');
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
            });
            console.log('✅ New subscription created successfully');
          } catch (error) {
            console.error('❌ Failed to create subscription:', error);
            return;
          }
        }
        
        // Check subscription keys
        if (!subscription.keys) {
          console.error('❌ No keys object found in subscription!');
          console.log('Subscription object:', subscription);
          
          // Try to get a fresh subscription
          try {
            await subscription.unsubscribe();
            console.log('🔄 Unsubscribed old subscription, creating new one...');
            
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
            });
            
            console.log('✅ New subscription created with keys:', !!subscription.keys);
          } catch (error) {
            console.error('❌ Failed to create new subscription:', error);
            return;
          }
        }
        
        console.log('🔍 Subscription debug:');
        console.log('  - Endpoint:', subscription.endpoint);
        console.log('  - Keys present:', !!subscription.keys);
        console.log('  - Auth present:', !!subscription.keys?.auth);
        console.log('  - P256dh present:', !!subscription.keys?.p256dh);

        // Send subscription to backend
        try {
          const serverUrl = import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:4000';
          console.log('📤 Sending subscription to server:', serverUrl);
          console.log('🔑 Subscription details:');
          console.log('  - Endpoint:', subscription.endpoint);
          console.log('  - Keys:', subscription.keys);
          console.log('  - Keys.auth:', subscription.keys?.auth);
          console.log('  - Keys.p256dh:', subscription.keys?.p256dh);
          
          // Check if server URL is accessible
          if (serverUrl.includes('localhost') && window.location.protocol === 'https:') {
            console.warn('⚠️ Using localhost server URL on HTTPS site. This may not work in production.');
          }
          
          const subscriptionData = { 
            userId,
            endpoint: subscription.endpoint,
            keys: subscription.keys
          };
          
          console.log('📦 Subscription payload:', JSON.stringify(subscriptionData, null, 2));
          
          const response = await fetch(serverUrl + '/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscriptionData)
          });
          
          if (!response.ok) {
            throw new Error(`Subscribe failed: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log('✅ Subscription sent to server successfully:', result);
          setSubscribed(true);
        } catch (error) {
          console.error('❌ Failed to send subscription to server:', error);
        }
      } catch (error) {
        console.error('❌ Unexpected error in subscription process:', error);
      }
    }

    if (Notification.permission === 'default') {
      console.log('🔔 Requesting notification permission...');
      Notification.requestPermission().then((perm) => {
        console.log('Permission result:', perm);
        if (perm === 'granted') {
          console.log('✅ Permission granted, starting subscription...');
          subscribe();
        } else {
          console.log('❌ Permission denied or dismissed');
        }
      });
    } else if (Notification.permission === 'granted') {
      console.log('✅ Permission already granted, starting subscription...');
      subscribe();
    } else {
      console.log('❌ Notification permission not granted:', Notification.permission);
    }
  }, [userId]);

  return { subscribed };
}


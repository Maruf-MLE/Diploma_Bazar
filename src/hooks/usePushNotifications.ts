// src/hooks/usePushNotifications.ts
import { useEffect, useState } from 'react';
import { registerServiceWorker } from '../registerServiceWorker';
import { 
  isPushNotificationSupported, 
  requestNotificationPermission,
  logNotificationEvent,
} from '@/lib/notificationUtils';

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const API_KEY = import.meta.env.VITE_API_KEY_1 || import.meta.env.VITE_API_KEY_2 || import.meta.env.VITE_API_KEY_3;

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
    async function setupPushNotifications() {
      // 1. Check for support
      if (!isPushNotificationSupported()) {
        logNotificationEvent('Push notifications not supported');
        return;
      }
      
      // 2. Check for user
      if (!userId) {
        logNotificationEvent('User not logged in, skipping push setup');
        return;
      }

      // 3. Request permission
      const permission = await requestNotificationPermission();
      
      if (permission !== 'granted') {
        logNotificationEvent('Permission not granted', { permission });
        return;
      }
      logNotificationEvent('Permission granted');

      // 4. Register Service Worker
      logNotificationEvent('Registering service worker...');
      const registration = await registerServiceWorker();
      if (!registration) {
        logNotificationEvent('Service worker registration failed');
        return;
      }
      logNotificationEvent('Service worker registered successfully');

      try {
        // 5. Unsubscribe from any existing subscription
        let existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          logNotificationEvent('Removing existing subscription...');
          await existingSubscription.unsubscribe();
        }

        // 6. Create a new subscription
        logNotificationEvent('Creating fresh push subscription...');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
        });
        
        const subscriptionJSON = subscription.toJSON();
        logNotificationEvent('New subscription created', { endpoint: subscriptionJSON.endpoint });

        if (!subscriptionJSON.keys?.auth || !subscriptionJSON.keys?.p256dh) {
          logNotificationEvent('Subscription missing keys!');
          return;
        }

        // 7. Send to backend server
        const serverUrl = import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:4000';
        logNotificationEvent('Sending subscription to server', { serverUrl });

        const subscriptionData = {
          userId,
          endpoint: subscriptionJSON.endpoint,
          keys: {
            auth: subscriptionJSON.keys.auth,
            p256dh: subscriptionJSON.keys.p256dh,
          },
        };

        const response = await fetch(`${serverUrl}/subscribe`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify(subscriptionData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Subscribe failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        logNotificationEvent('Subscription sent to server successfully', result);
        setSubscribed(true);

      } catch (error) {
        logNotificationEvent('Error during subscription process', { error });
      }
    }
    
    // Check for VAPID key and API key with detailed logging
    if (!PUBLIC_KEY) {
      console.error('❌ VAPID public key not found in environment variables');
      console.log('📋 Current environment variables:');
      console.log('- VITE_VAPID_PUBLIC_KEY:', import.meta.env.VITE_VAPID_PUBLIC_KEY ? 'Present' : 'Missing');
      console.log('- VITE_PUSH_SERVER_URL:', import.meta.env.VITE_PUSH_SERVER_URL || 'Not set');
      console.log('💡 Please check your .env file and restart the development server');
      return;
    }

    if (!API_KEY) {
      console.error('❌ API key not found in environment variables');
      console.log('📋 Please set one of these API keys in your .env file:');
      console.log('- VITE_API_KEY_1:', import.meta.env.VITE_API_KEY_1 ? 'Present' : 'Missing');
      console.log('- VITE_API_KEY_2:', import.meta.env.VITE_API_KEY_2 ? 'Present' : 'Missing');
      console.log('- VITE_API_KEY_3:', import.meta.env.VITE_API_KEY_3 ? 'Present' : 'Missing');
      console.log('💡 Please add API key to your .env file and restart the development server');
      return;
    }

    console.log('✅ VAPID key found, setting up push notifications...');
    setupPushNotifications();
  }, [userId]);

  return { subscribed };
}


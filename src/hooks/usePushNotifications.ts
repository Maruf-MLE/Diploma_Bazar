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

        // Always unsubscribe first and create fresh subscription
        let existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('🔄 Removing existing subscription...');
          await existingSubscription.unsubscribe();
        }

        console.log('🔔 Creating fresh push subscription...');
        console.log('🔑 Using VAPID public key:', PUBLIC_KEY);
        console.log('🔑 Converted key length:', urlBase64ToUint8Array(PUBLIC_KEY).length);
        
        // Add a small delay to ensure service worker is fully ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
        });
        
        console.log('✅ New subscription created successfully');
        console.log('📊 Full subscription object:', JSON.stringify(subscription.toJSON(), null, 2));
        
        // Get subscription JSON which includes keys
        const subscriptionJSON = subscription.toJSON();
        console.log('🔍 Subscription has endpoint:', !!subscriptionJSON.endpoint);
        console.log('🔍 Subscription has keys:', !!subscriptionJSON.keys);
        console.log('🔍 Keys object:', subscriptionJSON.keys);
        
        if (!subscriptionJSON.keys || !subscriptionJSON.keys.p256dh || !subscriptionJSON.keys.auth) {
          console.error('❌ Subscription missing required keys!');
          console.error('Expected keys: p256dh and auth');
          console.error('Actual keys:', subscriptionJSON.keys);
          
          // Try alternative method to get keys
          try {
            const arrayBufferToBase64 = (buffer) => {
              const bytes = new Uint8Array(buffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            };
            
            if (subscription.getKey) {
              const p256dhKey = subscription.getKey('p256dh');
              const authKey = subscription.getKey('auth');
              
              if (p256dhKey && authKey) {
                console.log('✅ Retrieved keys using getKey method');
                subscriptionJSON.keys = {
                  p256dh: arrayBufferToBase64(p256dhKey),
                  auth: arrayBufferToBase64(authKey)
                };
              }
            }
          } catch (keyError) {
            console.error('❌ Failed to retrieve keys:', keyError);
          }
          
          // Final check
          if (!subscriptionJSON.keys || !subscriptionJSON.keys.p256dh || !subscriptionJSON.keys.auth) {
            console.error('❌ Unable to get subscription keys. Push notifications may not work.');
            return;
          }
        }

        // Send subscription to backend
        try {
          const serverUrl = import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:4000';
          console.log('📤 Sending subscription to server:', serverUrl);
          
          const subscriptionData = { 
            userId,
            endpoint: subscriptionJSON.endpoint,
            keys: {
              auth: subscriptionJSON.keys.auth,
              p256dh: subscriptionJSON.keys.p256dh
            }
          };
          
          console.log('📦 Subscription payload keys check:');
          console.log('  - Auth key:', !!subscriptionData.keys.auth);
          console.log('  - P256dh key:', !!subscriptionData.keys.p256dh);
          
          const response = await fetch(serverUrl + '/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscriptionData)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Subscribe failed:', response.status, errorText);
            throw new Error(`Subscribe failed: ${response.status} - ${errorText}`);
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


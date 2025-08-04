// src/hooks/usePushNotifications.ts
import { useEffect, useState } from 'react';
import { registerServiceWorker } from '../registerServiceWorker';
import { supabase } from '../lib/supabase';

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

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
      console.log('PushManager support:', 'PushManager' in window);
      
      if (!userId) {
        console.log('❌ No userId provided, skipping subscription');
        return;
      }
      
      if (!('Notification' in window)) {
        console.log('❌ Notifications not supported');
        return;
      }
      
      if (!('PushManager' in window)) {
        console.log('❌ Push messaging not supported');
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
      
      // Check if we're in a secure context
      if (!window.isSecureContext && !window.location.hostname.includes('localhost')) {
        console.error('❌ Push notifications require HTTPS in production');
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

        // Wait for service worker to be ready
        const readyRegistration = await navigator.serviceWorker.ready;
        console.log('✅ Service worker is ready');

        // Check existing subscription first
        let existingSubscription = await readyRegistration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('🔄 Found existing subscription, checking validity...');
          console.log('Existing subscription endpoint:', existingSubscription.endpoint);
          console.log('Existing subscription has keys:', !!existingSubscription.keys);
          
          // If existing subscription has keys, use it
          if (existingSubscription.keys && existingSubscription.keys.auth && existingSubscription.keys.p256dh) {
            console.log('✅ Existing subscription is valid, using it');
            await saveSubscriptionToDatabase(userId, existingSubscription);
            setSubscribed(true);
            return;
          } else {
            console.log('🔄 Existing subscription invalid, unsubscribing...');
            await existingSubscription.unsubscribe();
          }
        }

        // Multiple attempts to create subscription with keys
        let subscription = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        console.log('🔔 Creating fresh push subscription...');
        console.log('Using VAPID key:', PUBLIC_KEY.substring(0, 20) + '...');
        
        const applicationServerKey = urlBase64ToUint8Array(PUBLIC_KEY);
        console.log('Converted server key length:', applicationServerKey.length);
        
        // Validate VAPID key before proceeding
        if (applicationServerKey.length !== 65) {
          console.error('❌ Invalid VAPID key length. Expected 65 bytes, got:', applicationServerKey.length);
          return;
        }
        
        while (attempts < maxAttempts && !subscription?.keys) {
          attempts++;
          console.log(`🧪 Subscription attempt ${attempts}/${maxAttempts}...`);
          
          try {
            // Clear any existing subscription before each attempt
            let existingSub = await readyRegistration.pushManager.getSubscription();
            if (existingSub) {
              console.log('🧹 Clearing existing subscription before retry...');
              await existingSub.unsubscribe();
            }
            
            // Wait a bit between attempts
            if (attempts > 1) {
              console.log('⏳ Waiting before retry...');
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
            
            // Create subscription with timeout
            const subscriptionPromise = readyRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey
            });
            
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Subscription timeout')), 15000);
            });
            
            subscription = await Promise.race([subscriptionPromise, timeoutPromise]);
            
            console.log(`✅ Subscription attempt ${attempts} created`);
            console.log('🔍 Subscription endpoint:', subscription.endpoint);
            console.log('🔍 Subscription has keys:', !!subscription.keys);
            
            if (subscription.keys) {
              console.log('🔍 Auth key present:', !!subscription.keys.auth);
              console.log('🔍 P256dh key present:', !!subscription.keys.p256dh);
              console.log('🔍 Auth key length:', subscription.keys.auth ? subscription.keys.auth.byteLength : 0);
              console.log('🔍 P256dh key length:', subscription.keys.p256dh ? subscription.keys.p256dh.byteLength : 0);
              
              if (subscription.keys.auth && subscription.keys.p256dh) {
                console.log('🎉 Subscription keys successfully generated!');
                break;
              } else {
                console.log(`⚠️ Attempt ${attempts}: Subscription created but keys are incomplete`);
                subscription = null;
              }
            } else {
              console.log(`⚠️ Attempt ${attempts}: Subscription created but no keys object`);
              subscription = null;
            }
            
          } catch (error) {
            console.error(`❌ Subscription attempt ${attempts} failed:`, error);
            subscription = null;
            
            if (error.name === 'NotSupportedError') {
              console.log('❌ Push notifications not supported by this browser');
              break;
            }
            
            if (error.name === 'NotAllowedError') {
              console.log('❌ Push notifications blocked by user or policy');
              break;
            }
            
            if (attempts === maxAttempts) {
              console.log('❌ All subscription attempts failed');
            }
          }
        }
        
        if (!subscription || !subscription.keys) {
          console.error('❌ Failed to create subscription with keys after all attempts!');
          console.log('🔍 Browser information:');
          console.log('  - User Agent:', navigator.userAgent);
          console.log('  - Platform:', navigator.platform);
          console.log('  - Language:', navigator.language);
          console.log('  - Online:', navigator.onLine);
          console.log('  - Secure Context:', window.isSecureContext);
          console.log('  - Location:', window.location.href);
          
          console.log('💡 Possible solutions:');
          console.log('  - Try in Chrome browser (best support)');
          console.log('  - Disable browser extensions temporarily');
          console.log('  - Clear browser cache and cookies');
          console.log('  - Check if notifications are blocked in browser settings');
          console.log('  - Try in incognito/private mode');
          console.log('  - Ensure stable internet connection');
          
          return;
        }
        
        console.log('🔍 Auth key present:', !!subscription.keys.auth);
        console.log('🔍 P256dh key present:', !!subscription.keys.p256dh);
        
        if (!subscription.keys.auth || !subscription.keys.p256dh) {
          console.error('❌ Subscription keys are missing auth or p256dh!');
          return;
        }

        // Save to database and send to push server
        await saveSubscriptionToDatabase(userId, subscription);
        await sendSubscriptionToPushServer(userId, subscription);
        
        setSubscribed(true);
        console.log('🎉 Push notification setup completed successfully!');
        
      } catch (error) {
        console.error('❌ Unexpected error in subscription process:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    }

    // Save subscription to Supabase database
    async function saveSubscriptionToDatabase(userId: string, subscription: PushSubscription) {
      try {
        console.log('💾 Saving subscription to database...');
        
        const authKey = arrayBufferToBase64(subscription.keys.auth);
        const p256dhKey = arrayBufferToBase64(subscription.keys.p256dh);
        
        console.log('📦 Database payload:');
        console.log('  - User ID:', userId);
        console.log('  - Endpoint:', subscription.endpoint.substring(0, 50) + '...');
        console.log('  - Auth key length:', authKey.length);
        console.log('  - P256dh key length:', p256dhKey.length);
        
        // First, deactivate any existing subscriptions for this user
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('user_id', userId);
        
        // Insert new subscription
        const { data, error } = await supabase
          .from('push_subscriptions')
          .insert({
            user_id: userId,
            endpoint: subscription.endpoint,
            auth_key: authKey,
            p256dh_key: p256dhKey,
            is_active: true,
            device_info: {
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              url: window.location.href
            }
          })
          .select()
          .single();
        
        if (error) {
          console.error('❌ Failed to save subscription to database:', error);
        } else {
          console.log('✅ Subscription saved to database successfully:', data.id);
        }
      } catch (error) {
        console.error('❌ Database save error:', error);
      }
    }

    // Send subscription to push server
    async function sendSubscriptionToPushServer(userId: string, subscription: PushSubscription) {
      try {
        const serverUrl = import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:4000';
        console.log('📤 Sending subscription to push server:', serverUrl);
        
        const subscriptionData = { 
          userId,
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.keys.auth,
            p256dh: subscription.keys.p256dh
          }
        };
        
        console.log('📦 Push server payload keys check:');
        console.log('  - Auth key:', !!subscriptionData.keys.auth);
        console.log('  - P256dh key:', !!subscriptionData.keys.p256dh);
        
        const response = await fetch(serverUrl + '/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscriptionData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Push server subscribe failed:', response.status, errorText);
          throw new Error(`Subscribe failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Subscription sent to push server successfully:', result);
      } catch (error) {
        console.error('❌ Failed to send subscription to push server:', error);
        // Don't fail the whole process if push server is down
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


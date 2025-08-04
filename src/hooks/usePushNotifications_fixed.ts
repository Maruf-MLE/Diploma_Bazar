// src/hooks/usePushNotifications_fixed.ts
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

// Check if browser supports push notifications properly
function checkPushSupport(): { supported: boolean; reason?: string } {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'Service Workers not supported' };
  }
  
  if (!('PushManager' in window)) {
    return { supported: false, reason: 'Push Manager not supported' };
  }
  
  if (!('Notification' in window)) {
    return { supported: false, reason: 'Notifications not supported' };
  }
  
  // Check if we're in a secure context
  if (!window.isSecureContext && !window.location.hostname.includes('localhost')) {
    return { supported: false, reason: 'Requires HTTPS in production' };
  }
  
  // Check for specific browser issues
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return { supported: false, reason: 'Safari has limited push support' };
  }
  
  return { supported: true };
}

export function usePushNotifications(userId?: string) {
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupPushNotifications() {
      console.log('🔔 Push notification setup starting...');
      console.log('User ID:', userId);
      
      // Reset previous errors
      setError(null);
      
      if (!userId) {
        console.log('❌ No userId provided, skipping subscription');
        return;
      }
      
      // Check browser support first
      const supportCheck = checkPushSupport();
      if (!supportCheck.supported) {
        const errorMsg = `❌ Browser doesn't support push notifications: ${supportCheck.reason}`;
        console.log(errorMsg);
        setError(supportCheck.reason || 'Browser not supported');
        return;
      }
      
      console.log('✅ Browser supports push notifications');
      
      if (!PUBLIC_KEY) {
        const errorMsg = '❌ VAPID public key not found';
        console.error(errorMsg);
        setError('VAPID key missing');
        return;
      }
      
      console.log('✅ VAPID public key found');
      
      // Check notification permission
      if (Notification.permission === 'denied') {
        const errorMsg = '❌ Notification permission denied';
        console.log(errorMsg);
        setError('Permission denied');
        return;
      }
      
      try {
        // Request permission if not granted
        if (Notification.permission === 'default') {
          console.log('🔔 Requesting notification permission...');
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            const errorMsg = '❌ Notification permission not granted';
            console.log(errorMsg);
            setError('Permission not granted');
            return;
          }
        }
        
        console.log('✅ Notification permission granted');
        
        // Register service worker
        console.log('📋 Registering service worker...');
        const registration = await registerServiceWorker();
        if (!registration) {
          const errorMsg = '❌ Service worker registration failed';
          console.log(errorMsg);
          setError('Service worker failed');
          return;
        }
        
        console.log('✅ Service worker registered');
        
        // Wait for service worker to be ready
        const readyRegistration = await navigator.serviceWorker.ready;
        console.log('✅ Service worker ready');
        
        // Clear any existing subscription first
        let existingSubscription = await readyRegistration.pushManager.getSubscription();
        if (existingSubscription) {
          console.log('🔄 Removing existing subscription...');
          await existingSubscription.unsubscribe();
          console.log('✅ Existing subscription removed');
        }
        
        // Create new subscription with error handling
        console.log('🔔 Creating new push subscription...');
        console.log('Using VAPID key:', PUBLIC_KEY.substring(0, 20) + '...');
        
        try {
          const applicationServerKey = urlBase64ToUint8Array(PUBLIC_KEY);
          console.log('✅ VAPID key converted, length:', applicationServerKey.length);
          
          // Add timeout to subscription creation
          const subscriptionPromise = readyRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
          });
          
          // Create timeout promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Subscription timeout')), 10000);
          });
          
          const subscription = await Promise.race([subscriptionPromise, timeoutPromise]);
          
          console.log('✅ Push subscription created successfully');
          console.log('🔍 Subscription endpoint:', subscription.endpoint);
          console.log('🔍 Subscription has keys:', !!subscription.keys);
          
          if (!subscription.keys) {
            const errorMsg = '❌ Subscription created but has no keys - browser/network issue';
            console.error(errorMsg);
            setError('No subscription keys generated');
            
            // Try alternative approach - check if it's a browser issue
            console.log('🧪 Trying alternative subscription method...');
            
            // Unsubscribe and try again with different options
            await subscription.unsubscribe();
            
            const altSubscription = await readyRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey
            });
            
            if (!altSubscription.keys) {
              console.error('❌ Alternative method also failed - browser issue');
              return;
            } else {
              console.log('✅ Alternative method worked!');
              await handleSuccessfulSubscription(userId, altSubscription);
            }
            
            return;
          }
          
          console.log('✅ Subscription keys present');
          console.log('🔍 Auth key present:', !!subscription.keys.auth);
          console.log('🔍 P256dh key present:', !!subscription.keys.p256dh);
          
          if (!subscription.keys.auth || !subscription.keys.p256dh) {
            const errorMsg = '❌ Subscription keys incomplete';
            console.error(errorMsg);
            setError('Incomplete subscription keys');
            return;
          }
          
          // Save subscription successfully
          await handleSuccessfulSubscription(userId, subscription);
          
        } catch (subscriptionError) {
          console.error('❌ Subscription creation failed:', subscriptionError);
          
          if (subscriptionError.name === 'NotSupportedError') {
            setError('Push notifications not supported by browser');
          } else if (subscriptionError.name === 'NotAllowedError') {
            setError('Push notifications blocked by user');
          } else if (subscriptionError.message.includes('timeout')) {
            setError('Subscription timeout - network issue');
          } else {
            setError('Subscription creation failed');
          }
          
          console.log('🔍 Error details:', {
            name: subscriptionError.name,
            message: subscriptionError.message,
            code: subscriptionError.code
          });
        }
        
      } catch (error) {
        console.error('❌ Push notification setup failed:', error);
        setError('Setup failed');
      }
    }

    // Handle successful subscription
    async function handleSuccessfulSubscription(userId: string, subscription: PushSubscription) {
      try {
        console.log('💾 Saving subscription to database...');
        
        const authKey = arrayBufferToBase64(subscription.keys.auth);
        const p256dhKey = arrayBufferToBase64(subscription.keys.p256dh);
        
        console.log('📦 Subscription data:');
        console.log('  - User ID:', userId);
        console.log('  - Endpoint:', subscription.endpoint.substring(0, 50) + '...');
        console.log('  - Auth key length:', authKey.length);
        console.log('  - P256dh key length:', p256dhKey.length);
        
        // Deactivate existing subscriptions for this user
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
              url: window.location.href,
              language: navigator.language,
              platform: navigator.platform
            }
          })
          .select()
          .single();
        
        if (error) {
          console.error('❌ Failed to save subscription to database:', error);
          setError('Database save failed');
          return;
        }
        
        console.log('✅ Subscription saved to database:', data.id);
        
        // Send to push server
        await sendToPushServer(userId, subscription);
        
        setSubscribed(true);
        setError(null);
        console.log('🎉 Push notification setup completed successfully!');
        
      } catch (error) {
        console.error('❌ Subscription handling failed:', error);
        setError('Subscription handling failed');
      }
    }

    // Send subscription to push server
    async function sendToPushServer(userId: string, subscription: PushSubscription) {
      try {
        const serverUrl = import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:4000';
        console.log('📤 Sending subscription to push server:', serverUrl);
        
        const response = await fetch(serverUrl + '/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.keys.auth,
              p256dh: subscription.keys.p256dh
            }
          })
        });
        
        if (response.ok) {
          console.log('✅ Subscription sent to push server');
        } else {
          console.log('⚠️ Push server error:', response.status);
        }
      } catch (error) {
        console.log('⚠️ Push server not accessible:', error.message);
        // Don't fail the whole process
      }
    }

    setupPushNotifications();
  }, [userId]);

  return { subscribed, error };
}

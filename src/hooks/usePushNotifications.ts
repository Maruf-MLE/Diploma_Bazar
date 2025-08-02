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
      if (!('Notification' in window) || Notification.permission === 'denied') return;

      const registration = await registerServiceWorker();
      if (!registration) return;

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
        });
      }

      // Send subscription to backend
      await fetch(import.meta.env.VITE_PUSH_SERVER_URL + '/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subscription, userId })
      });
      setSubscribed(true);
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') subscribe();
      });
    } else if (Notification.permission === 'granted') {
      subscribe();
    }
  }, [userId]);

  return { subscribed };
}


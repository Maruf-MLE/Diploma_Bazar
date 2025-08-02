// src/registerServiceWorker.ts
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered');
      return registration;
    } catch (err) {
      console.error('SW registration failed', err);
    }
  }
}


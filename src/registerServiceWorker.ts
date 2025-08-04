// src/registerServiceWorker.ts
export async function registerServiceWorker() {
  console.log('🔧 Checking service worker support...');
  console.log('Service Worker in navigator:', 'serviceWorker' in navigator);
  console.log('Push Manager support:', 'PushManager' in window);
  console.log('Is secure context:', window.isSecureContext);
  
  if (!('serviceWorker' in navigator)) {
    console.error('❌ Service workers not supported');
    return null;
  }
  
  if (!('PushManager' in window)) {
    console.error('❌ Push messaging not supported');
    return null;
  }
  
  if (!window.isSecureContext) {
    console.warn('⚠️ Not in secure context, push notifications may not work');
    // Don't return null for localhost development
    if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      console.error('❌ Push notifications require HTTPS in production');
      return null;
    }
  }
  
  try {
    console.log('📋 Registering service worker at /service-worker.js');
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registered successfully');
    console.log('SW scope:', registration.scope);
    console.log('SW state:', registration.installing || registration.waiting || registration.active);
    
    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker is ready');
    
    return registration;
  } catch (err) {
    console.error('❌ SW registration failed:', err);
    return null;
  }
}


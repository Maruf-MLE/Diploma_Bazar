/**
 * Notification Utility Functions
 * এই ফাইলটি Web Notifications API এর জন্য safe wrapper প্রদান করে
 * পুরানো ব্রাউজার বা ডিভাইসে compatibility issue এড়াতে
 */

// Browser notification support check with Safari compatibility
export const isNotificationSupported = (): boolean => {
  try {
    // Safari-specific check: Safari might have Notification in window but it could be undefined
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check multiple conditions to ensure full Safari compatibility
    const hasNotificationAPI = 'Notification' in window;
    const notificationIsFunction = typeof window.Notification === 'function';
    const notificationConstructor = !!window.Notification;
    
    // For Safari, we need to ensure Notification is actually callable
    if (hasNotificationAPI && notificationIsFunction && notificationConstructor) {
      // Additional Safari-specific test - try to access permission property
      try {
        const permission = window.Notification.permission;
        return typeof permission === 'string';
      } catch (safariError) {
        console.warn('Safari Notification permission check failed:', safariError);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.warn('Notification support check failed:', error);
    return false;
  }
};

// Safe permission check with Safari compatibility
export const getNotificationPermission = (): string => {
  try {
    if (!isNotificationSupported()) {
      return 'unsupported';
    }
    
    // Safari-safe permission access
    if (window.Notification && typeof window.Notification.permission === 'string') {
      return window.Notification.permission;
    }
    
    return 'unsupported';
  } catch (error) {
    console.warn('Permission check failed:', error);
    return 'unsupported';
  }
};

// Safe permission request
export const requestNotificationPermission = async (): Promise<string> => {
  try {
    if (!isNotificationSupported()) {
      console.warn('Notifications not supported in this browser');
      return 'unsupported';
    }

    // Check current permission
    const currentPermission = getNotificationPermission();
    
    if (currentPermission === 'granted') {
      return 'granted';
    }
    
    if (currentPermission === 'denied') {
      return 'denied';
    }

    // Safari-safe permission request
    if (!window.Notification || typeof window.Notification.requestPermission !== 'function') {
      console.warn('Notification.requestPermission is not available');
      return 'unsupported';
    }
    
    const permission = await window.Notification.requestPermission();
    console.log('নোটিফিকেশন permission:', permission);
    return permission;
  } catch (error) {
    console.error('Permission request failed:', error);
    return 'error';
  }
};

// Safe notification creation
export const createSafeNotification = (title: string, options?: NotificationOptions): Notification | null => {
  try {
    if (!isNotificationSupported()) {
      console.warn('Notifications not supported, skipping notification creation');
      return null;
    }

    const permission = getNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted:', permission);
      return null;
    }

    // Create notification with safe options
    const safeOptions: NotificationOptions = {
      icon: '/favicon.ico',
      badge: '/icons/icon-192.png',
      ...options
    };

    // Safari-safe notification creation
    if (!window.Notification) {
      throw new Error('Notification constructor not available');
    }
    
    const notification = new window.Notification(title, safeOptions);
    
    // Add default event handlers
    notification.onclick = function(event) {
      event.preventDefault();
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

// Check if device/browser has push notification support with Safari compatibility
export const isPushNotificationSupported = (): boolean => {
  try {
    // Check basic requirements
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const hasNotifications = isNotificationSupported();
    
    // Safari-specific checks
    if (hasServiceWorker && hasPushManager && hasNotifications) {
      // Additional Safari validation
      try {
        // Check if PushManager is actually functional
        const pushManagerConstructor = window.PushManager;
        const serviceWorkerRegistration = navigator.serviceWorker;
        
        return !!(pushManagerConstructor && serviceWorkerRegistration);
      } catch (safariError) {
        console.warn('Safari push notification validation failed:', safariError);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.warn('Push notification support check failed:', error);
    return false;
  }
};

// Safe console logging for notification events
export const logNotificationEvent = (event: string, data?: any): void => {
  try {
    console.log(`🔔 Notification Event: ${event}`, data || '');
  } catch (error) {
    // Silent fail for logging
  }
};

// Get user-friendly error message in Bengali
export const getNotificationErrorMessage = (error: string): string => {
  const errorMessages: Record<string, string> = {
    'unsupported': 'আপনার ব্রাউজার/ফোনে নোটিফিকেশন সাপোর্ট নেই।',
    'denied': 'নোটিফিকেশন পারমিশন বন্ধ করা আছে।',
    'default': 'নোটিফিকেশন পারমিশন এখনও দেওয়া হয়নি।',
    'error': 'নোটিফিকেশন সেটআপে সমস্যা হয়েছে।'
  };

  return errorMessages[error] || 'অজানা সমস্যা হয়েছে।';
};

// Check if running on HTTPS (required for notifications on many browsers)
export const isSecureContext = (): boolean => {
  try {
    return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  } catch (error) {
    return false;
  }
};

// Complete environment check for notifications
export const checkNotificationEnvironment = (): {
  supported: boolean;
  permission: string;
  secure: boolean;
  issues: string[];
} => {
  const supported = isNotificationSupported();
  const permission = getNotificationPermission();
  const secure = isSecureContext();
  const issues: string[] = [];

  if (!supported) {
    issues.push('ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই');
  }

  if (!secure) {
    issues.push('HTTPS কানেকশন প্রয়োজন');
  }

  if (permission === 'denied') {
    issues.push('নোটিফিকেশন পারমিশন বন্ধ');
  }

  return {
    supported,
    permission,
    secure,
    issues
  };
};

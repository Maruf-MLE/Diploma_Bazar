/**
 * Notification Utility Functions
 * এই ফাইলটি Web Notifications API এর জন্য safe wrapper প্রদান করে
 * পুরানো ব্রাউজার বা ডিভাইসে compatibility issue এড়াতে
 */

// Browser notification support check
export const isNotificationSupported = (): boolean => {
  try {
    // Check if Notification exists in window object
    return 'Notification' in window && typeof Notification !== 'undefined';
  } catch (error) {
    console.warn('Notification support check failed:', error);
    return false;
  }
};

// Safe permission check
export const getNotificationPermission = (): string => {
  try {
    if (!isNotificationSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
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

    // Request permission
    const permission = await Notification.requestPermission();
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

    const notification = new Notification(title, safeOptions);
    
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

// Check if device/browser has push notification support
export const isPushNotificationSupported = (): boolean => {
  try {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      isNotificationSupported()
    );
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

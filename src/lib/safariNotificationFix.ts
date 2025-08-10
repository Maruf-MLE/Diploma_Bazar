/**
 * Safari Notification Compatibility Fix
 * Safari browser এর জন্য বিশেষ notification compatibility fix
 * Apple Safari এ "ReferenceError: Notification is not defined" fix করে
 */

// Detect Safari browser
export const isSafariBrowser = (): boolean => {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('firefox');
    const isWebKit = userAgent.includes('webkit');
    const isAppleDevice = userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('mac');
    
    return isSafari || (isWebKit && isAppleDevice);
  } catch (error) {
    console.warn('Safari detection failed:', error);
    return false;
  }
};

// Safari-specific notification API check
export const checkSafariNotificationAPI = (): {
  available: boolean;
  reason?: string;
  safariVersion?: string;
} => {
  try {
    if (!isSafariBrowser()) {
      return { available: true }; // Not Safari, assume OK
    }

    // Check if Notification is actually defined and functional in Safari
    if (typeof window.Notification === 'undefined') {
      return {
        available: false,
        reason: 'Notification API not available in this Safari version'
      };
    }

    if (typeof window.Notification !== 'function') {
      return {
        available: false,
        reason: 'Notification is not a constructor in Safari'
      };
    }

    // Try to access Notification.permission
    try {
      const permission = window.Notification.permission;
      if (typeof permission !== 'string') {
        return {
          available: false,
          reason: 'Notification.permission is not accessible in Safari'
        };
      }
    } catch (permissionError) {
      return {
        available: false,
        reason: 'Cannot access Notification.permission in Safari'
      };
    }

    // Check if requestPermission exists
    if (typeof window.Notification.requestPermission !== 'function') {
      return {
        available: false,
        reason: 'Notification.requestPermission not available in Safari'
      };
    }

    return { available: true };
  } catch (error) {
    return {
      available: false,
      reason: `Safari notification check failed: ${error.message}`
    };
  }
};

// Initialize safe notification globals for Safari
export const initSafariNotificationFix = (): void => {
  try {
    if (!isSafariBrowser()) {
      return; // Not Safari, no fix needed
    }

    const safariCheck = checkSafariNotificationAPI();
    
    if (!safariCheck.available) {
      console.warn(`🍎 Safari Notification Issue: ${safariCheck.reason}`);
      
      // Create safe fallback objects to prevent ReferenceError
      if (typeof window.Notification === 'undefined') {
        // Create a minimal Notification stub to prevent crashes
        (window as any).Notification = {
          permission: 'unsupported',
          requestPermission: () => Promise.resolve('unsupported')
        };
        
        console.log('🍎 Safari: Created Notification fallback to prevent errors');
      }
    } else {
      console.log('🍎 Safari: Notification API is properly available');
    }
  } catch (error) {
    console.error('Safari notification fix initialization failed:', error);
    
    // Last resort fallback
    if (typeof window.Notification === 'undefined') {
      (window as any).Notification = {
        permission: 'unsupported',
        requestPermission: () => Promise.resolve('unsupported')
      };
    }
  }
};

// Safari-friendly notification permission check
export const getSafariNotificationPermission = (): string => {
  try {
    const safariCheck = checkSafariNotificationAPI();
    
    if (!safariCheck.available) {
      return 'unsupported';
    }
    
    return window.Notification.permission || 'default';
  } catch (error) {
    console.warn('Safari permission check failed:', error);
    return 'unsupported';
  }
};

// Safari-friendly notification creation
export const createSafariNotification = (title: string, options?: NotificationOptions): Notification | null => {
  try {
    const safariCheck = checkSafariNotificationAPI();
    
    if (!safariCheck.available) {
      console.warn(`Cannot create notification in Safari: ${safariCheck.reason}`);
      return null;
    }
    
    const permission = getSafariNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Safari notification permission not granted:', permission);
      return null;
    }
    
    return new window.Notification(title, options);
  } catch (error) {
    console.error('Safari notification creation failed:', error);
    return null;
  }
};

// Safari notification troubleshooting info
export const getSafariNotificationInfo = (): {
  browser: string;
  isSafari: boolean;
  notificationSupported: boolean;
  issues: string[];
  suggestions: string[];
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const browserInfo = navigator.userAgent;
  const safari = isSafariBrowser();
  const safariCheck = checkSafariNotificationAPI();
  
  if (safari) {
    if (!safariCheck.available) {
      issues.push(safariCheck.reason || 'Unknown Safari issue');
      suggestions.push('Safari এর latest version এ update করুন');
      suggestions.push('System Preferences > Notifications এ check করুন');
    }
    
    // Check for common Safari issues
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      issues.push('Safari requires HTTPS for notifications');
      suggestions.push('Site টি HTTPS দিয়ে access করুন');
    }
    
    // Check for private browsing
    try {
      if (window.navigator.userAgent.includes('Private')) {
        issues.push('Private browsing mode may block notifications');
        suggestions.push('Private browsing mode off করুন');
      }
    } catch (e) {
      // Ignore private browsing detection errors
    }
  }
  
  return {
    browser: browserInfo,
    isSafari: safari,
    notificationSupported: safariCheck.available,
    issues,
    suggestions
  };
};

/**
 * Toast Manager Utility
 * 
 * Manages toast notifications to prevent duplicates and clean up expired data
 */

// Keys for localStorage
export const TOAST_STORAGE_KEYS = {
  MESSAGES: 'messageToaster_shownIds',
  NOTIFICATIONS: 'notificationToaster_shownIds',
} as const;

// Expiry times
export const TOAST_EXPIRY_TIMES = {
  MESSAGES: 5 * 60 * 1000, // 5 minutes
  NOTIFICATIONS: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Clean all expired toast data from localStorage
 */
export const cleanAllExpiredToastData = () => {
  try {
    const now = Date.now();
    let totalCleaned = 0;
    
    // Clean message toasts
    const messageData = localStorage.getItem(TOAST_STORAGE_KEYS.MESSAGES);
    if (messageData) {
      const messages = JSON.parse(messageData);
      const cleanedMessages: Record<string, number> = {};
      let messageCleaned = 0;
      
      Object.entries(messages).forEach(([id, timestamp]) => {
        if (typeof timestamp === 'number' && now - timestamp < TOAST_EXPIRY_TIMES.MESSAGES) {
          cleanedMessages[id] = timestamp;
        } else {
          messageCleaned++;
        }
      });
      
      // Only update localStorage if we actually cleaned something
      if (messageCleaned > 0 || Object.keys(messages).length !== Object.keys(cleanedMessages).length) {
        localStorage.setItem(TOAST_STORAGE_KEYS.MESSAGES, JSON.stringify(cleanedMessages));
        totalCleaned += messageCleaned;
      }
    }
    
    // Clean notification toasts
    const notificationData = localStorage.getItem(TOAST_STORAGE_KEYS.NOTIFICATIONS);
    if (notificationData) {
      const notifications = JSON.parse(notificationData);
      const cleanedNotifications: Record<string, number> = {};
      let notificationCleaned = 0;
      
      Object.entries(notifications).forEach(([id, timestamp]) => {
        if (typeof timestamp === 'number' && now - timestamp < TOAST_EXPIRY_TIMES.NOTIFICATIONS) {
          cleanedNotifications[id] = timestamp;
        } else {
          notificationCleaned++;
        }
      });
      
      // Only update localStorage if we actually cleaned something
      if (notificationCleaned > 0 || Object.keys(notifications).length !== Object.keys(cleanedNotifications).length) {
        localStorage.setItem(TOAST_STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleanedNotifications));
        totalCleaned += notificationCleaned;
      }
    }
    
    if (totalCleaned > 0) {
      console.log(`Toast data cleanup completed - removed ${totalCleaned} expired entries`);
    }
  } catch (error) {
    console.warn('Failed to clean toast data:', error);
  }
};

/**
 * Clear all toast data (useful for logout or reset)
 */
export const clearAllToastData = () => {
  try {
    localStorage.removeItem(TOAST_STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(TOAST_STORAGE_KEYS.NOTIFICATIONS);
    console.log('All toast data cleared');
  } catch (error) {
    console.warn('Failed to clear toast data:', error);
  }
};

/**
 * Get statistics about stored toast data
 */
export const getToastDataStats = () => {
  try {
    const messageData = localStorage.getItem(TOAST_STORAGE_KEYS.MESSAGES);
    const notificationData = localStorage.getItem(TOAST_STORAGE_KEYS.NOTIFICATIONS);
    
    const messageCount = messageData ? Object.keys(JSON.parse(messageData)).length : 0;
    const notificationCount = notificationData ? Object.keys(JSON.parse(notificationData)).length : 0;
    
    return {
      messageToasts: messageCount,
      notificationToasts: notificationCount,
      total: messageCount + notificationCount
    };
  } catch (error) {
    console.warn('Failed to get toast data stats:', error);
    return { messageToasts: 0, notificationToasts: 0, total: 0 };
  }
};

/**
 * Check if a specific message has been shown before
 */
export const hasToastBeenShown = (messageId: string, type: 'MESSAGES' | 'NOTIFICATIONS' = 'MESSAGES'): boolean => {
  try {
    const storageKey = TOAST_STORAGE_KEYS[type];
    const data = localStorage.getItem(storageKey);
    if (!data) return false;
    
    const entries = JSON.parse(data);
    const now = Date.now();
    const expiryTime = TOAST_EXPIRY_TIMES[type];
    
    // Check if message exists and is not expired
    if (messageId in entries) {
      const timestamp = entries[messageId];
      return (now - timestamp) < expiryTime;
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to check toast status:', error);
    return false;
  }
};

/**
 * Mark a toast as shown with automatic cleanup
 */
export const markToastAsShown = (messageId: string, type: 'MESSAGES' | 'NOTIFICATIONS' = 'MESSAGES'): void => {
  try {
    const storageKey = TOAST_STORAGE_KEYS[type];
    const data = localStorage.getItem(storageKey);
    const entries = data ? JSON.parse(data) : {};
    
    // Add new entry
    entries[messageId] = Date.now();
    
    // Clean expired entries while we're at it
    const now = Date.now();
    const expiryTime = TOAST_EXPIRY_TIMES[type];
    const cleanedEntries: Record<string, number> = {};
    
    Object.entries(entries).forEach(([id, timestamp]) => {
      if (typeof timestamp === 'number' && (now - timestamp) < expiryTime) {
        cleanedEntries[id] = timestamp;
      }
    });
    
    localStorage.setItem(storageKey, JSON.stringify(cleanedEntries));
  } catch (error) {
    console.warn('Failed to mark toast as shown:', error);
  }
};

/**
 * Auto-cleanup function that should be called periodically
 */
export const autoCleanupToastData = () => {
  // Clean expired data
  cleanAllExpiredToastData();
  
  // If we have too many entries, keep only the most recent ones
  const MAX_ENTRIES = 1000;
  
  try {
    // Clean message toasts if too many
    const messageData = localStorage.getItem(TOAST_STORAGE_KEYS.MESSAGES);
    if (messageData) {
      const messages = JSON.parse(messageData);
      const entries = Object.entries(messages);
      
      if (entries.length > MAX_ENTRIES) {
        // Keep only the most recent entries
        const sortedEntries = entries
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, MAX_ENTRIES);
        
        const trimmedMessages = Object.fromEntries(sortedEntries);
        localStorage.setItem(TOAST_STORAGE_KEYS.MESSAGES, JSON.stringify(trimmedMessages));
        
        console.log(`Trimmed message toasts from ${entries.length} to ${MAX_ENTRIES} entries`);
      }
    }
    
    // Clean notification toasts if too many
    const notificationData = localStorage.getItem(TOAST_STORAGE_KEYS.NOTIFICATIONS);
    if (notificationData) {
      const notifications = JSON.parse(notificationData);
      const entries = Object.entries(notifications);
      
      if (entries.length > MAX_ENTRIES) {
        // Keep only the most recent entries
        const sortedEntries = entries
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, MAX_ENTRIES);
        
        const trimmedNotifications = Object.fromEntries(sortedEntries);
        localStorage.setItem(TOAST_STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(trimmedNotifications));
        
        console.log(`Trimmed notification toasts from ${entries.length} to ${MAX_ENTRIES} entries`);
      }
    }
  } catch (error) {
    console.warn('Failed to auto-cleanup toast data:', error);
  }
};

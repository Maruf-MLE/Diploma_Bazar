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
    
    // Clean message toasts
    const messageData = localStorage.getItem(TOAST_STORAGE_KEYS.MESSAGES);
    if (messageData) {
      const messages = JSON.parse(messageData);
      const cleanedMessages: Record<string, number> = {};
      
      Object.entries(messages).forEach(([id, timestamp]) => {
        if (typeof timestamp === 'number' && now - timestamp < TOAST_EXPIRY_TIMES.MESSAGES) {
          cleanedMessages[id] = timestamp;
        }
      });
      
      localStorage.setItem(TOAST_STORAGE_KEYS.MESSAGES, JSON.stringify(cleanedMessages));
    }
    
    // Clean notification toasts
    const notificationData = localStorage.getItem(TOAST_STORAGE_KEYS.NOTIFICATIONS);
    if (notificationData) {
      const notifications = JSON.parse(notificationData);
      const cleanedNotifications: Record<string, number> = {};
      
      Object.entries(notifications).forEach(([id, timestamp]) => {
        if (typeof timestamp === 'number' && now - timestamp < TOAST_EXPIRY_TIMES.NOTIFICATIONS) {
          cleanedNotifications[id] = timestamp;
        }
      });
      
      localStorage.setItem(TOAST_STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleanedNotifications));
    }
    
    console.log('Toast data cleanup completed');
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
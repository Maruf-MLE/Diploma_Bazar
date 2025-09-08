/**
 * Active User Detection System
 * 
 * This system detects if a user is actively browsing the site
 * and only allows real-time notifications to be shown.
 */

interface UserActivity {
  isActive: boolean;
  lastActivity: number;
  isVisible: boolean;
  isOnline: boolean;
}

class ActiveUserDetector {
  private static instance: ActiveUserDetector;
  private userActivity: UserActivity;
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private readonly INACTIVITY_THRESHOLD = 30 * 1000; // 30 seconds

  constructor() {
    this.userActivity = {
      isActive: true,
      lastActivity: Date.now(),
      isVisible: !document.hidden,
      isOnline: navigator.onLine
    };

    this.setupEventListeners();
  }

  public static getInstance(): ActiveUserDetector {
    if (!ActiveUserDetector.instance) {
      ActiveUserDetector.instance = new ActiveUserDetector();
    }
    return ActiveUserDetector.instance;
  }

  private setupEventListeners(): void {
    // Track mouse movement, clicks, keyboard activity
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus', 'blur'
    ];

    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), true);
    });

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      this.userActivity.isVisible = !document.hidden;
      if (this.userActivity.isVisible) {
        this.updateActivity();
      }
      console.log('Page visibility changed:', this.userActivity.isVisible ? 'visible' : 'hidden');
    });

    // Track online status
    window.addEventListener('online', () => {
      this.userActivity.isOnline = true;
      console.log('User came online');
    });

    window.addEventListener('offline', () => {
      this.userActivity.isOnline = false;
      console.log('User went offline');
    });

    // Track window focus/blur
    window.addEventListener('focus', () => {
      this.userActivity.isVisible = true;
      this.updateActivity();
      console.log('Window gained focus');
    });

    window.addEventListener('blur', () => {
      console.log('Window lost focus');
    });
  }

  private updateActivity(): void {
    this.userActivity.isActive = true;
    this.userActivity.lastActivity = Date.now();

    // Clear existing inactivity timeout
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }

    // Set new inactivity timeout
    this.inactivityTimeout = setTimeout(() => {
      this.userActivity.isActive = false;
      console.log('User became inactive due to inactivity');
    }, this.INACTIVITY_THRESHOLD);
  }

  /**
   * Check if user is actively browsing right now
   */
  public isUserActive(): boolean {
    const now = Date.now();
    const timeSinceLastActivity = now - this.userActivity.lastActivity;
    
    const isRecentlyActive = timeSinceLastActivity < this.INACTIVITY_THRESHOLD;
    const isCurrentlyActive = this.userActivity.isActive && 
                            this.userActivity.isVisible && 
                            this.userActivity.isOnline &&
                            isRecentlyActive;

    if (process.env.NODE_ENV === 'development') {
      console.log('User activity check:', {
        isActive: this.userActivity.isActive,
        isVisible: this.userActivity.isVisible,
        isOnline: this.userActivity.isOnline,
        timeSinceLastActivity,
        isRecentlyActive,
        result: isCurrentlyActive
      });
    }

    return isCurrentlyActive;
  }

  /**
   * Check if message is received in real-time (within last 10 seconds)
   */
  public isRealTimeMessage(messageTimestamp: string): boolean {
    try {
      const messageTime = new Date(messageTimestamp).getTime();
      const now = Date.now();
      const timeDiff = now - messageTime;
      
      // Consider message as real-time if received within 10 seconds
      const isRealTime = timeDiff <= 10000; // 10 seconds
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Real-time message check:', {
          messageTime: new Date(messageTimestamp).toISOString(),
          currentTime: new Date().toISOString(),
          timeDiff: `${timeDiff}ms`,
          isRealTime
        });
      }

      return isRealTime;
    } catch (error) {
      console.error('Error checking message timestamp:', error);
      return false;
    }
  }

  /**
   * Should show toast notification?
   * Only if user is active AND message is real-time
   */
  public shouldShowToast(messageTimestamp: string): boolean {
    const userActive = this.isUserActive();
    const isRealTime = this.isRealTimeMessage(messageTimestamp);
    
    const shouldShow = userActive && isRealTime;
    
    console.log('Toast decision:', {
      userActive,
      isRealTime,
      shouldShow,
      messageTime: messageTimestamp
    });

    return shouldShow;
  }

  /**
   * Get current activity status for debugging
   */
  public getActivityStatus(): UserActivity & { timeSinceLastActivity: number } {
    return {
      ...this.userActivity,
      timeSinceLastActivity: Date.now() - this.userActivity.lastActivity
    };
  }

  /**
   * Force update activity (useful for testing)
   */
  public forceUpdateActivity(): void {
    this.updateActivity();
  }

  /**
   * Clean up event listeners (call on component unmount)
   */
  public cleanup(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    // Note: We don't remove event listeners as this is a singleton
    // and may be used by other components
  }
}

// Export singleton instance
export const activeUserDetector = ActiveUserDetector.getInstance();

// Export convenience functions
export const isUserActiveNow = (): boolean => activeUserDetector.isUserActive();
export const shouldShowToastNotification = (messageTimestamp: string): boolean => 
  activeUserDetector.shouldShowToast(messageTimestamp);
export const getUserActivityStatus = () => activeUserDetector.getActivityStatus();

/**
 * Global Session Management for Toast Notifications
 * 
 * Manages session data that persists across page navigations
 * to prevent duplicate toasts when user navigates between pages
 */
export const cleanupGlobalSession = () => {
  if (typeof window !== 'undefined' && (window as any).__DIPLOMA_BAZAR_SESSION) {
    const session = (window as any).__DIPLOMA_BAZAR_SESSION;
    
    // Clean up old messages (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const sessionAge = Date.now() - parseInt(session.sessionId);
    
    if (sessionAge > oneHourAgo) {
      console.log('🧹 Cleaning up old global session data');
      session.shownMessages.clear();
      session.toastCount = 0;
      session.sessionId = Date.now().toString();
    }
    
    // Limit session storage (keep only last 100 messages)
    if (session.shownMessages.size > 100) {
      console.log('🧹 Trimming global session message history');
      const messagesArray = Array.from(session.shownMessages);
      session.shownMessages.clear();
      // Keep only the last 50 messages
      messagesArray.slice(-50).forEach(id => session.shownMessages.add(id));
    }
  }
};

export const getGlobalSessionStats = () => {
  if (typeof window === 'undefined') return null;
  
  const session = (window as any).__DIPLOMA_BAZAR_SESSION;
  if (!session) return null;
  
  return {
    sessionId: session.sessionId,
    shownMessagesCount: session.shownMessages.size,
    activeToastCount: session.toastCount,
    sessionAge: Date.now() - parseInt(session.sessionId)
  };
};

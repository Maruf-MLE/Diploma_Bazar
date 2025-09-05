import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { playNotificationSound } from "@/lib/playNotificationSound";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

// Global storage for shown notification IDs to persist across component re-renders and page changes
const SHOWN_NOTIFICATIONS_KEY = 'notificationToaster_shownIds';
const NOTIFICATION_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

// Helper functions for localStorage management
const getShownNotifications = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(SHOWN_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setShownNotifications = (notifications: Record<string, number>) => {
  try {
    localStorage.setItem(SHOWN_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.warn('Failed to save shown notifications to localStorage:', error);
  }
};

const cleanExpiredNotifications = () => {
  const now = Date.now();
  const notifications = getShownNotifications();
  const cleaned: Record<string, number> = {};
  
  Object.entries(notifications).forEach(([id, timestamp]) => {
    if (now - timestamp < NOTIFICATION_EXPIRY_TIME) {
      cleaned[id] = timestamp;
    }
  });
  
  setShownNotifications(cleaned);
  return cleaned;
};

const hasNotificationBeenShown = (notificationId: string): boolean => {
  const notifications = cleanExpiredNotifications();
  return notificationId in notifications;
};

const markNotificationAsShown = (notificationId: string) => {
  const notifications = getShownNotifications();
  notifications[notificationId] = Date.now();
  setShownNotifications(notifications);
};

// Track active toasts to prevent duplicates
let activeNotificationToastCount = 0;
const MAX_CONCURRENT_NOTIFICATION_TOASTS = 2;

/**
 * Listens for new unread notifications and shows a toast that mimics
 * a subtle mobile push-notification. The toast slides in from the right
 * (handled by Sonner's default animation) and disappears automatically.
 */
export default function NotificationToaster() {
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  // Clean up expired notifications on component mount
  useEffect(() => {
    cleanExpiredNotifications();
    
    // Debug info in development
    if (process.env.NODE_ENV === 'development') {
      const stats = {
        shownNotifications: Object.keys(getShownNotifications()).length,
        activeToasts: activeNotificationToastCount
      };
      console.log('NotificationToaster initialized with stats:', stats);
    }
  }, []);

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Only consider the most recent 10 to avoid looping through a huge list
    notifications.slice(0, 10).forEach((n) => {
      if (n.is_read) return; // Only toast unread items
      if (!n.id) return; // Skip if no ID
      
      // Check if we've already shown this notification
      if (hasNotificationBeenShown(n.id)) {
        console.log('Notification toast already shown for ID:', n.id);
        return;
      }
      
      // Check if we've reached the maximum concurrent toasts
      if (activeNotificationToastCount >= MAX_CONCURRENT_NOTIFICATION_TOASTS) {
        console.log('Maximum concurrent notification toasts reached, skipping new toast');
        return;
      }
      
      // Mark this notification as shown
      markNotificationAsShown(n.id);
      activeNotificationToastCount++;

      playNotificationSound();
      
      const toastId = toast.custom((t) => (
        <div
          onClick={() => {
            navigate("/messages");
            toast.dismiss(t.id);
            activeNotificationToastCount = Math.max(0, activeNotificationToastCount - 1);
          }}
          role="button"
          tabIndex={0}
          className="flex w-full cursor-pointer flex-col rounded-md border bg-background p-4 shadow-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/** Header line with sender name */}
          <strong className="mb-1 text-sm font-semibold">
            {(n.sender_name || n.title || "একজন ব্যবহারকারী")} আপনাকে একটি নতুন বার্তা পাঠিয়েছেন
          </strong>
          <span className="text-xs text-muted-foreground">
            {n.body || n.content || "আপনার কাছে একটি নতুন নোটিফিকেশন রয়েছে।"}
          </span>
          <span className="mt-2 inline-flex h-6 w-fit items-center justify-center rounded bg-primary px-3 text-xs font-medium text-primary-foreground">
            দেখুন
          </span>
        </div>
      ), { 
        duration: 5000,
        onDismiss: () => {
          activeNotificationToastCount = Math.max(0, activeNotificationToastCount - 1);
        },
        onAutoClose: () => {
          activeNotificationToastCount = Math.max(0, activeNotificationToastCount - 1);
        }
      });
    });
  }, [notifications, navigate]);

  // This component does not render anything itself
  return null;
}


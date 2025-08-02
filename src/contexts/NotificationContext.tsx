import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Notification, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationCount } from '@/lib/NotificationService';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { retryOperation, checkSupabaseConnection } from '@/lib/supabase';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Cache duration in milliseconds (30 seconds)
const CACHE_DURATION = 30000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  
  // Cache management
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Check connection status
  const checkConnection = useCallback(async () => {
    if (!user) return;
    
    setConnectionStatus('checking');
    const { connected } = await checkSupabaseConnection();
    setConnectionStatus(connected ? 'connected' : 'disconnected');
    
    return connected;
  }, [user]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const { count, error } = await getUnreadNotificationCount(user.id);
      if (error) throw error;
      
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [user]);

  // Fetch notifications with retry logic and caching
  const fetchNotifications = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    // Use cache if not forced refresh and cache is still valid
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION && notifications.length > 0) {
      console.log('Using cached notifications, last fetch was', (now - lastFetchTime) / 1000, 'seconds ago');
      return;
    }
    
    console.log('Fetching notifications for user:', user.id);
    setLoading(true);
    
    try {
      // First check connection
      const isConnected = await checkConnection();
      if (!isConnected) {
        console.log('Not connected to Supabase, using cached data if available');
        setLoading(false);
        return;
      }
      
      // Use retry operation with increased limit to ensure we get all notifications
      const { data, error: fetchError } = await retryOperation(() => 
        getUserNotifications(user.id, 50, 0, true)
      );
      
      if (fetchError) {
        throw fetchError;
      }
      
      console.log('Notifications fetched successfully:', data.length);
      setNotifications(data);
      setLastFetchTime(now);
      setError(null);
      
      // Also update unread count
      fetchUnreadCount();
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      
      // Try to load from local storage as fallback
      const cachedData = localStorage.getItem(`notifications_${user.id}`);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          console.log('Using cached notifications from localStorage');
          setNotifications(parsedData);
        } catch (parseError) {
          console.error('Error parsing cached notifications:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, lastFetchTime, notifications.length, checkConnection, fetchUnreadCount]);

  // Save notifications to localStorage for offline access
  useEffect(() => {
    if (user && notifications.length > 0) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [user, notifications]);

  // Fetch notifications when user changes
  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    if (user) {
      // Only fetch on initial mount or user change
      if (isInitialMount.current) {
        fetchNotifications();
        fetchUnreadCount();
        isInitialMount.current = false;
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  // Subscribe to realtime notifications
  useSupabaseRealtime(
    {
      table: 'notifications',
      event: '*',
      filter: user ? `user_id=eq.${user.id}` : undefined
    },
    (payload) => {
      console.log('Realtime notification update received:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newNotification = payload.new as Notification;
        console.log('New notification received:', newNotification);
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      } else if (payload.eventType === 'UPDATE') {
        const updatedNotification = payload.new as Notification;
        console.log('Notification updated:', updatedNotification);
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === updatedNotification.id ? updatedNotification : notification
          )
        );
        
        // If notification was marked as read, update unread count
        if (payload.old.is_read === false && updatedNotification.is_read === true) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else if (payload.eventType === 'DELETE') {
        const deletedNotification = payload.old as Notification;
        console.log('Notification deleted:', deletedNotification);
        setNotifications(prev => 
          prev.filter(notification => notification.id !== deletedNotification.id)
        );
        
        // If deleted notification was unread, update unread count
        if (deletedNotification.is_read === false) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    },
    !!user
  );

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await markNotificationAsRead(notificationId);
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await markAllNotificationsAsRead(user.id);
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications(true);
    await fetchUnreadCount();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        connectionStatus
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 
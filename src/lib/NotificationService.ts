import { supabase } from './supabase';

// Push notification configuration
const PUSH_SERVER_URL = import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:4000';

/**
 * Send push notification to user's device
 */
async function sendPushNotification({ userId, title, body, url }: {
  userId: string;
  title: string;
  body: string;
  url: string;
}) {
  try {
    console.log('Sending push notification:', { userId, title, body, url });
    
    const response = await fetch(`${PUSH_SERVER_URL}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title,
        body,
        url
      })
    });
    
    if (!response.ok) {
      throw new Error(`Push server error: ${response.status}`);
    }
    
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * Get notification title based on type
 */
function getNotificationTitle(type: NotificationType): string {
  const titles = {
    purchase_request: 'কেনার অনুরোধ',
    request_accepted: 'অনুরোধ গৃহীত',
    request_rejected: 'অনুরোধ প্রত্যাখ্যাত',
    book_sold: 'বই বিক্রি হয়েছে',
    book_available: 'বই উপলব্ধ',
    payment_received: 'পেমেন্ট পাওয়া গেছে',
    payment_sent: 'পেমেন্ট পাঠানো হয়েছে',
    message: 'নতুন বার্তা',
    verification_approved: 'যাচাই অনুমোদিত',
    verification_rejected: 'যাচাই প্রত্যাখ্যাত',
    book_added: 'নতুন বই যোগ হয়েছে'
  };
  return titles[type] || 'নোটিফিকেশন';
}

export type NotificationType = 
  | 'purchase_request'  // বই কেনার অনুরোধ
  | 'request_accepted'  // অনুরোধ গৃহীত
  | 'request_rejected'  // অনুরোধ প্রত্যাখ্যাত
  | 'book_sold'        // বই বিক্রি হয়েছে
  | 'book_available'   // বই উপলব্ধ
  | 'payment_received' // পেমেন্ট পাওয়া গেছে
  | 'payment_sent'     // পেমেন্ট পাঠানো হয়েছে
  | 'message'         // সাধারণ বার্তা
  | 'verification_approved'  // যাচাইয়ের অনুমোদন
  | 'verification_rejected'  // যাচাইয়ের প্রত্যাখ্যাত
  | 'book_added';         // বই যোগাযোগ হয়েছে

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  related_id?: string;  // বই বা রিকোয়েস্ট আইডি
  sender_id?: string;   // যে ইউজার নোটিফিকেশন পাঠিয়েছে
  sender_name?: string;
  sender_avatar_url?: string;
  action_url?: string;  // নোটিফিকেশনে ক্লিক করলে কোথায় যাবে
}

/**
 * Creates a new notification and sends push notification
 * 
 * @param notification The notification data
 * @returns The created notification or error
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'is_read'>) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        is_read: false
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Send push notification to the user's device
    await sendPushNotification({
      userId: notification.user_id,
      title: getNotificationTitle(notification.type),
      body: notification.message,
      url: notification.action_url || '/messages'
    });
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
}

/**
 * Gets notifications for a user
 * 
 * @param userId The user ID to get notifications for
 * @param limit The maximum number of notifications to return
 * @param offset The offset for pagination
 * @param includeRead Whether to include read notifications
 * @returns The notifications or error
 */
export async function getUserNotifications(
  userId: string, 
  limit: number = 50, 
  offset: number = 0,
  includeRead: boolean = true
) {
  try {
    console.log(`Fetching notifications for user ${userId}, includeRead: ${includeRead}, limit: ${limit}`);
    
    // First, get notifications without joins
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Apply filter for read status if needed
    if (!includeRead) {
      query = query.eq('is_read', false);
    }
    
    // Apply pagination
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    if (offset > 0) {
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data: notifications, error } = await query;
    
    if (error) {
      console.error('Error in getUserNotifications query:', error);
      throw error;
    }
    
    console.log(`Retrieved ${notifications?.length || 0} notifications`);
    
    // If no notifications, return empty array
    if (!notifications || notifications.length === 0) {
      return { data: [], error: null };
    }
    
    // Get unique sender IDs
    const senderIds = notifications
      .filter(n => n.sender_id)
      .map(n => n.sender_id)
      .filter((id, index, self) => id && self.indexOf(id) === index);
    
    // If there are sender IDs, fetch their profiles
    let senderProfiles = {};
    if (senderIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', senderIds);
        
      if (profilesError) {
        console.error('Error fetching sender profiles:', profilesError);
      } else if (profiles) {
        // Create a map of sender profiles by ID
        senderProfiles = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }
    
    // Format notifications with sender information
    const formattedNotifications = notifications.map(notification => {
      const senderProfile = notification.sender_id ? senderProfiles[notification.sender_id] : null;
      return {
        ...notification,
        sender_name: senderProfile?.name,
        sender_avatar_url: senderProfile?.avatar_url
      };
    });
    
    return { data: formattedNotifications, error: null };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: [], error };
  }
}

/**
 * Marks a notification as read
 * 
 * @param notificationId The ID of the notification to mark as read
 * @returns Success or error
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }
}

/**
 * Marks all notifications for a user as read
 * 
 * @param userId The ID of the user to mark all notifications as read
 * @returns Success or error
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { data: null, error };
  }
}

/**
 * Gets the count of unread notifications for a user
 * 
 * @param userId The ID of the user to count unread notifications for
 * @returns The count of unread notifications or error
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
      
    if (error) throw error;
    
    return { count, error: null };
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return { count: 0, error };
  }
}

/**
 * Deletes a notification
 * 
 * @param notificationId The ID of the notification to delete
 * @returns Success or error
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error };
  }
}

/**
 * Get all notifications for a user
 */
export async function getAllNotifications(userId: string, limit = 30) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return { 
      notifications: data as Notification[], 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return { 
      notifications: [], 
      error 
    };
  }
}

/**
 * Subscribe to real-time notifications for a user
 */
export function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const newNotification = payload.new as Notification;
        callback(newNotification);
      }
    )
    .subscribe();
    
  return channel;
}

/**
 * Count unread notifications for a user
 */
export async function countUnreadNotifications(userId: string) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
      
    if (error) throw error;
    
    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return { count: 0, error };
  }
}

/**
 * Handle notification click based on notification type
 * 
 * @param notification The notification to handle
 * @param navigate The navigate function from react-router-dom
 * @param onClose Optional callback to close notification panel/dropdown
 */
export async function handleNotificationClick(
  notification: Notification, 
  navigate: any, 
  onClose?: () => void
) {
  try {
    // Mark the notification as read
    await markNotificationAsRead(notification.id);
    
    // Handle different notification types
    switch (notification.type) {
      case 'verification_approved':
        // Navigate to verification approved page
        if (notification.related_id) {
          navigate(`/verification/approved/${notification.related_id}`);
        } else {
          navigate('/verification');
        }
        break;
        
      case 'verification_rejected':
        // Navigate to verification details page with rejected status
        if (notification.related_id) {
          navigate(`/verification/details/${notification.related_id}?status=rejected`);
        } else {
          navigate('/verification');
        }
        break;
        
      case 'message':
        // Navigate to messages with conversation
        if (notification.related_id) {
          navigate(`/messages?conversation=${notification.related_id}`);
        } else {
          navigate('/messages');
        }
        break;
        
      case 'purchase_request':
        // For purchase request notifications, we need to check if the current user is the buyer or seller
        if (notification.related_id) {
          // Get the purchase request details to determine buyer and seller
          const { data: requestData } = await supabase
            .from('purchase_requests')
            .select('*')
            .eq('id', notification.related_id)
            .single();
            
          if (requestData) {
            const { buyer_id, seller_id } = requestData;
            const currentUser = (await supabase.auth.getUser()).data.user;
            
            if (currentUser) {
              // If current user is the seller, navigate to messages with buyer as the conversation partner
              if (currentUser.id === seller_id) {
                // Force navigate to messages page with buyer as seller parameter
                window.location.href = `/messages?seller=${buyer_id}`;
                return { success: true, error: null };
              } 
              // If current user is the buyer, navigate to messages with seller as the conversation partner
              else if (currentUser.id === buyer_id) {
                // Force navigate to messages page with seller parameter
                window.location.href = `/messages?seller=${seller_id}`;
                return { success: true, error: null };
              }
            }
          }
          // Fallback to messages page instead of profile
          navigate(`/messages?requestId=${notification.related_id}`);
        } else {
          navigate('/messages');
        }
        break;
        
      case 'request_accepted':
      case 'request_rejected':
        // For request status notifications, similar logic as purchase_request
        if (notification.related_id) {
          // Get the purchase request details
          const { data: requestData } = await supabase
            .from('purchase_requests')
            .select('*')
            .eq('id', notification.related_id)
            .single();
            
          if (requestData) {
            const { buyer_id, seller_id } = requestData;
            const currentUser = (await supabase.auth.getUser()).data.user;
            
            if (currentUser) {
              // If current user is the seller, navigate to messages with buyer
              if (currentUser.id === seller_id) {
                // Force navigate to messages page with buyer as seller parameter
                window.location.href = `/messages?seller=${buyer_id}`;
                return { success: true, error: null };
              } 
              // If current user is the buyer, navigate to messages with seller
              else if (currentUser.id === buyer_id) {
                // Force navigate to messages page with seller parameter
                window.location.href = `/messages?seller=${seller_id}`;
                return { success: true, error: null };
              }
            }
          }
          // Fallback to messages page instead of profile
          navigate(`/messages?requestId=${notification.related_id}`);
        } else {
          navigate('/messages');
        }
        break;
        
      case 'book_added':
        // Navigate to book details
        if (notification.related_id) {
          navigate(`/book/${notification.related_id}`);
        } else {
          navigate('/books');
        }
        break;
        
      default:
        // Default navigation based on action_url if available
        if (notification.action_url) {
          navigate(notification.action_url);
        } else {
          // Fallback to messages page instead of profile
          navigate('/messages');
        }
        break;
    }
    
    // Call onClose if provided
    if (onClose) {
      onClose();
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error handling notification click:', error);
    return { success: false, error };
  }
} 
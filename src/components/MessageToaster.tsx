import { useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { playNotificationSound } from '@/lib/playNotificationSound';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { supabase } from '@/lib/supabase';
import { shouldShowToastNotification, getUserActivityStatus } from '@/lib/activeUserDetection';

// Session-only tracking to prevent duplicate sound notifications
const currentSessionSounds = new Set<string>();

/**
 * Message Toast Notifier
 * 
 * Shows toast notifications with sound ONLY when:
 * 1. User is actively browsing the site (not idle/away/offline)
 * 2. Message is received in real-time (within 10 seconds)
 * 3. User is not on the messages page
 * 4. Toast hasn't been shown for this message in current session
 */
export default function MessageToaster() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Clear session tracking on mount
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📬 Message Toast Notifier initialized');
      console.log('📊 User activity status:', getUserActivityStatus());
    }

    // Clear session sounds on mount for fresh start
    currentSessionSounds.clear();

    return () => {
      console.log('📬 MessageToaster unmounted');
    };
  }, []);

  // Real-time subscription - only plays sound for ACTIVE users receiving REAL-TIME messages
  useSupabaseRealtime(
    {
      table: 'messages',
      event: 'INSERT',
      filter: user ? `receiver_id=eq.${user.id}` : undefined,
    },
    (payload) => {
      if (!user) {
        console.log('❌ No user, skipping sound');
        return;
      }
      
      if (location.pathname.startsWith('/messages')) {
        console.log('📱 User is on messages page, skipping sound');
        return;
      }

      const message = payload.new as {
        id: string;
        sender_id: string;
        sender_name?: string;
        content: string;
        created_at?: string;
      };

      if (!message || !message.id || !message.created_at) {
        console.log('❌ Invalid message data, skipping sound');
        return;
      }

      // 🚨 CRITICAL CHECK: Only play sound if user is ACTIVE and message is REAL-TIME
      if (!shouldShowToastNotification(message.created_at)) {
        console.log('⏰ User not active or message not real-time, skipping sound:', {
          messageId: message.id,
          messageTime: message.created_at,
          userStatus: getUserActivityStatus()
        });
        return;
      }

      // Check for session sound duplicates
      if (currentSessionSounds.has(message.id)) {
        console.log('🔄 Sound already played for this message:', message.id);
        return;
      }

      // Mark sound as played in current session
      currentSessionSounds.add(message.id);

      const preview = message.content?.trim() ? message.content.slice(0, 60) : 'আপনার জন্য একটি নতুন বার্তা আছে';

      console.log('✅ Showing message toast for active user:', {
        messageId: message.id,
        senderId: message.sender_id,
        messageTime: message.created_at,
        preview: preview.substring(0, 20) + '...'
      });

      // Get sender name
      const getSenderName = async (): Promise<string> => {
        if (message.sender_name && message.sender_name.trim().length) {
          return message.sender_name;
        }
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', message.sender_id)
            .single();
          if (error) throw error;
          return data?.full_name || 'একজন ব্যবহারকারী';
        } catch (err) {
          console.error('Failed to fetch sender name', err);
          return 'একজন ব্যবহারকারী';
        }
      };

      getSenderName().then((senderName) => {
        playNotificationSound();

        toast.custom(
          (t) => (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                navigate(`/messages?seller=${message.sender_id}`);
                toast.dismiss(t.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/messages?seller=${message.sender_id}`);
                  toast.dismiss(t.id);
                }
              }}
              className="flex w-full cursor-pointer flex-col rounded-md border bg-background p-4 shadow-md outline-none transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring animate-in slide-in-from-right-full"
            >
              <div className="flex items-center space-x-2 mb-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <strong className="text-sm font-semibold">{senderName} আপনাকে একটি নতুন বার্তা পাঠিয়েছেন</strong>
              </div>
              <span className="text-xs text-muted-foreground mb-2">{preview}</span>
              <span className="self-end inline-flex h-6 w-fit items-center justify-center rounded bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                দেখুন →
              </span>
            </div>
          ),
          {
            duration: 2000, // 2 seconds duration
          }
        );

        console.log('✅ Message toast displayed successfully');
      }).catch(error => {
        console.error('Error displaying toast:', error);
      });
    },
    !!user
  );

  // Component renders nothing - it handles toast notifications
  return null;
}


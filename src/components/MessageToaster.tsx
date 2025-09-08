import { useRef, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { playNotificationSound } from '@/lib/playNotificationSound';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { supabase } from '@/lib/supabase';

// Global storage for shown message IDs to persist across component re-renders and page changes
const SHOWN_MESSAGES_KEY = 'messageToaster_shownIds';
const MESSAGE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Session-based tracking to prevent duplicates within the same session
const sessionShownMessages = new Set<string>();
const sessionStartTime = Date.now();

// Helper functions for localStorage management
const getShownMessages = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(SHOWN_MESSAGES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setShownMessages = (messages: Record<string, number>) => {
  try {
    localStorage.setItem(SHOWN_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to save shown messages to localStorage:', error);
  }
};

const cleanExpiredMessages = () => {
  const now = Date.now();
  const messages = getShownMessages();
  const cleaned: Record<string, number> = {};

  Object.entries(messages).forEach(([id, timestamp]) => {
    if (now - timestamp < MESSAGE_EXPIRY_TIME) {
      cleaned[id] = timestamp;
    }
  });

  setShownMessages(cleaned);
  return cleaned;
};

// Track active toasts to prevent duplicates
let activeToastCount = 0;
const MAX_CONCURRENT_TOASTS = 3;

const hasMessageBeenShown = (messageId: string): boolean => {
  const messages = cleanExpiredMessages();
  return messageId in messages;
};

const markMessageAsShown = (messageId: string) => {
  const messages = getShownMessages();
  messages[messageId] = Date.now();
  setShownMessages(messages);
};

/**
 * Global toaster for incoming chat messages.
 * 
 * Shows a small toast (push-notification style) whenever the authenticated
 * user receives a new message—no matter which page they are currently on.
 * If the user is already on the /messages page we skip the toast because the
 * MessagingPage component will handle UI feedback itself.
 */
export default function MessageToaster() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Clean up expired messages on component mount
  useEffect(() => {
    cleanExpiredMessages();

    // Debug info in development
    if (process.env.NODE_ENV === 'development') {
      const stats = {
        shownMessages: Object.keys(getShownMessages()).length,
        activeToasts: activeToastCount
      };
      console.log('MessageToaster initialized with stats:', stats);
    }
  }, []);

  // Realtime subscription – active only while an authenticated user exists
  useSupabaseRealtime(
    {
      table: 'messages',
      event: 'INSERT',
      filter: user ? `receiver_id=eq.${user.id}` : undefined,
    },
    (payload) => {
      if (!user) return;
      if (location.pathname.startsWith('/messages')) return; // already on chat page

      const message = payload.new as {
        id: string;
        sender_id: string;
        sender_name?: string;
        content: string;
        created_at?: string;
      };

      if (!message || !message.id) return;

      // Check if message is too old (more than 5 minutes) - don't show toast for old messages
      if (message.created_at) {
        const messageTime = new Date(message.created_at).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (now - messageTime > fiveMinutes) {
          console.log('Message is too old, skipping toast:', message.id);
          return;
        }
      }

      // Check if we've already shown this message (both session and persistent storage)
      if (hasMessageBeenShown(message.id) || sessionShownMessages.has(message.id)) {
        console.log('Message toast already shown for ID:', message.id);
        return;
      }

      // Mark this message as shown in both session and persistent storage
      markMessageAsShown(message.id);
      sessionShownMessages.add(message.id);

      const preview = message.content?.trim() ? message.content.slice(0, 60) : 'আপনার জন্য একটি নতুন বার্তা আছে';

      // Resolve sender name – fetch from profiles table if not included in payload
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
        // Check if we've reached the maximum concurrent toasts
        if (activeToastCount >= MAX_CONCURRENT_TOASTS) {
          console.log('Maximum concurrent toasts reached, skipping new toast');
          return;
        }

        activeToastCount++;
        playNotificationSound();

        const toastId = toast.custom(
          (t) => (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                // Navigate to the messaging thread with that sender
                navigate(`/messages?seller=${message.sender_id}`);
                toast.dismiss(t.id);
                activeToastCount = Math.max(0, activeToastCount - 1);
              }}
              className="flex w-full cursor-pointer flex-col rounded-md border bg-background p-4 shadow-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <strong className="mb-1 text-sm font-semibold">{senderName} আপনাকে একটি নতুন বার্তা পাঠিয়েছেন</strong>
              <span className="text-xs text-muted-foreground">{preview}</span>
              <span className="mt-2 inline-flex h-6 w-fit items-center justify-center rounded bg-primary px-3 text-xs font-medium text-primary-foreground">
                দেখুন
              </span>
            </div>
          ),
          {
            duration: 2000, // Changed to 2 seconds
            onDismiss: () => {
              activeToastCount = Math.max(0, activeToastCount - 1);
            },
            onAutoClose: () => {
              activeToastCount = Math.max(0, activeToastCount - 1);
            }
          },
        );
      });

    },
    !!user,
  );

  // Component itself renders nothing
  return null;
}


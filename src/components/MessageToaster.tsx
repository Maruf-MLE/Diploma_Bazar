import { useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { playNotificationSound } from '@/lib/playNotificationSound';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { supabase } from '@/lib/supabase';

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

  // Keep track of messages we've already surfaced so we don't replay toasts
  const shownIds = useRef<Set<string>>(new Set());

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
      };
      if (!message) return;
      if (shownIds.current.has(message.id)) return;
      shownIds.current.add(message.id);

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
        playNotificationSound();
        toast.custom(
          (t) => (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                // Navigate to the messaging thread with that sender
                navigate(`/messages?seller=${message.sender_id}`);
                toast.dismiss(t.id);
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
          { duration: 5000 },
        );
      });

    },
    !!user,
  );

  // Component itself renders nothing
  return null;
}


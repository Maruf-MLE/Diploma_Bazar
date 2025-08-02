import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { playNotificationSound } from "@/lib/playNotificationSound";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

/**
 * Listens for new unread notifications and shows a toast that mimics
 * a subtle mobile push-notification. The toast slides in from the right
 * (handled by Sonner's default animation) and disappears automatically.
 */
export default function NotificationToaster() {
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  // Track the IDs we've already shown to avoid duplicate toasts when state re-renders
  const shownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Only consider the most recent 10 to avoid looping through a huge list
    notifications.slice(0, 10).forEach((n) => {
      if (n.is_read) return; // Only toast unread items
      if (shownIds.current.has(n.id)) return;

      shownIds.current.add(n.id);

      playNotificationSound();
toast.custom((t) => (
        <div
          onClick={() => {
            navigate("/messages")
            toast.dismiss(t.id)
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
      ), { duration: 5000 });
    });
  }, [notifications, navigate]);

  // This component does not render anything itself
  return null;
}


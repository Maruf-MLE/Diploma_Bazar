import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Hook to set up Supabase realtime subscription for ban status changes
export function useBanStatusListener() {
  const { user, checkBanStatus } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up ban status listener for user:', user.id);
    
    // Set up realtime subscription for ban status changes
    const banChannel = supabase
      .channel('ban-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_ban_status',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('Ban status change detected:', payload);
          
          // Check if this is a ban update
          if (payload.new && typeof payload.new.is_banned === 'boolean' && payload.new.is_banned === true) {
            toast({
              title: "অ্যাকাউন্ট স্ট্যাটাস আপডেট",
              description: "আপনার অ্যাকাউন্ট স্ট্যাটাস পরিবর্তন হয়েছে। সিস্টেম আপডেট হচ্ছে...",
              variant: "destructive",
            });
            
            // Update ban status in context
            checkBanStatus();
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      console.log('Cleaning up ban status listener');
      supabase.removeChannel(banChannel);
    };
  }, [user, checkBanStatus, toast]);
} 
import { useState, useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'

type SupabaseRealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface SupabaseRealtimeConfig {
  table: string
  schema?: string
  event?: SupabaseRealtimeEvent
  filter?: string
  channelName?: string
}

/**
 * React hook for subscribing to Supabase realtime changes
 * 
 * @param config Configuration for the realtime subscription
 * @param callback Function to call when receiving updates
 * @param enabled Whether the subscription is active
 * @returns Object containing subscription, connection status, and error
 */
export function useSupabaseRealtime<T = any>(
  config: SupabaseRealtimeConfig,
  callback: (payload: any) => void,
  enabled = true
) {
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use a ref to store the latest callback to avoid dependency issues
  const callbackRef = useRef(callback);
  
  // Update the ref whenever the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (subscription) {
        console.log('Unsubscribing from channel due to disabled state');
        subscription.unsubscribe()
        setSubscription(null)
        setConnected(false)
      }
      return
    }

    console.log(`Setting up Supabase realtime for table: ${config.table}, filter: ${config.filter || 'none'}`);
    
    // Generate unique channel name if not provided
    const channelName = config.channelName || 
      `${config.table}-${config.event || '*'}-${Math.random().toString(36).substring(2, 7)}`;
    
    try {
      // Create subscription
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any, // Type assertion needed for TypeScript
          { 
            event: config.event || '*', 
            schema: config.schema || 'public', 
            table: config.table,
            filter: config.filter
          }, 
          (payload: any) => {
            console.log(`Received ${config.table} update:`, payload);
            // Use the ref to access the latest callback
            callbackRef.current(payload);
          }
        )
        .subscribe((status) => {
          console.log(`Supabase realtime subscription status for ${config.table}:`, status);
          
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to ${config.table} changes`);
            setConnected(true);
          } else {
            setConnected(false);
          }
        });
      
      setSubscription(channel);
      
      // Cleanup function
      return () => {
        console.log(`Cleaning up subscription for ${config.table}`);
        channel.unsubscribe();
        setSubscription(null);
        setConnected(false);
      };
    } catch (err) {
      console.error('Error setting up Supabase realtime subscription:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return () => {};
    }
  }, [config.table, config.event, config.schema, config.filter, config.channelName, enabled]);

  return { subscription, connected, error };
}

// Hook to set up Supabase realtime subscriptions
export function useBanStatusListener() {
  const { user, checkBanStatus } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

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
        (payload) => {
          console.log('Ban status change detected:', payload);
          
          // Check if this is a ban update
          if (payload.new && payload.new.is_banned === true) {
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
      supabase.removeChannel(banChannel);
    };
  }, [user, checkBanStatus, toast]);
} 
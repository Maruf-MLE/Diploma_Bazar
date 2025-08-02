import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

// Call types and interfaces (kept for compatibility)
export type CallType = 'audio' | 'video';

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  startTime?: Date;
  endTime?: Date;
  status: 'initiated' | 'ringing' | 'connected' | 'missed' | 'rejected' | 'ended' | 'failed';
  callType: CallType;
  callerName?: string;
  callerAvatar?: string;
  receiverName?: string;
  receiverAvatar?: string;
  durationSeconds?: number;
}

export interface CallHistoryItem {
  id: string;
  caller_id: string;
  receiver_id: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  call_type: CallType;
  created_at: string;
  caller_profile?: {
    name: string;
    avatar_url: string | null;
  };
  receiver_profile?: {
    name: string;
    avatar_url: string | null;
  };
  durationSeconds?: number;
}

// Call events
export type CallEventTypes =
  | 'incoming_call'
  | 'call_accepted'
  | 'call_rejected'
  | 'call_ended'
  | 'call_error';

/**
 * Initialize call service - simplified version
 */
export const initCallService = async (user: User) => {
  console.log('Call service disabled - using Supabase Realtime only');
  return true;
};

/**
 * Create a new call - disabled
 */
export const initiateCall = async (receiverId: string, callType: CallType): Promise<Call | null> => {
  console.log('Call feature disabled');
  return null;
};

/**
 * Accept an incoming call - disabled
 */
export const acceptCall = async (callId: string, callerId: string, callType: CallType): Promise<boolean> => {
  console.log('Call feature disabled');
  return false;
};

/**
 * Reject an incoming call - disabled
 */
export const rejectCall = (callId: string, reason?: string): void => {
  console.log('Call feature disabled');
};

/**
 * End the current call - disabled
 */
export const endCall = (): void => {
  console.log('Call feature disabled');
};

/**
 * Get the local media stream - disabled
 */
export const getLocalStream = (): MediaStream | null => {
  return null;
};

/**
 * Get the remote media stream - disabled
 */
export const getRemoteStream = (): MediaStream | null => {
  return null;
};

/**
 * Get the current call information - disabled
 */
export const getCurrentCall = (): Call | null => {
  return null;
};

/**
 * Add an event listener - disabled
 */
export const addCallEventListener = (event: CallEventTypes, callback: (data: any) => void): void => {
  console.log('Call feature disabled');
};

/**
 * Remove an event listener - disabled
 */
export const removeCallEventListener = (event: CallEventTypes, callback: (data: any) => void): void => {
  console.log('Call feature disabled');
};

/**
 * Generate offer for peer connection - disabled
 */
export const createOffer = async (): Promise<RTCSessionDescriptionInit | null> => {
  console.log('Call feature disabled');
  return null;
};

/**
 * Get call history for current user - simplified to use only Supabase
 */
export const getCallHistory = async (limit = 50): Promise<CallHistoryItem[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('calls')
      .select(`
        id,
        caller_id,
        receiver_id,
        start_time,
        end_time,
        status,
        call_type,
        created_at
      `)
      .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching call history:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch user profiles for caller and receiver
    const uniqueUserIds = new Set<string>();
    data.forEach((call: any) => {
      uniqueUserIds.add(call.caller_id);
      uniqueUserIds.add(call.receiver_id);
    });

    const userIds = Array.from(uniqueUserIds);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    const userProfiles = profiles?.reduce((acc: any, profile: any) => {
      acc[profile.id] = profile;
      return acc;
    }, {}) || {};

    // Add profile data and calculate duration
    return data.map((call: any) => {
      const startTime = call.start_time ? new Date(call.start_time) : null;
      const endTime = call.end_time ? new Date(call.end_time) : null;

      const durationSeconds = startTime && endTime 
        ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) 
        : 0;

      return {
        ...call,
        caller_profile: userProfiles[call.caller_id],
        receiver_profile: userProfiles[call.receiver_id],
        durationSeconds
      };
    });
  } catch (error) {
    console.error('Error fetching call history:', error);
    return [];
  }
};

/**
 * Clean up resources - simplified
 */
export const disconnectCallService = (): void => {
  console.log('Call service cleanup completed');
};

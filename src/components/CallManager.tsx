import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import VideoCallDialog from './VideoCallDialog';
import CallHistoryDialog from './CallHistoryDialog';
import {
  Call,
  CallType,
  addCallEventListener,
  removeCallEventListener,
  initCallService,
  disconnectCallService,
  getCurrentCall,
  acceptCall,
  rejectCall,
  initiateCall
} from '@/lib/CallService';
import { supabase } from '@/lib/supabase';

export interface CallManagerProps {
  children?: React.ReactNode;
}

const CallManager: React.FC<CallManagerProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Call state
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [isIncoming, setIsIncoming] = useState(false);
  const [profileData, setProfileData] = useState<{ [key: string]: any }>({});
  
  // Initialize call service when user logs in
  useEffect(() => {
    if (user) {
      console.log('Initializing call service...');
      initCallService(user)
        .then(() => {
          console.log('Call service initialized.');
          setupCallEventListeners();
        })
        .catch(error => {
          console.error('Failed to initialize call service:', error);
        });
    }
    
    return () => {
      console.log('Cleaning up call service...');
      disconnectCallService();
    };
  }, [user]);
  
  // Set up event listeners for call events
  const setupCallEventListeners = () => {
    // Incoming call handler
    const handleIncomingCall = async (data: any) => {
      console.log('Incoming call:', data);
      const { callerId, callType, callId } = data;
      
      // Fetch caller profile data
      const callerProfile = await fetchUserProfile(callerId);
      
      // Create call object
      const call: Call = {
        id: callId,
        callerId,
        receiverId: user?.id || '',
        status: 'ringing',
        callType: callType as CallType,
        callerName: callerProfile?.name || 'অজানা ব্যবহারকারী',
        callerAvatar: callerProfile?.avatar_url
      };
      
      // Set call state
      setCurrentCall(call);
      setCallStatus('ringing');
      setIsIncoming(true);
      setCallDialogOpen(true);
      
      // Show toast notification
      toast({
        title: 'ইনকামিং কল',
        description: `${callerProfile?.name || 'অজানা ব্যবহারকারী'} থেকে ${callType === 'video' ? 'ভিডিও' : 'অডিও'} কল`,
        duration: 8000,
      });
    };
    
    // Call accepted handler
    const handleCallAccepted = (data: any) => {
      console.log('Call accepted:', data);
      setCallStatus('connected');
      
      // Update currentCall with remoteStream if provided
      if (data.remoteStream) {
        setCurrentCall(prevCall => {
          if (!prevCall) return null;
          return { ...prevCall };
        });
      }
    };
    
    // Call rejected handler
    const handleCallRejected = (data: any) => {
      console.log('Call rejected:', data);
      toast({
        title: 'কল রিজেক্ট করা হয়েছে',
        description: data.reason || 'রিসিভার কল রিজেক্ট করেছেন',
        variant: 'destructive',
      });
      
      setCallDialogOpen(false);
      setCurrentCall(null);
      setCallStatus('ended');
    };
    
    // Call ended handler
    const handleCallEnded = (data: any) => {
      console.log('Call ended:', data);
      
      if (callDialogOpen) {
        toast({
          title: 'কল শেষ হয়েছে',
          description: data.reason || 'কল শেষ হয়েছে',
        });
      }
      
      setCallDialogOpen(false);
      setCurrentCall(null);
      setCallStatus('ended');
    };
    
    // Call error handler
    const handleCallError = (data: any) => {
      console.error('Call error:', data);
      toast({
        title: 'কল এরর',
        description: data.message || 'কল সংযোগে সমস্যা হচ্ছে',
        variant: 'destructive',
      });
      
      setCallDialogOpen(false);
      setCurrentCall(null);
      setCallStatus('ended');
    };
    
    // Register event listeners
    addCallEventListener('incoming_call', handleIncomingCall);
    addCallEventListener('call_accepted', handleCallAccepted);
    addCallEventListener('call_rejected', handleCallRejected);
    addCallEventListener('call_ended', handleCallEnded);
    addCallEventListener('call_error', handleCallError);
    
    // Cleanup function to remove event listeners
    return () => {
      removeCallEventListener('incoming_call', handleIncomingCall);
      removeCallEventListener('call_accepted', handleCallAccepted);
      removeCallEventListener('call_rejected', handleCallRejected);
      removeCallEventListener('call_ended', handleCallEnded);
      removeCallEventListener('call_error', handleCallError);
    };
  };
  
  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    if (profileData[userId]) {
      return profileData[userId];
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Cache profile data
        setProfileData(prev => ({
          ...prev,
          [userId]: data
        }));
        
        return data;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    
    return null;
  };
  
  // Handle initiating a new call
  const handleInitiateCall = async (receiverId: string, callType: CallType = 'audio') => {
    if (!user) return;
    
    try {
      // Fetch receiver profile data
      const receiverProfile = await fetchUserProfile(receiverId);
      
      // Create temporary call object
      const tempCall: Call = {
        id: 'temp',
        callerId: user.id,
        receiverId,
        status: 'initiated',
        callType,
        receiverName: receiverProfile?.name || 'অজানা ব্যবহারকারী',
        receiverAvatar: receiverProfile?.avatar_url
      };
      
      // Show call dialog
      setCurrentCall(tempCall);
      setCallStatus('ringing');
      setIsIncoming(false);
      setCallDialogOpen(true);
      
      // Initiate call
      const call = await initiateCall(receiverId, callType);
      
      if (call) {
        setCurrentCall({
          ...tempCall,
          id: call.id
        });
      } else {
        throw new Error('Failed to initiate call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: 'কল ইনিশিয়েট করতে ব্যর্থ',
        description: 'কল করতে সমস্যা হচ্ছে, আবার চেষ্টা করুন',
        variant: 'destructive',
      });
      
      setCallDialogOpen(false);
      setCurrentCall(null);
    }
  };
  
  // Accept an incoming call
  const handleAcceptCall = async () => {
    if (!currentCall) return;
    
    try {
      const accepted = await acceptCall(
        currentCall.id,
        currentCall.callerId,
        currentCall.callType
      );
      
      if (accepted) {
        setCallStatus('connected');
      } else {
        throw new Error('Failed to accept call');
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: 'কল একসেপ্ট করতে ব্যর্থ',
        description: 'কল একসেপ্ট করতে সমস্যা হচ্ছে',
        variant: 'destructive',
      });
      
      setCallDialogOpen(false);
      setCurrentCall(null);
    }
  };
  
  // Reject an incoming call
  const handleRejectCall = () => {
    if (!currentCall) return;
    
    try {
      rejectCall(currentCall.id);
      setCallDialogOpen(false);
      setCurrentCall(null);
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };
  
  // Close call dialog
  const handleCloseCallDialog = () => {
    setCallDialogOpen(false);
    
    // Wait a bit before clearing call state to allow animations to complete
    setTimeout(() => {
      setCurrentCall(null);
      setCallStatus('ended');
    }, 300);
  };
  
  // Toggle call history dialog
  const toggleCallHistory = () => {
    setHistoryDialogOpen(!historyDialogOpen);
  };
  
  // Call a user from call history
  const handleCallUserFromHistory = (userId: string) => {
    setHistoryDialogOpen(false);
    
    // Wait a bit before initiating call to allow dialog to close
    setTimeout(() => {
      handleInitiateCall(userId);
    }, 300);
  };
  
  // Provide call functions to children components
  const callContextValue = {
    initiateCall: handleInitiateCall,
    showCallHistory: toggleCallHistory
  };
  
  return (
    <>
      {/* Render children with call context */}
      {children}
      
      {/* Call dialog */}
      <VideoCallDialog
        call={currentCall}
        isOpen={callDialogOpen}
        onClose={handleCloseCallDialog}
        status={callStatus}
        isIncoming={isIncoming}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
      
      {/* Call history dialog */}
      <CallHistoryDialog
        isOpen={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        onCallUser={handleCallUserFromHistory}
      />
    </>
  );
};

// Export the component
export default CallManager; 
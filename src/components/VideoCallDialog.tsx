import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  User,
  X
} from 'lucide-react';
import {
  Call,
  CallType,
  getLocalStream,
  getRemoteStream,
  endCall
} from '@/lib/CallService';

interface VideoCallDialogProps {
  call: Call | null;
  isOpen: boolean;
  onClose: () => void;
  status: 'ringing' | 'connected' | 'ended';
  isIncoming?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

const VideoCallDialog = ({
  call,
  isOpen,
  onClose,
  status,
  isIncoming = false,
  onAccept,
  onReject
}: VideoCallDialogProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callDurationRef = useRef<NodeJS.Timeout | null>(null);

  // Handle local stream display
  useEffect(() => {
    const attachLocalStream = () => {
      const localStream = getLocalStream();
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    };

    if (isOpen) {
      attachLocalStream();
    }

    return () => {
      // Cleanup if component unmounts
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
      }
    };
  }, [isOpen]);

  // Handle remote stream display
  useEffect(() => {
    const attachRemoteStream = () => {
      const remoteStream = getRemoteStream();
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    if (status === 'connected') {
      attachRemoteStream();
      
      // Start call duration timer
      if (!callDurationRef.current) {
        callDurationRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      }
    }

    return () => {
      // Clear timer when status changes from connected
      if (status !== 'connected' && callDurationRef.current) {
        clearInterval(callDurationRef.current);
        callDurationRef.current = null;
      }
    };
  }, [status]);

  // Handle cleanup on dialog close
  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current);
        callDurationRef.current = null;
      }
    }
  }, [isOpen]);

  // Toggle audio mute
  const toggleAudio = () => {
    const localStream = getLocalStream();
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    const localStream = getLocalStream();
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle call end
  const handleEndCall = () => {
    endCall();
    onClose();
  };

  // Conditionally render video elements based on call type
  const renderVideoElements = () => {
    const isVideoCall = call?.callType === 'video';
    
    return (
      <div className="relative w-full h-full">
        {/* Remote video (big) */}
        {isVideoCall && status === 'connected' && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-lg"
          />
        )}
        
        {/* Local video (small) */}
        {isVideoCall && (
          <div className="absolute bottom-4 right-4 w-28 h-40 overflow-hidden rounded-lg border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Audio call display or video loading state */}
        {(!isVideoCall || status !== 'connected') && (
          <div className="flex flex-col items-center justify-center h-full bg-muted/20 rounded-lg">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={call?.receiverAvatar || call?.callerAvatar} alt="User" />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold mb-2">
              {call?.receiverName || call?.callerName || 'User'}
            </h3>
            {status === 'connected' ? (
              <p className="text-muted-foreground">{formatDuration(callDuration)}</p>
            ) : isIncoming ? (
              <p className="text-primary animate-pulse">কল আসছে...</p>
            ) : (
              <p className="text-muted-foreground animate-pulse">কল করা হচ্ছে...</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl" hideCloseButton>
        <div className="flex flex-col h-[70vh] max-h-[600px]">
          <div className="flex-1 overflow-hidden rounded-lg">
            {renderVideoElements()}
          </div>
          
          <div className="mt-4 flex justify-center space-x-4">
            {/* Call controls */}
            {status === 'connected' && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={toggleAudio}
                >
                  {isAudioMuted ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
                
                {call?.callType === 'video' && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? (
                      <VideoOff className="h-6 w-6" />
                    ) : (
                      <Video className="h-6 w-6" />
                    )}
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* Incoming call controls */}
            {status === 'ringing' && isIncoming && (
              <>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={onReject}
                >
                  <X className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="success"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white"
                  onClick={onAccept}
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* Outgoing call controls */}
            {status === 'ringing' && !isIncoming && (
              <Button
                variant="destructive"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallDialog; 
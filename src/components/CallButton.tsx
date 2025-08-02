import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Video } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { CallType, initiateCall } from '@/lib/CallService';
import { useAuth } from '@/contexts/AuthContext';
import { useVerificationCheck } from '@/lib/verification';

interface CallButtonProps {
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  onCallInitiated: (callType: CallType) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  iconOnly?: boolean;
  iconSize?: number;
}

const CallButton: React.FC<CallButtonProps> = ({
  receiverId,
  receiverName,
  receiverAvatar,
  onCallInitiated,
  size = 'md',
  variant = 'outline',
  className = '',
  iconOnly = false,
  iconSize
}) => {
  const { user } = useAuth();
  const { checkAndShowWarning } = useVerificationCheck();
  const [isInitiating, setIsInitiating] = useState(false);

  const handleCallInitiate = async (callType: CallType) => {
    if (!user) return;
    
    setIsInitiating(true);
    
    try {
      // First check if user is verified
      const isVerified = await checkAndShowWarning(user.id, 'call');
      if (!isVerified) {
        setIsInitiating(false);
        return;
      }
      
      // Start call
      const call = await initiateCall(receiverId, callType);
      
      if (call) {
        onCallInitiated(callType);
      } else {
        console.error('Failed to initiate call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
    } finally {
      setIsInitiating(false);
    }
  };

  // Define button sizes
  const buttonSizes = {
    sm: { button: iconOnly ? 'h-8 w-8 p-0' : 'h-7 px-3', icon: 'h-4 w-4' },
    md: { button: iconOnly ? 'h-9 w-9 p-0' : 'h-9 px-4', icon: 'h-5 w-5' },
    lg: { button: iconOnly ? 'h-10 w-10 p-0' : 'h-10 px-5', icon: 'h-6 w-6' }
  };

  const buttonSize = buttonSizes[size];
  
  // Use custom icon size if provided
  const iconClassName = iconSize ? `h-${iconSize/4} w-${iconSize/4}` : buttonSize.icon;

  // Custom button style based on variant
  let buttonStyle = className;
  if (variant === 'outline' && !className.includes('border-')) {
    buttonStyle += ' border-blue-400 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-medium';
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          className={`${buttonSize.button} ${buttonStyle}`}
          disabled={isInitiating}
          title="কল করুন"
        >
          <Phone className={iconSize ? `h-${iconSize/4} w-${iconSize/4}` : buttonSize.icon} style={iconSize ? {width: `${iconSize}px`, height: `${iconSize}px`} : {}} />
          {!iconOnly && (
            <>
              <span className="ml-2">কল</span>
              {isInitiating && (
                <span className="ml-2 animate-pulse">...</span>
              )}
            </>
          )}
          {iconOnly && isInitiating && (
            <span className="absolute top-0 right-0 h-2 w-2 bg-blue-600 rounded-full animate-ping"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleCallInitiate('audio')} className="hover:bg-blue-100 cursor-pointer">
          <Phone className="mr-2 h-4 w-4" />
          <span>অডিও কল</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCallInitiate('video')} className="hover:bg-blue-100 cursor-pointer">
          <Video className="mr-2 h-4 w-4" />
          <span>ভিডিও কল</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CallButton;
 
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { CallHistoryItem, getCallHistory } from '@/lib/CallService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Video,
  Clock,
  User,
  X
} from 'lucide-react';

interface CallHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCallUser: (userId: string) => void;
}

const CallHistoryDialog: React.FC<CallHistoryDialogProps> = ({
  isOpen,
  onClose,
  onCallUser
}) => {
  const { user } = useAuth();
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'missed' | 'outgoing' | 'incoming'>('all');
  
  // Load call history when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      loadCallHistory();
    }
  }, [isOpen, user]);
  
  // Load call history from server
  const loadCallHistory = async () => {
    setLoading(true);
    try {
      const history = await getCallHistory();
      setCallHistory(history);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format timestamp to local date and time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Format call duration in mm:ss
  const formatDuration = (seconds: number) => {
    if (!seconds) return '০০:০০';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get filtered calls based on active tab
  const getFilteredCalls = () => {
    if (activeTab === 'all') return callHistory;
    
    if (activeTab === 'missed') {
      return callHistory.filter(call => 
        call.status === 'missed' || 
        (call.status === 'rejected' && call.receiver_id === user?.id)
      );
    }
    
    if (activeTab === 'outgoing') {
      return callHistory.filter(call => call.caller_id === user?.id);
    }
    
    if (activeTab === 'incoming') {
      return callHistory.filter(call => call.receiver_id === user?.id);
    }
    
    return callHistory;
  };
  
  // Render call direction icon
  const renderCallIcon = (call: CallHistoryItem) => {
    const isOutgoing = call.caller_id === user?.id;
    const isMissed = call.status === 'missed' || call.status === 'rejected';
    const isVideo = call.call_type === 'video';
    
    if (isOutgoing) {
      return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
    } else if (isMissed) {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    } else {
      return <PhoneIncoming className="h-4 w-4 text-green-500" />;
    }
  };
  
  // Get the name and avatar of the other person in the call
  const getOtherPartyDetails = (call: CallHistoryItem) => {
    const isOutgoing = call.caller_id === user?.id;
    const profile = isOutgoing ? call.receiver_profile : call.caller_profile;
    
    return {
      name: profile?.name || 'অজানা ব্যবহারকারী',
      avatar: profile?.avatar_url || undefined,
      id: isOutgoing ? call.receiver_id : call.caller_id
    };
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>কল ইতিহাস</DialogTitle>
        </DialogHeader>
        
        <Tabs 
          defaultValue="all" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">সব</TabsTrigger>
            <TabsTrigger value="missed">মিসড</TabsTrigger>
            <TabsTrigger value="incoming">ইনকামিং</TabsTrigger>
            <TabsTrigger value="outgoing">আউটগোয়িং</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[60vh] max-h-[500px] pr-4">
              {loading ? (
                // Loading state
                Array(5).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 py-4 border-b">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))
              ) : getFilteredCalls().length === 0 ? (
                // No calls
                <div className="py-8 text-center text-muted-foreground">
                  কোন কল রেকর্ড নেই
                </div>
              ) : (
                // Call list
                getFilteredCalls().map((call) => {
                  const otherParty = getOtherPartyDetails(call);
                  return (
                    <div 
                      key={call.id}
                      className="flex items-center py-3 border-b hover:bg-muted/20 rounded-md px-2 cursor-pointer"
                      onClick={() => onCallUser(otherParty.id)}
                    >
                      <div className="flex-shrink-0 mr-3">
                        <Avatar>
                          <AvatarImage src={otherParty.avatar} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium">{otherParty.name}</span>
                          <div className="ml-2">
                            {renderCallIcon(call)}
                          </div>
                          {call.call_type === 'video' && (
                            <Video className="h-4 w-4 ml-1 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatTimestamp(call.created_at)}</span>
                          
                          {call.status === 'connected' && call.durationSeconds && call.durationSeconds > 0 && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{formatDuration(call.durationSeconds)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CallHistoryDialog; 
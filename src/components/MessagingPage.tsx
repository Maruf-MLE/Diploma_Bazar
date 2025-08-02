import CallButton from '@/components/CallButton';
import { useCall } from '@/contexts/CallContext';

const MessagingPage = () => {
  const { initiateCall, showCallHistory } = useCall();
  
  const handleCallUser = async (callType) => {
    if (selectedReceiverId) {
      try {
        await initiateCall(selectedReceiverId, callType);
      } catch (error) {
        console.error('Failed to initiate call:', error);
      }
    }
  };

  {selectedChat && (
    <div className="flex-1">
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setShowMobileSidebar(true)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentConversation?.user?.avatar_url || undefined} />
            <AvatarFallback>
              {currentConversation?.user?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium leading-none">{currentConversation?.user?.name || 'অজানা ব্যবহারকারী'}</h3>
            {bookDetails && (
              <p className="text-sm text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 inline-block mr-1" />
                {bookDetails.title}
              </p>
            )}
          </div>
        </div>
        
        {/* Add call button here */}
        <div className="flex items-center gap-2">
          <CallButton 
            receiverId={selectedReceiverId || ''}
            receiverName={currentConversation?.user?.name}
            receiverAvatar={currentConversation?.user?.avatar_url}
            onCallInitiated={handleCallUser}
            size="sm"
            variant="ghost"
          />
          {selectedBookId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBookSelectionOpen(true)}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              বইয়ের তথ্য
            </Button>
          )}
        </div>
      </div>
      
      {/* Rest of the conversation component */}
      {/* ... */}
    </div>
  )}

  // ... rest of the component ...
} 
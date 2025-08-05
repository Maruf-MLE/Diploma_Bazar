import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, User, CheckCircle, MessageCircle, Loader2, BookOpen, Clock, Calendar, Check, CheckCheck, ChevronDown, ArrowDown, Image, Paperclip, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCall } from '@/contexts/CallContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
// Navigation component removed from messaging page
import { 
  getUserConversations, 
  getConversationMessages, 
  sendMessage, 
  subscribeToMessages,
  subscribeToPurchaseRequests,
  getBookDetails,
  Conversation,
  Message,
  PurchaseRequest,
  markMessageAsDelivered,
  markMessageAsRead,
  markAllMessagesAsRead,
  directMarkMessagesAsRead,
  countUnreadMessages,
  sendMessageWithFile,
  getFileFromStorage
} from '@/lib/MessageService';
import { BookEntity } from '@/lib/BookEntity';
import { Skeleton } from '@/components/ui/skeleton';
import CallButton from '@/components/CallButton';
import { Separator } from '@/components/ui/separator';
import AvailableBooksDialog from '@/components/AvailableBooksDialog';
import BookRequestButton from '@/components/BookRequestButton';
import { supabase } from '@/lib/supabase';
import BookPurchaseRequestCard from '@/components/BookPurchaseRequestCard';
import { useVerificationCheck } from '@/lib/verification';
import ImageViewer from '@/components/ImageViewer';
import { Textarea } from '@/components/ui/textarea';

// Message status component
const MessageStatus = ({ status }: { status?: string }) => {
  if (!status || status === 'sent') {
    return <Check className="h-3 w-3 text-muted-foreground" />;
  } else if (status === 'delivered') {
    return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
  } else if (status === 'read') {
    return <CheckCheck className="h-3 w-3 text-primary" />;
  }
  return null;
};

// Add a memoized image attachment component to prevent re-rendering
const ImageAttachment = React.memo(({ imageUrl }: { imageUrl: string }) => {
  console.log('Rendering memoized image attachment:', imageUrl);
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [finalUrl, setFinalUrl] = useState(imageUrl);
  const [retryCount, setRetryCount] = useState(0);
  const [usingObjectUrl, setUsingObjectUrl] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const revokeRef = useRef<(() => void) | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const imgCacheKey = `img_cache_${imageUrl.split('/').pop()}`;
  
  // Cleanup object URL when component unmounts
  useEffect(() => {
    return () => {
      if (objectUrlRef.current && revokeRef.current) {
        console.log('Revoking object URL:', objectUrlRef.current);
        revokeRef.current();
      }
    };
  }, []);

  // Check localStorage for cached image URL
  useEffect(() => {
    const cachedUrl = localStorage.getItem(imgCacheKey);
    if (cachedUrl) {
      console.log('Found cached image URL:', cachedUrl);
      setFinalUrl(cachedUrl);
    }
  }, [imgCacheKey]);
  
  // Check and fix URL on component mount
  useEffect(() => {
    // Process the URL to ensure it works
    let processedUrl = imageUrl;
    
    // Force HTTPS for Supabase URLs if they're using HTTP
    if (processedUrl.startsWith('http://') && processedUrl.includes('supabase')) {
      processedUrl = processedUrl.replace('http://', 'https://');
    }
    
    // Remove any query parameters that might cause caching issues
    if (processedUrl.includes('?')) {
      processedUrl = processedUrl.split('?')[0];
    }
    
    setFinalUrl(processedUrl);
    console.log('Initial image URL set to:', processedUrl);
    
    // Try to download directly from storage first
    const downloadFromStorage = async () => {
      if (processedUrl.includes('/storage/v1/object/public/')) {
        try {
          console.log('Attempting to download image directly from storage');
          const result = await getFileFromStorage(processedUrl);
          
          if (result.success && result.objectUrl) {
            console.log('Successfully downloaded image from storage, using object URL:', result.objectUrl);
            setFinalUrl(result.objectUrl);
            setUsingObjectUrl(true);
            objectUrlRef.current = result.objectUrl;
            revokeRef.current = result.revoke;
            setLoadingState('success');
            
            // Store in localStorage for future use (store the original URL though, not the object URL)
            localStorage.setItem(imgCacheKey, processedUrl);
            return true;
          } else {
            console.error('Failed to download from storage directly:', result.error);
          }
        } catch (error) {
          console.error('Error downloading from storage:', error);
        }
      }
      return false;
    };
    
    // Try to get a signed URL if it's a Supabase storage URL
    const createSignedUrl = async () => {
      try {
        if (processedUrl.includes('/storage/v1/object/public/')) {
          const parts = processedUrl.split('/storage/v1/object/public/');
          if (parts.length > 1) {
            const bucketAndPath = parts[1].split('/', 1);
            const bucket = bucketAndPath[0];
            const objectPath = parts[1].substring(bucket.length + 1);
            
            console.log(`Trying to get signed URL for bucket: ${bucket}, path: ${objectPath}`);
            
            const { data, error } = await supabase.storage
              .from(bucket)
              .createSignedUrl(objectPath, 60*60); // 1 hour expiration
              
            if (data?.signedUrl) {
              console.log('Created signed URL:', data.signedUrl);
              setFinalUrl(data.signedUrl);
              setLoadingState('success');
              // Cache the signed URL
              localStorage.setItem(imgCacheKey, data.signedUrl);
              return true;
            } else {
              console.error('Error creating signed URL:', error);
            }
          }
        }
        return false;
      } catch (error) {
        console.error('Error creating signed URL:', error);
        return false;
      }
    };
    
    // Try direct download first, if fails try signed URL, finally fall back to normal image loading
    downloadFromStorage().then(success => {
      if (!success) {
        // If direct download failed, try to get a signed URL
        createSignedUrl().then(signedSuccess => {
          if (!signedSuccess) {
            // If both methods failed, try normal image loading
            console.log('Falling back to normal image loading');
            // Create new image element for preloading
            const preloadImg = document.createElement('img');
            preloadImg.src = processedUrl;
            preloadImg.crossOrigin = "anonymous";
            preloadImg.onload = () => {
              console.log('Image preloaded successfully:', processedUrl);
              setLoadingState('success');
              // Cache successful URL
              localStorage.setItem(imgCacheKey, processedUrl);
            };
            preloadImg.onerror = () => {
              console.error('Error preloading image:', processedUrl);
              tryAlternativeUrl();
            };
          }
        });
      }
    });
  }, [imageUrl, imgCacheKey]);
  
  // Function to try alternative URL formats
  const tryAlternativeUrl = () => {
    if (retryCount >= 3) {
      console.error('Maximum retry attempts reached for image:', imageUrl);
      setLoadingState('error');
      return false;
    }
    
    let newUrl = imageUrl;
    
    // First try: Force HTTPS
    if (retryCount === 0 && newUrl.startsWith('http://')) {
      newUrl = newUrl.replace('http://', 'https://');
    } 
    // Second try: Add timestamp to bypass cache
    else if (retryCount === 1) {
      newUrl = `${imageUrl}?t=${Date.now()}`;
    }
    // Third try: Try direct storage URL format
    else if (retryCount === 2 && newUrl.includes('/storage/v1/object/public/')) {
      // Try to get a signed URL instead
      const parts = newUrl.split('/storage/v1/object/public/');
      if (parts.length > 1) {
        const bucketAndPath = parts[1].split('/', 1);
        const bucket = bucketAndPath[0];
        const objectPath = parts[1].substring(bucket.length + 1);
        
        // Try to create a signed URL (which may work better than public URL)
        supabase.storage
          .from(bucket)
          .createSignedUrl(objectPath, 60) // 60 seconds expiration
          .then(({ data, error }) => {
            if (data?.signedUrl) {
              console.log('Created signed URL:', data.signedUrl);
              setFinalUrl(data.signedUrl);
              // Cache successful URL
              localStorage.setItem(imgCacheKey, data.signedUrl);
            } else {
              console.error('Error creating signed URL:', error);
              setLoadingState('error');
            }
          })
          .catch(err => {
            console.error('Exception creating signed URL:', err);
            setLoadingState('error');
          });
          
        return true;
      }
    }
    
    if (newUrl !== imageUrl) {
      console.log(`Retry ${retryCount + 1}: Trying alternative URL:`, newUrl);
      setFinalUrl(newUrl);
      setRetryCount(prev => prev + 1);
      return true;
    }
    
    setLoadingState('error');
    return false;
  };
  
  // Open image viewer on click
  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewerOpen(true);
  };
  
  return (
    <>
      <div className="mt-2 rounded-md overflow-hidden max-w-[240px] border border-muted">
        {loadingState === 'loading' && (
          <div className="w-full h-[150px] bg-muted flex items-center justify-center">
            <div className="animate-pulse text-primary text-sm">ছবি লোড হচ্ছে...</div>
          </div>
        )}
        
        <img 
          src={finalUrl} 
          alt="Image attachment" 
          className={`w-full h-auto max-h-[240px] object-contain cursor-pointer ${loadingState === 'loading' ? 'hidden' : ''}`}
          onClick={handleImageClick}
          onLoad={() => {
            console.log('Image loaded successfully:', finalUrl);
            setLoadingState('success');
            // Store successful URL in localStorage
            if (!usingObjectUrl) {
              localStorage.setItem(imgCacheKey, finalUrl);
            }
          }}
          onError={(e) => {
            console.error('Image failed to load:', finalUrl);
            
            // Try alternative URL formats if we're not already using an object URL
            if (!usingObjectUrl && tryAlternativeUrl()) {
              // Will try again with new URL
            } else {
              // If all retries fail, show fallback image
              setLoadingState('error');
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBmYWlsZWQgdG8gbG9hZDwvdGV4dD48L3N2Zz4=';
              e.currentTarget.style.maxHeight = '150px';
              e.currentTarget.classList.remove('hidden');
            }
          }}
          crossOrigin="anonymous" // Add CORS attribute to help with CORS issues
        />
        
        <div className="p-1 bg-muted/30 text-xs text-center">
          <button 
            className="text-primary underline hover:text-primary-focus w-full"
            onClick={handleImageClick}
          >
            ছবি দেখুন
          </button>
        </div>
      </div>
      
      {/* Image Viewer Modal */}
      <ImageViewer 
        imageUrl={usingObjectUrl ? finalUrl : imageUrl}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        altText="Image attachment"
      />
    </>
  );
});

// Prevent unnecessary re-renders
ImageAttachment.displayName = 'ImageAttachment';

const MessagingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { checkAndShowWarning } = useVerificationCheck();
  const { initiateCall } = useCall();
  
  // Handle call initiation
  const handleCallUser = async (callType) => {
    if (selectedReceiverId) {
      try {
        // Verify user before allowing calls
        const isVerified = await checkAndShowWarning(user?.id || '', 'message');
        if (!isVerified) return;
        
        await initiateCall(selectedReceiverId, callType);
      } catch (error) {
        console.error('Failed to initiate call:', error);
        toast({
          title: 'কল করতে সমস্যা হচ্ছে',
          description: 'দয়া করে আবার চেষ্টা করুন',
          variant: 'destructive',
        });
      }
    }
  };
  
  // States
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(true); // Default to showing sidebar on mobile
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bookDetails, setBookDetails] = useState<BookEntity | null>(null);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  
  // Enhanced scroll management state for WhatsApp/Messenger style behavior
  const [userScrolling, setUserScrolling] = useState(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
const [newMessageCount, setNewMessageCount] = useState(0);
const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);
const scrollBehaviorRef = useRef<'auto' | 'smooth'>('auto');

  const isInitialLoad = useRef(true);
  const lastMessageCount = useRef(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Loading states
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // Dialog states
  const [isBookSelectionOpen, setIsBookSelectionOpen] = useState(false);

  // Create a ref for the message input field
  const messageInputRef = useRef<HTMLInputElement>(null);
  const conversationsScrollRef = useRef<HTMLDivElement>(null);
  
  // Track if a new message was just sent
  const justSentMessage = useRef(false);

  // Add file upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  
  // Add a ref to track the current page path
  const currentPathRef = useRef<string>(location.pathname);
  
  // Add an effect to reset selection when navigating away from the messages page
  useEffect(() => {
    // Check if we're navigating away from the messages page
    if (location.pathname !== '/messages' && currentPathRef.current === '/messages') {
      console.log('Navigating away from messages page, resetting selection');
      setSelectedChat(null);
      setSelectedReceiverId(null);
      setSelectedBookId(null);
      setMessages([]);
      setShowMobileSidebar(true);
    }
    
    // Update the current path ref
    currentPathRef.current = location.pathname;
    
    // If we're coming back to the messages page, ensure sidebar is shown on mobile
    if (location.pathname === '/messages' && window.innerWidth < 768) {
      setShowMobileSidebar(true);
    }
  }, [location.pathname]);
  
  // Reset selection when component unmounts
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts
      console.log('MessagingPage unmounting, resetting selection');
      setSelectedChat(null);
      setSelectedReceiverId(null);
      setSelectedBookId(null);
      setMessages([]);
    };
  }, []);
  
  // Add a useEffect to update unread message count when the component mounts
  useEffect(() => {
    if (user) {
      console.log('MessagingPage mounted, updating unread message count');
      
      // Initial count only - no periodic refresh
      (async () => {
        try {
          // Directly query the database
          const { data, error } = await supabase
            .from('messages')
            .select('id')
            .eq('receiver_id', user.id)
            .not('status', 'eq', 'read');
          
          if (error) {
            console.error('Error checking unread messages:', error);
            return;
          }
          
          const count = data ? data.length : 0;
          console.log('Initial unread message count:', count);
          setUnreadMessageCount(count);
        } catch (error) {
          console.error('Error counting unread messages:', error);
        }
      })();
    }
  }, [user]);

  // Listen for messages-marked-read custom event
  useEffect(() => {
    const handleMessagesMarkedRead = (event: any) => {
      console.log('Received messages-marked-read event in MessagingPage:', event.detail);
      
      // Update local unread count
      fetchUnreadMessageCount();
      
      // If the marked messages are from the current conversation, update local message status
      if (event.detail && event.detail.senderId === selectedReceiverId && user) {
        console.log('Updating local message status for current conversation');
        
        // Update local message status
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            (!msg.isOwn && msg.status !== 'read')
              ? { ...msg, status: 'read' }
              : msg
          )
        );
      }
    };
    
    window.addEventListener('messages-marked-read', handleMessagesMarkedRead as EventListener);
    
    return () => {
      window.removeEventListener('messages-marked-read', handleMessagesMarkedRead as EventListener);
    };
  }, [selectedReceiverId, user]);

  // যখন কনভারসেশন লোড হয় কিন্তু কোনো সিলেক্টেড চ্যাট না থাকে
  useEffect(() => {
    if (conversations.length > 0 && !selectedChat && !loadingConversations) {
      // On mobile, don't auto-select any conversation
      if (window.innerWidth < 768) {
        return;
      }
      
      // On desktop, select the first conversation
      handleSelectConversation(conversations[0]);
    }
  }, [conversations, selectedChat, loadingConversations]);

  // Parse URL query parameters on initial load - updated for mobile view
  useEffect(() => {
    if (!user) return;
    
    const params = new URLSearchParams(location.search);
    const sellerId = params.get('seller');
    const bookId = params.get('bookId');
    const initialMessage = params.get('initialMessage');
    
    console.log('MessagingPage - URL params:', { sellerId, bookId, initialMessage });
    console.log('MessagingPage - Full URL:', location.pathname + location.search);
    
    // For mobile devices, always show conversations list first and don't auto-select conversation
    if (window.innerWidth < 768) {
      setShowMobileSidebar(true);
      
      // Still load data in the background for when user selects the conversation
      if (sellerId) {
        // Set the data but don't change the UI
        setSelectedReceiverId(sellerId);
        const conversationId = [user.id, sellerId].sort().join('_');
        setSelectedChat(conversationId);
        
        if (bookId) {
          setSelectedBookId(bookId);
          fetchBookDetails(bookId);
          fetchPurchaseRequests(bookId);
        }
        
        // Preload messages but don't show them
        fetchMessages(user.id, sellerId, bookId || undefined);
        
        if (initialMessage) {
          try {
            const decodedMessage = decodeURIComponent(initialMessage);
            setNewMessage(decodedMessage);
          } catch (error) {
            console.error('Error decoding initial message:', error);
          }
        }
      }
    } else {
      // Desktop behavior - unchanged
      if (sellerId) {
        console.log('MessagingPage - Setting selected receiver ID:', sellerId);
        setSelectedReceiverId(sellerId);
        
        // Create a conversation ID from the two user IDs (sorted to ensure consistency)
        const conversationId = [user.id, sellerId].sort().join('_');
        console.log('MessagingPage - Setting selected chat ID:', conversationId);
        setSelectedChat(conversationId);
        
        // If bookId is provided, set it and load book details
        if (bookId) {
          setSelectedBookId(bookId);
          fetchBookDetails(bookId);
          
          // বই আইডি থাকলে বই কেনার অনুরোধগুলোও লোড করা
          fetchPurchaseRequests(bookId);
        }
        
        // Load messages for this conversation
        fetchMessages(user.id, sellerId, bookId || undefined);
        
        // If initialMessage is provided, set it and focus the input
        if (initialMessage) {
          try {
            const decodedMessage = decodeURIComponent(initialMessage);
            console.log('Setting initial message:', decodedMessage);
            setNewMessage(decodedMessage);
          
            // Focus the message input with some delay to ensure the component is rendered
            setTimeout(() => {
              if (messageInputRef.current) {
                messageInputRef.current.focus();
              }
            }, 500);
          } catch (error) {
            console.error('Error decoding initial message:', error);
          }
        }
        
        // On desktop, when a conversation is selected via URL, show the message section
        setShowMobileSidebar(false);
      } else {
        console.log('MessagingPage - No seller ID in URL params');
        
        // Always show the sidebar when no conversation is selected
        setShowMobileSidebar(true);
      }
    }
    
    // Load all conversations
    fetchConversations();
    
    // Get unread message count
    fetchUnreadMessageCount();
  }, [user, location.search]);

  // Fetch unread message count
  const fetchUnreadMessageCount = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching unread message count in MessagingPage');
      const { count, error } = await countUnreadMessages(user.id);
      if (error) throw error;
      
      console.log('MessagingPage unread message count:', count);
      setUnreadMessageCount(count);
    } catch (error) {
      console.error('Error counting unread messages:', error);
    }
  };

  // Enhanced scroll to bottom function with WhatsApp/Messenger style behavior
  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'auto', force = false) => {
    try {
      const messageViewport = document.querySelector('.messages-container [data-radix-scroll-area-viewport]') as HTMLElement;
      
      if (!messageViewport) {
        // Fallback to messagesEndRef
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: behavior,
            block: 'end'
          });
        }
        return;
      }
      
      // Check if user has manually scrolled up (unless forced)
      if (!force && !isAtBottom && behavior === 'auto') {
        console.log('User has scrolled up, not auto-scrolling');
        return;
      }
      
      // Smooth scroll to bottom
      if (behavior === 'smooth') {
        messageViewport.scrollTo({
          top: messageViewport.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        // Instant scroll
        messageViewport.scrollTop = messageViewport.scrollHeight;
      }
      
      // Update scroll state
      setIsAtBottom(true);
      setShowScrollToBottomButton(false);
      setNewMessageCount(0);
      
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  };
  
  // Enhanced scroll monitoring with better bottom detection
  const checkScrollPosition = () => {
    const messageViewport = document.querySelector('.messages-container [data-radix-scroll-area-viewport]') as HTMLElement;
    
    if (!messageViewport) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messageViewport;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < 100; // Consider "at bottom" if within 100px
    
    setIsAtBottom(isNearBottom);
    setShowScrollToBottomButton(!isNearBottom && messages.length > 0);
    setLastScrollPosition(scrollTop);
    
    // Reset new message count if user scrolls to bottom
    if (isNearBottom) {
      setNewMessageCount(0);
    }
    
    // Detect user scrolling behavior
    if (userScrollTimeout.current) {
      clearTimeout(userScrollTimeout.current);
    }
    
    setUserScrolling(true);
    setAutoScrollEnabled(isNearBottom); // Enable auto-scroll only when at bottom
    
    userScrollTimeout.current = setTimeout(() => {
      setUserScrolling(false);
    }, 1000);
  };

  // Enhanced message change handler with WhatsApp/Messenger style auto-scroll logic
  useEffect(() => {
    if (messages.length > 0 && selectedReceiverId && user) {
      const currentMessageCount = messages.length;
      const hasNewMessages = currentMessageCount > lastMessageCount.current;
      
      // Handle initial load or conversation switch
      if (isInitialLoad.current || justSentMessage.current) {
        console.log('📱 Initial load or conversation switch - scrolling to bottom');
        setTimeout(() => scrollToBottom('auto', true), 100);
        justSentMessage.current = false;
        isInitialLoad.current = false;
        scrollBehaviorRef.current = 'smooth'; // Switch to smooth scrolling after initial load
      }
      // Handle new incoming messages
      else if (hasNewMessages) {
        const newMessageCount = currentMessageCount - lastMessageCount.current;
        const lastMessage = messages[messages.length - 1];
        
        console.log(`📨 ${newMessageCount} new message(s) received`);
        
        // If user is at bottom or the new message is from current user, auto-scroll
        if (isAtBottom || lastMessage?.isOwn) {
          console.log('🔄 Auto-scrolling for new message');
          setTimeout(() => scrollToBottom('smooth'), 50);
        } else {
          // User has scrolled up, show new message indicator
          console.log('⚠️ User scrolled up - showing new message indicator');
          setNewMessageCount(prev => prev + newMessageCount);
          setShowScrollToBottomButton(true);
        }
      }
      
      // Update message count tracking
      lastMessageCount.current = currentMessageCount;
      
      // Mark incoming messages as read
      console.log('Messages changed, marking as read');
      markIncomingMessagesAsRead();
      
      // Force update unread count in all components
      forceUpdateUnreadCount();
    }
  }, [messages, selectedReceiverId, user, isAtBottom]);


  // Enhanced scroll event monitoring for WhatsApp/Messenger behavior
  useEffect(() => {
    const messageViewport = document.querySelector('.messages-container [data-radix-scroll-area-viewport]') as HTMLElement;
    
    if (!messageViewport) return;
    
    const handleScroll = () => {
      checkScrollPosition();
    };
    
    // Use passive scroll listener for better performance
    messageViewport.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial scroll position check
    checkScrollPosition();
    
    return () => {
      messageViewport.removeEventListener('scroll', handleScroll);
      if (userScrollTimeout.current) {
        clearTimeout(userScrollTimeout.current);
      }
    };
  }, [messages.length]); // Re-run when messages change
  
  // Reset scroll states when switching conversations
  useEffect(() => {
    if (selectedChat) {
      console.log('🔄 Conversation switched - resetting scroll states');
      setIsAtBottom(true);
      setShowScrollToBottomButton(false);
      setNewMessageCount(0);
      setUserScrolling(false);
      isInitialLoad.current = true;
      justSentMessage.current = true;
      lastMessageCount.current = 0;
    }
  }, [selectedChat]);

  // Set up real-time subscriptions for messages and purchase requests
  useEffect(() => {
    if (!user || !selectedReceiverId) return;
    
    console.log('Setting up real-time subscription for:', user.id, 'and', selectedReceiverId);
    
    // মেসেজ এবং পারচেজ রিকোয়েস্ট এর জন্য রিয়েলটাইম সাবস্ক্রিপশন সেটআপ করার সময় সমস্যা সমাধান
    // ফাইল আপলোডের পরে অটো রিলোড বন্ধ করা হয়েছে
    if (user) {
      // ফাইল আপলোডের সময় অপ্রয়োজনীয় রিলোড প্রতিরোধ করার জন্য shouldSkipReload ফ্ল্যাগ চেক করা
      if (!window.localStorage.getItem('shouldSkipReload')) {
        fetchMessages(user.id, selectedReceiverId, selectedBookId || undefined);
      } else {
        // রিলোড স্কিপ করার পরে ফ্ল্যাগ পরিষ্কার করা
        window.localStorage.removeItem('shouldSkipReload');
      }
    }
    
    // Set up real-time message subscription
    const messageSubscription = subscribeToMessages(
      user.id,
      selectedReceiverId,
      (payload) => {
        console.log('Real-time message received:', payload);
        
        if (payload.type === 'UPDATE') {
          // Handle message status updates
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, status: payload.new.status }
                : msg
            )
          );
        } else if (payload.new) {
          // Handle new messages
          const newMessage = payload.new as Message;
          
          // Only add if it's not already in the messages array
          setMessages(prevMessages => {
            const exists = prevMessages.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('Message already exists, skipping:', newMessage.id);
              return prevMessages;
            }
            
            console.log('Adding new real-time message:', newMessage);
            const updatedMessages = [...prevMessages, newMessage];
            
            
            // Mark the new message as delivered if it's not from current user
            if (!newMessage.isOwn) {
              markMessageAsDelivered(newMessage.id).catch(error => 
                console.error('Error marking message as delivered:', error)
              );
              
              // Also mark as read after a short delay
              setTimeout(() => {
                markMessageAsRead(newMessage.id).catch(error => 
                  console.error('Error marking message as read:', error)
                );
              }, 1000);
              
            }
            
            return updatedMessages;
          });
          
          // Update unread count
          forceUpdateUnreadCount();
        }
      }
    );
    
    // Set up real-time purchase request subscription if bookId exists
    let purchaseRequestSubscription;
    if (selectedBookId) {
      purchaseRequestSubscription = subscribeToPurchaseRequests(
        user.id,
        selectedReceiverId,
        selectedBookId,
        (payload) => {
          console.log('Real-time purchase request update:', payload);
          
          // Reload purchase requests when there's an update
          fetchPurchaseRequests(selectedBookId);
        }
      );
    }
    
    return () => {
      console.log('Cleaning up real-time subscriptions');
      
      // Unsubscribe from message updates
      if (messageSubscription && typeof messageSubscription.unsubscribe === 'function') {
        messageSubscription.unsubscribe();
      }
      
      // Unsubscribe from purchase request updates
      if (purchaseRequestSubscription && typeof purchaseRequestSubscription.unsubscribe === 'function') {
        purchaseRequestSubscription.unsubscribe();
      }
    };
  }, [user, selectedReceiverId, selectedBookId]);

  // Add a new useEffect to handle route changes
  useEffect(() => {
    // ফাইল আপলোডের সময় রিলোড না করার জন্য চেক করা
    if (window.localStorage.getItem('shouldSkipReload')) {
      console.log('Skipping location change reload due to file upload in progress');
      return;
    }
    
    // ফাইল আপলোডের পর 10 সেকেন্ডের মধ্যে রিলোড না করার জন্য চেক
    const fileUploadTime = parseInt(sessionStorage.getItem('fileUploadTime') || '0', 10);
    const currentTime = Date.now();
    const timeSinceUpload = currentTime - fileUploadTime;
    
    if (fileUploadTime > 0 && timeSinceUpload < 10000) {
      console.log(`Skipping location change reload, only ${Math.round(timeSinceUpload/1000)}s since last file upload`);
      return;
    }
    
    // Check if we're navigating within the messages tab
    const isMessagesTab = location.pathname.includes('/messages');
    
    // Only reload when coming back to the messages tab from another tab
    if (user && selectedReceiverId && isMessagesTab) {
      // Check if the URL params have changed (different conversation)
      const params = new URLSearchParams(location.search);
      const sellerId = params.get('seller');
      const bookId = params.get('bookId');
      
      // Only reload if we're coming from a different tab or URL params changed
      const paramsChanged = 
        (sellerId && sellerId !== selectedReceiverId) || 
        (bookId && bookId !== selectedBookId);
      
      // If we have URL parameters and they changed, let the initial useEffect handle it
      if (paramsChanged) {
        console.log('URL parameters changed, letting initial load handle it');
        return;
      }
      
      // If we're coming back to the messages tab from another tab (not from URL param change)
      const comingFromAnotherTab = document.referrer && !document.referrer.includes('/messages');
      
      if (comingFromAnotherTab) {
        console.log('Coming back to messages from another tab, reloading data');
        // Add a slight delay to ensure the component is fully mounted
        setTimeout(() => {
          // Always fetch messages which will include purchase requests thanks to our updated getConversationMessages function
          fetchMessages(user.id, selectedReceiverId, selectedBookId || undefined);
          
          // Also reload conversations
          fetchConversations();
        }, 300);
      }
    }
  }, [location.pathname, location.search, user, selectedReceiverId, selectedBookId]);

  // Add a new useEffect to handle tab visibility changes
  useEffect(() => {
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      // ফাইল আপলোডের সময় রিলোড না করার জন্য চেক করা
      if (window.localStorage.getItem('shouldSkipReload')) {
        console.log('Skipping visibility change reload due to file upload in progress');
        return;
      }

      // ফাইল আপলোডের পর 10 সেকেন্ডের মধ্যে রিলোড না করার জন্য চেক
      const fileUploadTime = parseInt(sessionStorage.getItem('fileUploadTime') || '0', 10);
      const currentTime = Date.now();
      const timeSinceUpload = currentTime - fileUploadTime;
      
      if (fileUploadTime > 0 && timeSinceUpload < 10000) {
        console.log(`Skipping visibility change reload, only ${Math.round(timeSinceUpload/1000)}s since last file upload`);
        return;
      }

      if (document.visibilityState === 'visible') {
        // Only reload if we were away for a significant time (more than 30 seconds)
        const lastActiveTime = parseInt(sessionStorage.getItem('lastActiveTime') || '0', 10);
        const currentTime = Date.now();
        const timeAway = currentTime - lastActiveTime;
        
        // If we were away for more than 120 seconds, reload data
        if (timeAway > 120000 && user && selectedReceiverId) {  // Changed from 30 seconds to 120 seconds
          console.log('Tab became visible after being away, reloading messages');
          // Add a slight delay to ensure everything is ready
          setTimeout(() => {
            // Always fetch messages which will include purchase requests thanks to our updated getConversationMessages function
            fetchMessages(user.id, selectedReceiverId, selectedBookId || undefined);
            
            // Also reload conversations
            fetchConversations();
          }, 300);
        }
      } else {
        // When tab becomes invisible, store the current time
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
      }
    };

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, selectedReceiverId, selectedBookId]);

  // Add a new useEffect to reload messages when component is focused
  useEffect(() => {
    // Function to handle window focus
    const handleWindowFocus = () => {
      // ফাইল আপলোডের সময় রিলোড না করার জন্য চেক করা
      if (window.localStorage.getItem('shouldSkipReload')) {
        console.log('Skipping window focus reload due to file upload in progress');
        return;
      }

      // ফাইল আপলোডের পর 10 সেকেন্ডের মধ্যে রিলোড না করার জন্য চেক
      const fileUploadTime = parseInt(sessionStorage.getItem('fileUploadTime') || '0', 10);
      const currentTime = Date.now();
      const timeSinceUpload = currentTime - fileUploadTime;
      
      if (fileUploadTime > 0 && timeSinceUpload < 10000) {
        console.log(`Skipping window focus reload, only ${Math.round(timeSinceUpload/1000)}s since last file upload`);
        return;
      }
      
      // Only reload if we were away for a significant time (more than 120 seconds)
      const lastFocusTime = parseInt(sessionStorage.getItem('lastFocusTime') || '0', 10);
      const timeAway = currentTime - lastFocusTime;
      
      // If we were away for more than 120 seconds, reload data
      if (timeAway > 120000 && user && selectedReceiverId) {  // Changed from 30 seconds to 120 seconds
        console.log('Window focused after being away, reloading messages');
        fetchMessages(user.id, selectedReceiverId, selectedBookId || undefined);
      }
    };
    
    // Function to handle window blur
    const handleWindowBlur = () => {
      // When window loses focus, store the current time
      sessionStorage.setItem('lastFocusTime', Date.now().toString());
    };

    // Add event listeners
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [user, selectedReceiverId, selectedBookId]);

  // Modify the fetchMessages function to ensure it always loads messages properly
  const fetchMessages = async (userId: string, otherUserId: string, bookId?: string) => {
    if (!userId || !otherUserId) return;
    
    try {
      setLoadingMessages(true);
      
      const { data, error } = await getConversationMessages(userId, otherUserId, bookId);
      
      if (error) throw error;
      
      if (data) {
        // Remove any duplicate messages by ID
        const uniqueMessages = removeDuplicateMessages(data);
        
        // Force HTTPS for all file URLs
        const processedMessages = uniqueMessages.map(msg => {
          if (msg.file_url && msg.file_url.startsWith('http://') && msg.file_url.includes('supabase')) {
            const secureUrl = msg.file_url.replace('http://', 'https://');
            return { ...msg, file_url: secureUrl };
          }
          return msg;
        });
        
        // Update messages - এখানে আমরা সব মেসেজ সেট করছি, খালি অ্যারে না
        setMessages(processedMessages);
        
        // Mark messages as delivered when they are loaded
        markMessagesAsDelivered(processedMessages);
        
        // Only scroll to bottom if justSentMessage is true (meaning we just selected a conversation)
        if (justSentMessage.current) {
          setTimeout(scrollToBottom, 200);
        }
        
        // Mark messages as read with a slight delay to ensure UI is updated
        setTimeout(() => {
          // Directly mark messages as read
          (async () => {
            if (user && otherUserId) {
              try {
                const { success, count, error } = await directMarkMessagesAsRead(user.id, otherUserId);
                
                if (error) {
                  console.error('Error in directMarkMessagesAsRead:', error);
                  return;
                }
                
                if (count && count > 0) {
                  // Update local message status
                  setMessages(prevMessages => 
                    prevMessages.map(msg => 
                      (!msg.isOwn && msg.status !== 'read')
                        ? { ...msg, status: 'read' }
                        : msg
                    )
                  );
                  
                  // Force update unread count
                  forceUpdateUnreadCount();
                }
              } catch (error) {
                console.error('Error marking messages as read:', error);
              }
            }
          })();
        }, 500);
        
        // Extract all book IDs from messages and purchase requests
        const messageBookIds = processedMessages
          .filter(msg => msg.book_id)
          .map(msg => msg.book_id);
          
        const purchaseRequestBookIds = processedMessages
          .filter(msg => msg.isPurchaseRequest && msg.purchaseRequest)
          .map(msg => msg.purchaseRequest?.book_id)
          .filter(Boolean);
          
        // Combine all book IDs and remove duplicates
        const allBookIds = [...new Set([...messageBookIds, ...purchaseRequestBookIds, bookId].filter(Boolean))];
        
        // Fetch details for all books
        if (allBookIds.length > 0) {
          for (const bookId of allBookIds) {
            if (bookId) {
              fetchBookDetails(bookId);
            }
          }
        }
      } else {
        // যদি কোন ডাটা না পাওয়া যায়, তাহলে খালি অ্যারে সেট করা
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'ত্রুটি',
        description: 'বার্তা লোড করতে সমস্যা হয়েছে',
        variant: 'destructive'
      });
      // এরর হলেও খালি অ্যারে সেট না করে আগের মেসেজগুলো রাখা
    } finally {
      setLoadingMessages(false);
    }
  };
  
  // Helper function to remove duplicate messages
  const removeDuplicateMessages = (messages: Message[]): Message[] => {
    const seen = new Set();
    return messages.filter(message => {
      const isDuplicate = seen.has(message.id);
      seen.add(message.id);
      return !isDuplicate;
    });
  };

  // Mark messages as delivered
  const markMessagesAsDelivered = async (messages: Message[]) => {
    if (!user) return;
    
    const incomingMessages = messages.filter(msg => 
      !msg.isOwn && 
      msg.status !== 'delivered' && 
      msg.status !== 'read' &&
      !msg.isPurchaseRequest
    );
    
    for (const message of incomingMessages) {
      try {
        await markMessageAsDelivered(message.id);
      } catch (error) {
        console.error(`Error marking message ${message.id} as delivered:`, error);
      }
    }
  };

  const fetchPurchaseRequests = async (bookId: string) => {
    if (!user || !bookId || !selectedReceiverId) return;
    
    // We're keeping this to fetch requests separately in case we need them
    // for other UI elements, but we'll use the ones embedded in messages for display
    try {
      setLoadingRequests(true);
      
      // Get purchase requests for this book between these users
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('book_id', bookId)
        .or(`and(buyer_id.eq.${user.id},seller_id.eq.${selectedReceiverId}),and(buyer_id.eq.${selectedReceiverId},seller_id.eq.${user.id})`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching purchase requests:', error);
        return;
      }
      
      if (!data || data.length === 0) {
        setPurchaseRequests([]);
        return;
      }
      
      try {
        // Get buyer names separately to avoid foreign key relationship error
        const requestsWithNames = await Promise.all(
          data.map(async request => {
            try {
              // Fetch profile data for buyer
              const { data: profileData } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', request.buyer_id)
                .single();
              
              return {
                ...request,
                buyer_name: profileData?.name || 'অজানা ব্যবহারকারী'
              };
            } catch (profileError) {
              console.error('Error fetching buyer profile:', profileError);
              return {
                ...request,
                buyer_name: 'অজানা ব্যবহারকারী'
              };
            }
          })
        );
        
        setPurchaseRequests(requestsWithNames);
        console.log('Purchase requests loaded successfully:', requestsWithNames.length);
      } catch (profileError) {
        console.error('Error processing purchase requests:', profileError);
        // Still set the requests without buyer names
        setPurchaseRequests(data.map(request => ({
          ...request,
          buyer_name: 'অজানা ব্যবহারকারী'
        })));
      }
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchBookDetails = async (bookId: string) => {
    if (!bookId) return;
    
    try {
      setLoadingBook(true);
      const { data, error } = await getBookDetails(bookId);
      
      if (error) {
        console.error('Error fetching book details:', error);
        // Don't throw here, just continue
      }
      
      if (data) {
        setBookDetails(data);
      } else {
        console.warn(`No book details found for ID: ${bookId}`);
        // Create a minimal valid BookEntity object
        const fallbackBook: BookEntity = {
          id: bookId,
          title: 'বইয়ের তথ্য অনুপলব্ধ',
          author: 'অজানা',
          price: 0,
          condition: 'good',
          seller_id: selectedReceiverId || 'unknown',
          status: 'available',
          location: 'অনলাইন'
        };
        setBookDetails(fallbackBook);
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      // Create a minimal valid BookEntity object for error case
      const errorBook: BookEntity = {
        id: bookId,
        title: 'বইয়ের তথ্য লোড করা যায়নি',
        author: 'অজানা',
        price: 0,
        condition: 'good',
        seller_id: selectedReceiverId || 'unknown',
        status: 'available',
        location: 'অনলাইন'
      };
      setBookDetails(errorBook);
    } finally {
      setLoadingBook(false);
    }
  };

  // handleReloadMessages ফাংশনটি আপডেট করছি
  const handleReloadMessages = () => {
    if (!user || !selectedReceiverId) return;
    
    // Show loading indicator
    setLoadingMessages(true);
    
    // Reload messages - এখানে আমরা মেসেজগুলো আবার লোড করছি
    fetchMessages(user.id, selectedReceiverId, selectedBookId || undefined);
  };

  // Send message function
  const handleSendMessage = async () => {
    if (!user || !selectedReceiverId || !newMessage.trim()) {
      return;
    }
    
    // ভেরিফিকেশন চেক করি
    const isVerified = await checkAndShowWarning(user.id, 'message');
    if (!isVerified) {
      return;
    }

    setSendingMessage(true);
    
    try {
      // Store message content before clearing input
      const messageContent = newMessage.trim();
      
      // Clear input immediately for better UX
      setNewMessage('');
      
      // Create optimistic message for immediate UI feedback
      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        sender_id: user.id,
        receiver_id: selectedReceiverId,
        book_id: selectedBookId || undefined,
        content: messageContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender_name: 'আপনি',
        sender_avatar_url: undefined,
        isOwn: true,
        status: 'sent'
      };
      
      // Add optimistic message to UI
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      
      // Manually scroll to bottom after adding optimistic message
      setTimeout(() => {
        const messageViewport = document.querySelector('.messages-container [data-radix-scroll-area-viewport]');
        if (messageViewport) {
          messageViewport.scrollTop = messageViewport.scrollHeight;
        }
      }, 50);
      
      // Send message to server
      const { data, error } = await sendMessage(
        user.id, 
        selectedReceiverId, 
        messageContent,
        selectedBookId || undefined
      );
      
      if (error) {
        console.error('Error sending message:', error);
        
        // Show a user-friendly error message
        toast({
          title: 'বার্তা পাঠাতে সমস্যা হয়েছে',
          description: 'দয়া করে আবার চেষ্টা করুন',
          variant: 'destructive'
        });
        
        // Remove optimistic message
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== optimisticId)
        );
        
        // Restore the message if sending failed
        setNewMessage(messageContent);
        return;
      }
      
      // Replace optimistic message with real one
      if (data) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === optimisticId ? data : msg
          )
        );
      }
      
      // Focus on input field after sending for better UX
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      
      toast({
        title: 'বার্তা পাঠাতে সমস্যা হয়েছে',
        description: 'দয়া করে আবার চেষ্টা করুন',
        variant: 'destructive'
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Add function to handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'document') => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Validate file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast({
          title: "ফাইল সাইজ বেশি",
          description: `ফাইল সাইজ 10MB এর বেশি হতে পারবে না। আপনার ফাইল সাইজ: ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`,
          variant: "destructive"
        });
        
        // Clear the input
        if (fileType === 'image') {
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          if (documentInputRef.current) documentInputRef.current.value = '';
        }
        return;
      }
      
      // Validate file type
      if (fileType === 'image' && !selectedFile.type.startsWith('image/')) {
        toast({
          title: "অবৈধ ফাইল টাইপ",
          description: "দয়া করে একটি ছবি ফাইল সিলেক্ট করুন (JPG, PNG, GIF)",
          variant: "destructive"
        });
        
        // Clear the input
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      if (fileType === 'document' && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(selectedFile.type)) {
        toast({
          title: "অবৈধ ফাইল টাইপ",
          description: "দয়া করে একটি সমর্থিত ডকুমেন্ট ফাইল সিলেক্ট করুন (PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX)",
          variant: "destructive"
        });
        
        // Clear the input
        if (documentInputRef.current) documentInputRef.current.value = '';
        return;
      }
      
      // Set the selected file
      setSelectedFile(selectedFile);
      
      // Show loading toast
      toast({
        title: fileType === 'image' ? "ছবি আপলোড হচ্ছে..." : "ডকুমেন্ট আপলোড হচ্ছে...",
        description: "দয়া করে অপেক্ষা করুন...",
      });
      
      // Auto upload the file
      handleSendFileMessage(selectedFile, fileType);
      
      // Clear the input
      if (fileType === 'image') {
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        if (documentInputRef.current) documentInputRef.current.value = '';
      }
    }
  };
  
  // Add function to handle sending file messages
  const handleSendFileMessage = async (file: File, fileType: 'image' | 'document') => {
    if (!user || !selectedReceiverId) {
      toast({
        title: "ফাইল পাঠাতে সমস্যা",
        description: "আপনি লগইন অবস্থায় নেই বা রিসিভার সিলেক্ট করা হয়নি।",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setFileUploading(true);
      
      // ফাইল আপলোড করার সময় অটো রিলোড বন্ধ করা
      window.localStorage.setItem('shouldSkipReload', 'true');
      
      // একটি টাইমআউট সেট করুন যাতে আপলোডের পরে কিছুক্ষণ রিলোড বন্ধ থাকে
      sessionStorage.setItem('fileUploadTime', Date.now().toString());
      
      console.log(`Starting file upload: ${fileType}, file:`, file.name, file.type, file.size);
      
      // Check if user is verified
      const isVerified = await checkAndShowWarning(user.id, 'message');
      if (!isVerified) {
        setFileUploading(false);
        setSelectedFile(null);
        return;
      }
      
      // Prepare the content message - IMPORTANT: For images, use empty string
      let content = '';
      if (fileType === 'image') {
        // ছবির জন্য খালি কনটেন্ট, যাতে শুধু ছবিই দেখায়
        content = '';
        console.log('Using empty content for image message');
      } else {
        content = `ডকুমেন্ট পাঠানো হয়েছে: ${file.name}`;
      }
      
      console.log(`Sending file message with content: "${content}"`);
      
      // Upload and send the file message
      const response = await sendMessageWithFile(
        user.id,
        selectedReceiverId,
        content,
        file,
        fileType,
        selectedBookId || undefined
      );
      
      console.log('File message send response:', response);
      
      if (!response.success || !response.message) {
        console.error('File send error:', response.error);
        throw new Error(response.error instanceof Error ? response.error.message : 'ফাইল আপলোড করতে সমস্যা হয়েছে');
      }
      
      console.log('File message sent successfully:', response.message);
      
      // Add message directly to the state for instant feedback
      const newMessage = {
        ...response.message,
        isOwn: true,
        sender_name: 'আপনি',
        sender_avatar_url: undefined
      };
      
      console.log('Adding new file message to UI:', newMessage);
      setMessages(prev => [...prev, newMessage]);
      
      // Set flag to scroll to bottom
      justSentMessage.current = true;
      
      // Scroll to bottom after adding the message
      setTimeout(scrollToBottom, 100);
      
      // Send success toast notification
      toast({
        title: fileType === 'image' ? "ছবি পাঠানো হয়েছে" : "ডকুমেন্ট পাঠানো হয়েছে",
        description: "ফাইল সফলভাবে পাঠানো হয়েছে",
        variant: "default"
      });
      
      // ফাইল আপলোডের পর 10 সেকেন্ড পর্যন্ত অটো রিফ্রেশ বন্ধ রাখা
      setTimeout(() => {
        window.localStorage.removeItem('shouldSkipReload');
        console.log('Re-enabling auto refresh after file upload');
      }, 10000);
      
    } catch (error) {
      console.error('Error sending file message:', error);
      
      // Show detailed error message
      toast({
        title: "ফাইল পাঠাতে সমস্যা",
        description: error instanceof Error ? error.message : "আপনার ফাইল পাঠানো যায়নি। আবার চেষ্টা করুন।",
        variant: "destructive"
      });
      
      // Show bucket setup instructions if appropriate
      if (error instanceof Error && 
          (error.message.includes('bucket') || 
           error.message.includes('storage') || 
           error.message.includes('permission'))) {
        toast({
          title: "স্টোরেজ সেটআপ সমস্যা",
          description: "সুপাবেসে 'messages' বাকেট সঠিকভাবে সেটআপ করা হয়নি। অ্যাডমিনের সাথে যোগাযোগ করুন।",
          variant: "destructive",
          duration: 10000
        });
      }
    } finally {
      setFileUploading(false);
      setSelectedFile(null);
      // সবকিছু রিমুভ না করে টাইমআউট রাখা হচ্ছে 
      // setTimeout এর মাধ্যমে উপরে এটি রিমুভ করা হবে 10 সেকেন্ড পর
    }
  };

  const formatMessageTime = (timestamp: string, message: Message) => {
    try {
      const date = new Date(timestamp);
      const timeString = date.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: 'numeric' });
      
      if (message.isOwn) {
        return (
          <span className="flex items-center space-x-1">
            <span>{timeString}</span>
            <MessageStatus status={message.status} />
          </span>
        );
      }
      
      return timeString;
    } catch (error) {
      return '';
    }
  };

  const formatDateHeader = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('bn-BD', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return '';
    }
  };

  // Handle selecting a conversation - updated for mobile view behavior
  const handleSelectConversation = (conversation: Conversation) => {
    // First set the loading state to show loading indicators
    setLoadingMessages(true);
    
    // Then update the selected conversation info
    setSelectedChat(conversation.id);
    setSelectedReceiverId(conversation.user.id);
    setSelectedBookId(conversation.book.id || null);
    
    // Hide the sidebar on mobile when a conversation is selected
    setShowMobileSidebar(false);
    
    // Clear existing messages to avoid showing old messages while loading
    setMessages([]);
    
    // Update conversation to mark as read in the UI immediately
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unread: false }
        : conv
    ));
    
    // If the conversation was unread, immediately force update the unread count
    if (conversation.unread && user) {
      console.log('Selected conversation has unread messages, marking as read');
      
      // Directly mark messages as read
      (async () => {
        try {
          const { success, count, error } = await directMarkMessagesAsRead(user.id, conversation.user.id);
          
          if (error) {
            console.error('Error in directMarkMessagesAsRead:', error);
            return;
          }
          
          if (count && count > 0) {
            console.log(`Successfully marked ${count} messages as read`);
            
            // Force update unread count
            forceUpdateUnreadCount();
          }
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      })();
    }
    
    // Use setTimeout to ensure the UI updates before loading new messages
    setTimeout(() => {
      // Load messages for this conversation
      if (user) {
        fetchMessages(user.id, conversation.user.id, conversation.book.id || undefined);
        
        // Set a flag to force scrolling to bottom after messages are loaded
        justSentMessage.current = true;
      }
      
      // Load book details if available
      if (conversation.book.id) {
        fetchBookDetails(conversation.book.id);
        // Ensure purchase requests are loaded
        fetchPurchaseRequests(conversation.book.id);
      } else {
        setBookDetails(null);
        setPurchaseRequests([]);
      }
    }, 50);
  };

  // Modify the conversation display to check if verified property exists
  const renderVerifiedBadge = (conversation: Conversation) => {
    // Only render the badge if the user is verified
    if (conversation.user.verified) {
      return <CheckCircle className="h-4 w-4 text-primary" />;
    }
    return null;
  };

  const handleRequestStatusChange = (requestId: string, status: 'accepted' | 'rejected') => {
    // Update the local state for purchase requests
    setPurchaseRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status } : req
    ));
    
    // Update the message list to reflect the new status
    setMessages(prev => prev.map(msg => {
      if (msg.isPurchaseRequest && msg.purchaseRequest && msg.purchaseRequest.id === requestId) {
        return {
          ...msg,
          purchaseRequest: {
            ...msg.purchaseRequest,
            status: status
          }
        };
      }
      return msg;
    }));
    
    // If book was sold (status is accepted), refresh book details
    if (status === 'accepted' && selectedBookId) {
      // Wait a moment to ensure DB is updated
      setTimeout(() => {
        fetchBookDetails(selectedBookId);
        // বই কেনার অনুরোধ গ্রহণ করার পর সব মেসেজ আবার লোড করা
        if (user && selectedReceiverId) {
          fetchMessages(user.id, selectedReceiverId, selectedBookId);
        }
      }, 1000);
    } else {
      // অনুরোধ প্রত্যাখ্যান করার পরও মেসেজগুলো রিলোড করা
      if (user && selectedReceiverId) {
        setTimeout(() => {
          fetchMessages(user.id, selectedReceiverId, selectedBookId || undefined);
        }, 1000);
      }
    }
  };

  // Add a function to render file attachments in messages
  const renderFileAttachment = (message: Message) => {
    console.log('Rendering file attachment:', message.file_url, message.file_type);
    
    if (!message.file_url) {
      console.log('No file URL in message');
      return null;
    }
    
    if (message.file_type === 'image') {
      console.log('Rendering image with URL:', message.file_url);
      
      // Use the memoized image component instead
      return <ImageAttachment imageUrl={message.file_url} />;
    } else if (message.file_type === 'document') {
      return (
        <div 
          className="mt-2 flex items-center p-2 bg-accent rounded-md cursor-pointer border border-muted"
          onClick={() => window.open(message.file_url, '_blank')}
        >
          <File className="h-5 w-5 mr-2 text-primary" />
          <span className="text-sm truncate max-w-[200px]">
            {message.file_name || 'Document'}
          </span>
        </div>
      );
    }
    
    return null;
  };

  // Add a function to handle clicking the "New Messages" button
  const handleScrollToNewMessages = () => {
    setNewMessageCount(0);
    scrollToBottom('smooth', true);
  };

  // Force update unread count in all components
  const forceUpdateUnreadCount = () => {
    console.log('Force updating unread count in all components');
    
    // First dispatch the event
    window.dispatchEvent(new CustomEvent('unread-messages-updated'));
    
    // Then directly update the count in this component
    if (user) {
      setTimeout(async () => {
        try {
          // Directly query the database
          const { data, error } = await supabase
            .from('messages')
            .select('id')
            .eq('receiver_id', user.id)
            .not('status', 'eq', 'read');
          
          if (error) {
            console.error('Error checking unread messages:', error);
            return;
          }
          
          const count = data ? data.length : 0;
          console.log('Updated unread count in MessagingPage:', count);
          setUnreadMessageCount(count);
        } catch (error) {
          console.error('Error updating unread count:', error);
        }
      }, 1000);
    }
  };

  // Mark incoming messages as read when conversation is opened
  const markIncomingMessagesAsRead = async () => {
    if (!user || !selectedReceiverId) return;
    
    try {
      console.log('Marking messages as read from sender:', selectedReceiverId);
      
      // Use the direct function to mark messages as read
      const { success, count, error } = await directMarkMessagesAsRead(user.id, selectedReceiverId);
      
      if (error) {
        console.error('Error in directMarkMessagesAsRead:', error);
        throw error;
      }
      
      if (count && count > 0) {
        console.log(`Successfully marked ${count} messages as read`);
        
        // Also update local message status
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            (!msg.isOwn && msg.status !== 'read')
              ? { ...msg, status: 'read' }
              : msg
          )
        );
        
        // Update conversations to remove unread indicators
        setConversations(prev => prev.map(conv => 
          conv.user.id === selectedReceiverId 
            ? { ...conv, unread: false }
            : conv
        ));
        
        // Force refresh unread count in other components
        forceUpdateUnreadCount();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setLoadingConversations(true);
      const { data, error } = await getUserConversations(user.id);
      
      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }
      
      setConversations(data || []);
      
      // যদি কনভারসেশন থাকে কিন্তু কোনো সিলেক্টেড চ্যাট না থাকে, তাহলে প্রথম কনভারসেশনটি সিলেক্ট করা
      if ((data && data.length > 0) && !selectedChat) {
        const firstConversation = data[0];
        handleSelectConversation(firstConversation);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'ত্রুটি',
        description: 'কথোপকথন লোড করতে সমস্যা হয়েছে',
        variant: 'destructive'
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  // Add this function for manual scrolling (should be inside MessagingPage component)
  const handleManualScrollToBottom = () => {
    scrollToBottom();
  };

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login', { state: { from: location.pathname + location.search } });
    return null;
  }

  const currentConversation = conversations.find(conv => conv.id === selectedChat);

  return (
    <div className="min-h-screen bg-[#EFF4FA] overflow-hidden">
      {/* Main Messaging Container - Full Height */}
      <div className="h-screen w-full overflow-hidden">
        {/* Two-column layout with fixed sizes */}
        <div className="h-full w-full flex relative overflow-hidden">
          {/* Sidebar - Always visible on desktop, toggle on mobile */}
          <div 
            className={`h-full bg-white/95 backdrop-blur-md border-r border-slate-200/60 w-full md:w-80 flex-shrink-0 shadow-sm
              ${showMobileSidebar ? 'block' : 'hidden md:block'}`}
          >
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="border-b border-slate-200/60 py-4 px-6 flex justify-between items-center bg-white/98 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 p-2"
                    onClick={() => navigate('/browse')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    কথোপকথন
                    {unreadMessageCount > 0 && (
                      <Badge variant="destructive" className="ml-2 h-6 text-xs bg-red-500 hover:bg-red-600">
                        {unreadMessageCount}
                      </Badge>
                    )}
                  </h2>
                </div>
              </div>
              
              {/* Conversations List - Independently Scrollable */}
              <div className="flex-1 overflow-hidden bg-slate-50/30">
                <ScrollArea className="h-full conversation-list">
                  <div className="p-4" ref={conversationsScrollRef}>
                    {loadingConversations ? (
                      Array(3).fill(0).map((_, i) => (
                        <Card key={i} className="mb-3 bg-white border-slate-200/50 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-3 w-5/6" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : conversations.length > 0 ? (
                      conversations.map((conversation) => (
                        <Card
                          key={conversation.id}
                          className={`mb-3 cursor-pointer transition-all duration-200 border-slate-200/50 ${
                            selectedChat === conversation.id 
                              ? 'ring-2 ring-blue-500 bg-blue-50/80 shadow-md border-blue-200' 
                              : 'bg-white hover:bg-slate-50 hover:shadow-md hover:border-slate-300/60'
                          }`}
                          onClick={() => handleSelectConversation(conversation)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-10 w-10 border-2 border-slate-200/60 shadow-sm">
                                <AvatarImage src={conversation.user.avatar_url} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">{conversation.user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-slate-800 truncate">
                                    {conversation.user.name}
                                  </h3>
                                  {renderVerifiedBadge(conversation)}
                                </div>
                                {conversation.book.title && (
                                  <p className="text-sm text-slate-600 truncate font-medium">
                                    {conversation.book.title}
                                  </p>
                                )}
                                <p className="text-sm text-slate-500 truncate">
                                  {conversation.lastMessage}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-slate-400 flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {conversation.timestamp}
                                  </span>
                                  {conversation.unread && (
                                    <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700">
                                      <span className="text-[10px] text-white font-bold">১</span>
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-16 px-4">
                        <MessageCircle className="h-16 w-16 text-slate-300 mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-3">
                          কোনো কথোপকথন নেই
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                          বই ব্রাউজ করুন এবং বিক্রেতার সাথে যোগাযোগ করুন
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
          
          {/* Vertical Separator */}
          <div className="hidden md:block h-full absolute left-80 z-10">
            <Separator orientation="vertical" className="h-full bg-slate-200/70 shadow-sm" />
          </div>
          
          {/* Main Chat Panel - Independently Scrollable */}
          <div className={`flex-1 h-full flex flex-col bg-white/90 backdrop-blur-sm ${showMobileSidebar ? 'hidden md:flex' : 'flex'}`}>
            {selectedChat && currentConversation ? (
              <>
                {/* Chat Header - Fixed */}
                <div className="border-b border-slate-200/70 shadow-sm py-3 px-6 bg-white/95 backdrop-blur-md flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden h-8 w-8 p-0 hover:bg-slate-100"
                      onClick={() => setShowMobileSidebar(true)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-9 w-9 border-2 border-slate-200/60 shadow-sm">
                      <AvatarImage src={currentConversation.user.avatar_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-medium text-sm">{currentConversation.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 
                          className="font-semibold text-lg text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => navigate(`/profile/${currentConversation.user.id}`)}
                        >
{currentConversation.user.name.split(' ')[0]}
                        {/* Call buttons */}
                        {selectedReceiverId && (
                          <div className="flex items-center space-x-2 ml-3">
                            <CallButton 
                              receiverId={selectedReceiverId}
                              onCallInitiated={() => {}}
                              size="sm"
                              variant="ghost"
                              iconOnly
                            />
                          </div>
                        )}
                        </h2>
                        {renderVerifiedBadge(currentConversation)}
                      </div>
                      <p className="text-sm text-slate-500 -mt-0.5">
                        {bookDetails?.location || 'অনলাইন'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Book request buttons - Always show these buttons regardless of message state */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 h-9 w-9 rounded-full shadow-sm"
                      onClick={handleReloadMessages}
                      disabled={loadingMessages}
                      title="রিফ্রেশ করুন"
                      aria-label="রিফ্রেশ করুন"
                    >
                      {loadingMessages ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                          <path d="M8 16H3v5" />
                        </svg>
                      )}
                    </Button>
                    
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="text-sm h-9 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-4 shadow-sm"
                      onClick={() => setIsBookSelectionOpen(true)}
                    >
                      বই কেনার অনুরোধ
                    </Button>
                  </div>
                </div>
                
                {/* Messages Container - Scrollable Area */}
                <div className="flex-1 overflow-hidden messages-container bg-slate-50/30">
                  <ScrollArea className="h-full py-6 px-6" scrollHideDelay={100}>
                    {loadingMessages ? (
                      <div className="space-y-4">
                        {Array(3).fill(0).map((_, i) => (
                          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                              i % 2 === 0 
                                ? 'bg-white border border-slate-200/50' 
                                : 'bg-blue-500/10 border border-blue-200/50'
                            }`}>
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-1/2 mt-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4 pb-2">
{messages.length > 0 ? (
                          // Ensure unique keys by filtering duplicate IDs
                          messages.filter((m,i,self)=> self.findIndex(t=>t.id===m.id)===i).map((message, index) => {
                            // Check if this is a new day compared to the previous message
                            const showDateSeparator = index === 0 || (
                              new Date(message.created_at).toDateString() !== 
                              new Date(messages[index - 1].created_at).toDateString()
                            );
                            
                            return (
                              <React.Fragment key={message.id}>
                                {showDateSeparator && (
                                  <div className="flex items-center justify-center my-8 date-separator">
                                    <div className="bg-white/90 border border-slate-200/60 px-4 py-2 rounded-full text-sm text-slate-600 flex items-center z-10 shadow-sm backdrop-blur-sm">
                                      <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                                      {formatDateHeader(message.created_at)}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Check if the message is a purchase request */}
                                {message.isPurchaseRequest && message.purchaseRequest ? (
                                  <div className="my-6">
                                    <BookPurchaseRequestCard
                                      request={message.purchaseRequest}
                                      isOwn={message.isOwn}
                                      onStatusChange={(status) => handleRequestStatusChange(message.purchaseRequest?.id || '', status)}
                                    />
                                  </div>
                                ) : (
                                  <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
                                    <div className={`message-bubble px-4 py-3 rounded-2xl max-w-[75%] shadow-sm ${
                                      message.isOwn
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-slate-800 border border-slate-200/50'
                                    }`}>
                                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                                      {renderFileAttachment(message)}
                                      <p className={`text-xs mt-2 ${
                                        message.isOwn ? 'text-blue-100' : 'text-slate-500'
                                      } flex items-center justify-end space-x-1`}>
                                        {formatMessageTime(message.created_at, message)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <MessageCircle className="h-16 w-16 text-slate-300 mx-auto mb-6" />
                              <h3 className="text-xl font-semibold text-slate-700 mb-3">
                                কোনো বার্তা নেই
                              </h3>
                              <p className="text-slate-500 text-sm leading-relaxed">
                                এই কথোপকথনে প্রথম বার্তা পাঠান
                              </p>
                            </div>
                          </div>
                        )}
                        {/* This is the target we'll scroll to */}
                        <div ref={messagesEndRef} className="h-1" />
                      </div>
                    )}
                  </ScrollArea>
                </div>
                
                {/* Message Input Area - Fixed */}
                <div className="p-4 border-t border-slate-200/70 bg-white/95 backdrop-blur-md">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleManualScrollToBottom}
                      className="h-10 w-10 p-0 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 flex-shrink-0 shadow-sm"
                      title="নিচে স্ক্রল করুন"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="আপনার বার্তা লিখুন..."
                        className="min-h-[44px] max-h-24 resize-none py-3 pr-16 text-base md:text-sm bg-white border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-2xl shadow-sm touch-manipulation"
                        style={{ fontSize: '16px' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <label className="cursor-pointer p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50" title="ছবি পাঠান">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e, 'image')}
                          />
                          <Image className="h-4 w-4" />
                        </label>
                        <label className="cursor-pointer p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50" title="ফাইল পাঠান">
                          <input 
                            type="file" 
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, 'document')}
                          />
                          <Paperclip className="h-4 w-4" />
                        </label>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="h-10 w-10 rounded-full p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      disabled={(!newMessage.trim() && !selectedFile) || sendingMessage || fileUploading}
                    >
                      {sendingMessage || fileUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                  {selectedFile && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3 text-sm">
                        <File className="h-5 w-5 text-blue-600" />
                        <span className="truncate max-w-[200px] font-medium text-slate-700">{selectedFile.name}</span>
                        <span className="text-xs text-slate-500 bg-slate-200/60 px-2 py-1 rounded-full">
                          ({(selectedFile.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Show loading status if file is uploading */}
                  {fileUploading && (
                    <div className="mt-3 text-center text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                      ফাইল আপলোড হচ্ছে...
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-50/30">
                <div className="text-center p-8 max-w-md">
                  <div className="w-28 h-28 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto mb-8 flex items-center justify-center shadow-sm">
                    <MessageCircle className="h-14 w-14 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                    আপনার বার্তা
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-8">
                    {loadingConversations ? 
                      'কথোপকথন লোড হচ্ছে...' : 
                      conversations.length === 0 ?
                        'আপনার এখনও কোনো কথোপকথন নেই। বই ব্রাউজ করুন এবং বিক্রেতার সাথে যোগাযোগ করুন।' :
                        'বাম পাশের তালিকা থেকে একটি কথোপকথন নির্বাচন করুন অথবা নতুন বার্তা পাঠান।'
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      className="md:hidden bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                      onClick={() => setShowMobileSidebar(true)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      কথোপকথন দেখুন
                    </Button>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                      <Link to="/browse">
                        <BookOpen className="h-4 w-4 mr-2" />
                        বই ব্রাউজ করুন
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Book Selection Dialog */}
      <AvailableBooksDialog 
        open={isBookSelectionOpen} 
        onOpenChange={setIsBookSelectionOpen} 
        sellerId={selectedReceiverId || undefined}
      />
    </div>
  );
};

export default MessagingPage;

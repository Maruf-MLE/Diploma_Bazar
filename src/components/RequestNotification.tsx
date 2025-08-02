import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Check, X, Bell, CalendarIcon, MapPin, AlertCircle, MessageSquare, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './ui/use-toast';
import { BookEntity } from '@/lib/BookEntity';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { countUnreadMessages } from '@/lib/MessageService';
import { createNotification } from '@/lib/NotificationService';

interface PurchaseRequest {
  id: string;
  book_id: string;
  buyer_id: string;
  seller_id: string;
  meetup_date: string;
  meetup_location: string;
  proposed_price: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  book?: BookEntity;
  buyer?: {
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id: string;
  is_read: boolean;
  created_at: string;
  sender_id?: string;
}

interface RequestNotificationProps {
  onNotificationChange?: (count: number) => void;
}

const RequestNotification: React.FC<RequestNotificationProps> = ({ onNotificationChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestDetails, setRequestDetails] = useState<PurchaseRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadMessageCount();
      
      // Subscribe to real-time notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New notification received:', payload);
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show toast notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000
            });
            
            // If it's a message notification, update message count
            if (newNotification.type === 'new_message') {
              fetchUnreadMessageCount();
            }
            
            updateNotificationCount([...notifications, newNotification]);
          }
        )
        .subscribe();
      
      // Subscribe to message changes to update message count
      const messageChannel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          () => {
            // Just update the unread count whenever there's a new message
            fetchUnreadMessageCount();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(messageChannel);
      };
    }
  }, [user]);

  const updateNotificationCount = (notifs: Notification[]) => {
    if (onNotificationChange) {
      onNotificationChange(notifs.length + messageCount);
    }
  };

  const fetchUnreadMessageCount = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await countUnreadMessages(user.id);
      if (error) throw error;
      
      setMessageCount(count);
      
      // Update total count for parent components
      updateNotificationCount(notifications);
    } catch (error) {
      console.error('Error counting unread messages:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .in('type', ['purchase_request', 'request_accepted', 'request_rejected', 'new_message'])
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      console.log('Fetched notifications:', data);
      setNotifications(data || []);
      updateNotificationCount(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format the meetup time
  const formatMeetupTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      // Format time as 12-hour with AM/PM
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      const formattedMinutes = minutes.toString().padStart(2, '0');
      
      return `${formattedHours}:${formattedMinutes} ${period}`;
    } catch (error) {
      return '';
    }
  };

  const fetchRequestDetails = async (requestId: string) => {
    try {
      console.log('Fetching request details for ID:', requestId);
      
      // Try fetching from the view first
      const { data: viewData, error: viewError } = await supabase
        .from('purchase_requests_with_details')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (!viewError && viewData) {
        console.log('Successfully fetched from view:', viewData);
        // Format the data to match the expected structure
        const purchaseRequest = {
          ...viewData,
          book: {
            id: viewData.book_id,
            title: viewData.book_title,
            author: viewData.book_author,
            price: viewData.original_price,
            cover_image_url: viewData.book_cover
          },
          buyer: {
            id: viewData.buyer_id,
            name: viewData.buyer_name,
            email: viewData.buyer_name,
            user_metadata: {
              name: viewData.buyer_name
            }
          }
        };
        
        setRequestDetails(purchaseRequest);
        setIsDialogOpen(true);
        return;
      }
      
      // Fallback to the original approach with separate queries
      console.log('Falling back to separate queries approach');
      
      // First fetch the purchase request without joins
      const { data: requestData, error: requestError } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (requestError) throw requestError;
      
      // Then fetch book details separately
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', requestData.book_id)
        .single();
        
      if (bookError) {
        console.error('Error fetching book details:', bookError);
      }
      
      // Then fetch buyer details separately
      const { data: buyerData, error: buyerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', requestData.buyer_id)
        .single();
        
      if (buyerError) {
        console.error('Error fetching buyer details:', buyerError);
      }
      
      // Combine all data
      const purchaseRequest = {
        ...requestData,
        book: bookData || null,
        buyer: {
          ...buyerData,
          email: buyerData?.email || 'Unknown',
          user_metadata: {
            name: buyerData?.name || 'Unknown User'
          }
        }
      };
      
      console.log('Combined request details:', purchaseRequest);
      setRequestDetails(purchaseRequest);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast({
        title: "ত্রুটি",
        description: "বই কেনার অনুরোধের বিস্তারিত লোড করা যায়নি।",
        variant: "destructive"
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    console.log('Clicked notification:', notification);
    console.log('Notification type:', notification.type);
    
    try {
      // Mark the notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      
      // Remove from the local state
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Update notification count
      updateNotificationCount(notifications.filter(n => n.id !== notification.id));
    
      // Handle different notification types
      if (notification.type === 'purchase_request') {
        console.log('Handling purchase_request notification');
        // For purchase request notifications, check if the current user is the buyer or seller
        if (notification.related_id) {
          console.log('Purchase request has related_id:', notification.related_id);
          // Get the purchase request details to determine buyer and seller
          const { data: requestData } = await supabase
            .from('purchase_requests')
            .select('*')
            .eq('id', notification.related_id)
            .single();
            
          console.log('Purchase request data:', requestData);
            
          if (requestData) {
            const { buyer_id, seller_id } = requestData;
            console.log('Current user:', user?.id);
            console.log('Buyer ID:', buyer_id);
            console.log('Seller ID:', seller_id);
            
            // If current user is the seller, navigate to messages with buyer as the conversation partner
            if (user?.id === seller_id) {
              console.log('User is seller, navigating to messages with buyer');
              window.location.href = `/messages?seller=${buyer_id}`;
              return;
            } 
            // If current user is the buyer, navigate to messages with seller as the conversation partner
            else if (user?.id === buyer_id) {
              console.log('User is buyer, navigating to messages with seller');
              window.location.href = `/messages?seller=${seller_id}`;
              return;
            }
          }
          // Only show dialog for sellers responding to purchase requests
          console.log('Showing request details dialog');
          fetchRequestDetails(notification.related_id);
        } else {
          // If no related_id, redirect to messages
          window.location.href = '/messages';
          return;
        }
      } 
      else if (notification.type === 'new_message') {
        console.log('Handling new_message notification');
        // For message notifications, check if sender_id is available first
        if (notification.sender_id) {
          console.log('Navigating to messages with sender:', notification.sender_id);
          window.location.href = `/messages?seller=${notification.sender_id}`;
          return;
        } else if (notification.related_id) {
          // If sender_id is not available, try to get it from the message
          const { data } = await supabase
            .from('messages')
            .select('sender_id')
            .eq('id', notification.related_id)
            .single();
            
          if (data && data.sender_id) {
            console.log('Found sender from message data:', data.sender_id);
            window.location.href = `/messages?seller=${data.sender_id}`;
            return;
          } else {
            // If all fails, just go to the messages page
            console.log('Fallback to messages page');
            window.location.href = '/messages';
            return;
          }
        } else {
          // Fallback to messages page
          console.log('No sender_id or related_id, fallback to messages page');
          window.location.href = '/messages';
          return;
        }
      } 
      else if (['request_accepted', 'request_rejected'].includes(notification.type)) {
        console.log('Handling request_accepted/request_rejected notification');
        // For request status notifications, similar logic as purchase_request
        if (notification.related_id) {
          console.log('Request has related_id:', notification.related_id);
          // Get the purchase request details
          const { data: requestData } = await supabase
            .from('purchase_requests')
            .select('*')
            .eq('id', notification.related_id)
            .single();
            
          console.log('Request data:', requestData);
            
          if (requestData) {
            const { buyer_id, seller_id } = requestData;
            console.log('Current user:', user?.id);
            console.log('Buyer ID:', buyer_id);
            console.log('Seller ID:', seller_id);
            
            // If current user is the seller, navigate to messages with buyer
            if (user?.id === seller_id) {
              console.log('User is seller, navigating to messages with buyer');
              window.location.href = `/messages?seller=${buyer_id}`;
              return;
            } 
            // If current user is the buyer, navigate to messages with seller
            else if (user?.id === buyer_id) {
              console.log('User is buyer, navigating to messages with seller');
              window.location.href = `/messages?seller=${seller_id}`;
              return;
            }
          }
          console.log('Fallback to messages with requestId');
          window.location.href = `/messages?requestId=${notification.related_id}`;
          return;
        } else {
          console.log('No related_id, fallback to messages page');
          window.location.href = '/messages';
          return;
        }
      } else {
        // For any other notification type, redirect to messages
        window.location.href = '/messages';
        return;
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      // Fallback navigation - always go to messages page
      window.location.href = '/messages';
      return;
    }
  };

  // Render notification icon based on notification type
  const renderNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'new_message':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Render notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'request_accepted':
        return 'bg-green-600';
      case 'request_rejected':
        return 'bg-red-600';
      case 'new_message':
        return 'bg-blue-600';
      default:
        return 'bg-primary';
    }
  };

  const handleAccept = async () => {
    if (!requestDetails) return;
    
    try {
      // Update the request status
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: 'accepted' })
        .eq('id', requestDetails.id);
      
      if (error) throw error;
      
      // Send notification to buyer using our notification service
      await createNotification({
        user_id: requestDetails.buyer_id,
        sender_id: user?.id,
        message: `আপনার "${requestDetails.book?.title || 'বই'}" কেনার অনুরোধ বিক্রেতা গ্রহণ করেছেন।`,
        type: 'request_accepted',
        related_id: requestDetails.id
      });
      
      toast({
        title: "অনুরোধ গৃহীত হয়েছে",
        description: "বই কেনার অনুরোধ গৃহীত হয়েছে এবং ক্রেতাকে জানানো হয়েছে।",
      });
      
      setIsDialogOpen(false);
      
      // Navigate to messages with the correct buyer ID as the seller parameter
      // (from the perspective of the seller looking at buyer messages)
      console.log('Navigating to messages with buyer:', requestDetails.buyer_id);
      const initialMessage = "আপনার অনুরোধ গ্রহণ করেছি।";
      navigate(`/messages?seller=${requestDetails.buyer_id}&initialMessage=${encodeURIComponent(initialMessage)}`);
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "ত্রুটি",
        description: "অনুরোধ গ্রহণে সমস্যা হয়েছে।",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    if (!requestDetails) return;
    
    try {
      // Update the request status
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status: 'rejected' })
        .eq('id', requestDetails.id);
      
      if (error) throw error;
      
      // Send notification to buyer using our notification service
      await createNotification({
        user_id: requestDetails.buyer_id,
        sender_id: user?.id,
        message: `আপনার "${requestDetails.book?.title || 'বই'}" কেনার অনুরোধ বিক্রেতা প্রত্যাখ্যান করেছেন।`,
        type: 'request_rejected',
        related_id: requestDetails.id
      });
      
      toast({
        title: "অনুরোধ বাতিল করা হয়েছে",
        description: "বই কেনার অনুরোধ বাতিল করা হয়েছে এবং ক্রেতাকে জানানো হয়েছে।",
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "ত্রুটি",
        description: "অনুরোধ বাতিল করতে সমস্যা হয়েছে।",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {notifications.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2">
          <TooltipProvider>
            {notifications.map((notification) => (
              <Tooltip key={notification.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    className={`${getNotificationColor(notification.type)} text-white rounded-full w-12 h-12 flex items-center justify-center animate-bounce shadow-lg`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {renderNotificationIcon(notification)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      )}
      
      {/* Message count indicator */}
      {messageCount > 0 && notifications.length === 0 && (
        <div className="fixed bottom-5 right-5 z-50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center animate-pulse shadow-lg"
                  onClick={() => navigate('/messages')}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {messageCount}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="font-semibold">আপনার {messageCount}টি অপঠিত বার্তা আছে</p>
                <p className="text-sm text-muted-foreground">ক্লিক করুন দেখতে</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">বই কেনার অনুরোধ</DialogTitle>
          </DialogHeader>
          
          {requestDetails && (
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <Label className="text-sm font-medium">ক্রেতার নাম</Label>
                <p>{requestDetails.buyer?.user_metadata?.name || requestDetails.buyer?.email || 'অজানা ব্যক্তি'}</p>
              </div>
              
              <div className="flex flex-col space-y-1">
                <Label className="text-sm font-medium">বইয়ের নাম</Label>
                <p className="font-semibold">{requestDetails.book?.title || 'অজানা বই'}</p>
              </div>
              
              {requestDetails.book?.author && (
                <div className="flex flex-col space-y-1">
                  <Label className="text-sm font-medium">লেখক</Label>
                  <p>{requestDetails.book.author}</p>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">মিটআপ তারিখ</Label>
                <p>{requestDetails.meetup_date ? format(new Date(requestDetails.meetup_date), 'PP') : 'তারিখ নির্ধারিত নয়'}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">সময়</Label>
                <p>{requestDetails.meetup_date ? formatMeetupTime(requestDetails.meetup_date) : 'সময় নির্ধারিত নয়'}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">মিটআপ স্থান</Label>
                <p>{requestDetails.meetup_location || 'স্থান নির্ধারিত নয়'}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">প্রস্তাবিত মূল্য</Label>
                <p className="font-bold">৳{requestDetails.proposed_price}</p>
                {requestDetails.book?.price !== undefined && requestDetails.proposed_price !== requestDetails.book.price && (
                  <Badge variant="outline" className="ml-2">মূল: ৳{requestDetails.book.price}</Badge>
                )}
              </div>
              
              {requestDetails.message && (
                <div className="flex flex-col space-y-1">
                  <Label className="text-sm font-medium">অতিরিক্ত তথ্য</Label>
                  <p className="text-sm text-muted-foreground">{requestDetails.message}</p>
                </div>
              )}
              
              <DialogFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleReject} className="border-red-500 text-red-500 hover:bg-red-50">
                  <X className="mr-2 h-4 w-4" />
                  অনুরোধ বাতিল করুন
                </Button>
                <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
                  <Check className="mr-2 h-4 w-4" />
                  অনুরোধ গ্রহণ করুন
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RequestNotification; 
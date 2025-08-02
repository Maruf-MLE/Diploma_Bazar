import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { BookEntity } from '@/lib/BookEntity';
import BookPurchaseRequestCard from './BookPurchaseRequestCard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { sendMessage } from '@/lib/MessageService';
import { createNotification } from '@/lib/NotificationService';
import { useVerificationCheck } from '@/lib/verification';

// Define the PurchaseRequest type
type PurchaseRequest = {
  id: string;
  book_id: string;
  buyer_id: string;
  seller_id: string;
  meetup_date: string;
  meetup_location: string;
  proposed_price: number;
  message: string;
  status: string;
  created_at: string;
  book?: BookEntity;
  buyer_name?: string;
};

interface BookRequestButtonProps {
  className?: string;
  buttonSize?: 'default' | 'sm' | 'lg';
  book: BookEntity;
  sellerId: string;
  onPurchaseRequestSent?: () => void;
}

const BookRequestButton: React.FC<BookRequestButtonProps> = ({ className = '', buttonSize = 'default', book, sellerId, onPurchaseRequestSent }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkAndShowWarning } = useVerificationCheck();
  
  // States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load purchase requests
  useEffect(() => {
    if (!user || !book.id) return;
    
    const fetchPurchaseRequests = async () => {
      try {
        setLoading(true);
        
        // Query purchase requests for this book - সঠিক কুয়েরি পদ্ধতি ব্যবহার করা
        const { data, error } = await supabase
          .from('purchase_requests')
          .select('*')
          .eq('book_id', book.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching purchase requests:', error);
          return;
        }
        
        if (!data || data.length === 0) {
          setRequests([]);
          setPendingCount(0);
          return;
        }
        
        try {
          // Get buyer names separately to avoid foreign key relationship error
          const requestsWithNames = await Promise.all(
            data.map(async (request) => {
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
          
          setRequests(requestsWithNames);
          
          // Count pending requests - use string comparison to avoid TypeScript errors
          const pendingRequests = requestsWithNames.filter(
            (req) => req.status && String(req.status) === 'pending'
          );
          setPendingCount(pendingRequests.length);
        } catch (profileError) {
          console.error('Error processing purchase requests:', profileError);
          // Still set the requests without buyer names
          const basicRequests = data.map(request => ({
            ...request,
            buyer_name: 'অজানা ব্যবহারকারী'
          }));
          setRequests(basicRequests);
          
          // Count pending requests
          const pendingRequests = basicRequests.filter(
            (req) => req.status && String(req.status) === 'pending'
          );
          setPendingCount(pendingRequests.length);
        }
      } catch (error) {
        console.error('Error fetching purchase requests:', error);
        setRequests([]);
        setPendingCount(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPurchaseRequests();
    
    // Set up real-time listener for purchase requests
    const channel = supabase
      .channel(`purchase-requests-${book.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'purchase_requests',
        filter: `book_id=eq.${book.id}`
      }, () => {
        fetchPurchaseRequests();
      })
      .subscribe();
      
    return () => {
      channel.unsubscribe();
    };
  }, [user, book.id]);
  
  // Handle status change
  const handleStatusChange = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('purchase_requests')
        .update({ status })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, status } 
            : req
        )
      );
      
      // Update pending count - String comparison to avoid type errors
      if (String(status) !== 'pending') {
        setPendingCount(prev => Math.max(0, prev - 1));
      }
      
      // Show toast
      toast({
        title: status === 'accepted' ? 'অনুরোধ গৃহীত হয়েছে' : 'অনুরোধ প্রত্যাখ্যান করা হয়েছে',
        description: status === 'accepted' 
          ? 'বই কেনার অনুরোধ গৃহীত হয়েছে। ক্রেতার সাথে যোগাযোগ করুন।' 
          : 'বই কেনার অনুরোধ প্রত্যাখ্যান করা হয়েছে।'
      });
      
    } catch (error) {
      console.error('Error updating purchase request:', error);
      toast({
        title: 'ত্রুটি',
        description: 'অনুরোধের স্ট্যাটাস আপডেট করা যায়নি।',
        variant: 'destructive'
      });
    }
  };

  const handleSendRequest = async () => {
    if (!user) {
      toast({
        title: 'প্রবেশ করুন',
        description: 'অনুরোধ পাঠাতে আপনাকে লগইন করতে হবে',
        variant: 'destructive',
      });
      return;
    }

    if (user.id === sellerId) {
      toast({
        title: 'ত্রুটি',
        description: 'আপনি নিজের বইয়ের জন্য অনুরোধ পাঠাতে পারবেন না।',
        variant: 'destructive',
      });
      return;
    }

    // ভেরিফিকেশন চেক করি
    const isVerified = await checkAndShowWarning(user.id, 'message');
    if (!isVerified) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const initialMessage = `আমি "${book.title}" বইটি কিনতে আগ্রহী। দয়া করে আমার অনুরোধ বিবেচনা করুন।`;
      
      const { data, error } = await sendMessage(
        user.id, 
        sellerId, 
        initialMessage,
        book.id
      );

      if (error || !data) {
        throw error || new Error('মেসেজ পাঠানো যায়নি।');
      }

      // বিক্রেতাকে নোটিফিকেশন পাঠানো
      try {
        console.log('Creating notification for book purchase request');
        await createNotification({
          user_id: sellerId, // বিক্রেতার আইডি
          message: `${user.user_metadata?.name || 'একজন ব্যবহারকারী'} আপনার "${book.title}" বইটি কিনতে আগ্রহী।`,
          type: 'purchase_request',
          related_id: book.id,
          sender_id: user.id,
          action_url: `/messages?seller=${user.id}`
        });
        console.log('Notification created successfully');
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // নোটিফিকেশন তৈরিতে ব্যর্থ হলেও প্রক্রিয়া চালিয়ে যাওয়া
      }

      toast({
        title: 'সফল',
        description: 'আপনার বই কেনার অনুরোধ সফলভাবে পাঠানো হয়েছে।',
        variant: 'default',
      });

      if (onPurchaseRequestSent) {
        onPurchaseRequestSent();
      }
      
      const encodedMessage = encodeURIComponent(initialMessage);
      navigate(`/messages?seller=${sellerId}&bookId=${book.id}&initialMessage=${encodedMessage}`);

    } catch (error) {
      console.error('Error sending purchase request:', error);
      toast({
        title: 'ত্রুটি',
        description: 'অনুরোধ পাঠানো যায়নি। দয়া করে পরবর্তীতে চেষ্টা করুন।',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size={buttonSize}
        className={`relative border-primary/30 hover:bg-primary/10 ${className}`}
        onClick={() => setIsDialogOpen(true)}
        disabled={isSubmitting}
        key={`book-request-button-${book.id}`}
      >
        <ShoppingBag className="h-4 w-4 mr-2" />
        বই নেওয়ার অনুরোধ
        {pendingCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
          >
            {pendingCount}
          </Badge>
        )}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              বই নেওয়ার অনুরোধসমূহ
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>অনুরোধ লোড হচ্ছে...</p>
              </div>
            ) : requests.length > 0 ? (
              requests.map(request => (
                <BookPurchaseRequestCard
                  key={request.id}
                  request={request as any}
                  isOwn={false}
                  onStatusChange={(status) => handleStatusChange(request.id, status)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  কোনো অনুরোধ নেই
                </h3>
                <p className="text-muted-foreground">
                  আপনার কাছে এখনো কোনো বই কেনার অনুরোধ আসেনি
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookRequestButton; 
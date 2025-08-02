import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CalendarIcon, MapPin, AlertCircle, CheckCircle, X, Star, Flag, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/use-toast';
import { BookEntity } from '@/lib/BookEntity';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import RatingDialog from './RatingDialog';
import ReportDialog from './ReportDialog';
import { createNotification } from '@/lib/NotificationService';
import { useAuth } from '@/contexts/AuthContext';

interface PurchaseRequest {
  id: string;
  book_id: string;
  buyer_id: string;
  seller_id: string;
  meetup_date: string;
  meetup_location: string;
  proposed_price: number;
  message: string;
  status: string; // 'pending' | 'accepted' | 'rejected'
  created_at: string;
  book?: BookEntity;
  buyer_name?: string;
}

interface BookPurchaseRequestCardProps {
  request: PurchaseRequest;
  isOwn: boolean;
  onStatusChange?: (status: 'accepted' | 'rejected') => void;
}

const BookPurchaseRequestCard = ({ request, isOwn, onStatusChange }: BookPurchaseRequestCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [purchaseHistoryId, setPurchaseHistoryId] = useState<string | null>(null);
  const [hasAlreadyReported, setHasAlreadyReported] = useState(false);

  useEffect(() => {
    const fetchPurchaseHistoryId = async () => {
      if (request.status !== 'accepted') return;
      
      try {
        const { data, error } = await supabase
          .from('purchase_history')
          .select('id')
          .eq('purchase_request_id', request.id)
          .single();
        
        if (error) {
          console.error('Error fetching purchase history ID:', error);
          return;
        }
        
        if (data) {
          setPurchaseHistoryId(data.id);
          
          // Check if the user has already reported for this transaction
          checkIfAlreadyReported(data.id);
        }
      } catch (error) {
        console.error('Error in fetchPurchaseHistoryId:', error);
      }
    };
    
    fetchPurchaseHistoryId();
  }, [request.id, request.status]);
  
  // Function to check if the user has already reported the other party for this transaction
  const checkIfAlreadyReported = async (historyId: string) => {
    if (!user) return;
    
    try {
      // Get the ID of the other party (the one who would be reported)
      const otherPartyId = isOwn ? request.seller_id : request.buyer_id;
      
      // Check if a report exists for this transaction
      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .eq('reporter_id', user.id)
        .eq('reported_user_id', otherPartyId)
        .eq('transaction_id', historyId);
        
      if (error) {
        console.error('Error checking for existing reports:', error);
        return;
      }
      
      // If there are any reports, the user has already reported
      if (data && data.length > 0) {
        setHasAlreadyReported(true);
      }
    } catch (error) {
      console.error('Error checking report status:', error);
    }
  };
  
  const handleAccept = async () => {
    if (isOwn) return;
    
    try {
      setLoading(true);
      
      // First, create a purchase history record in a transaction
      const { error: transactionError } = await supabase.rpc('accept_purchase_request', {
        request_id: request.id
      });
      
      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw transactionError;
      }
      
      // Show success toast
      toast({
        title: "অনুরোধ গৃহীত হয়েছে",
        description: "বইটি বিক্রয় হয়েছে এবং মার্কেটপ্লেস থেকে সরানো হয়েছে।",
      });
      
      // Create notification for the buyer using our notification service
      await createNotification({
        user_id: request.buyer_id,
        sender_id: user?.id,
        message: `আপনার "${request.book?.title || 'বই'}" কেনার অনুরোধ বিক্রেতা গ্রহণ করেছেন।`,
        type: 'request_accepted',
        related_id: request.id
      });
      
      // Notify parent component about the status change
      if (onStatusChange) {
        // অনুরোধ গ্রহণ করার পর প্যারেন্ট কম্পোনেন্টকে জানানো
        onStatusChange('accepted');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "ত্রুটি",
        description: "অনুরোধ গ্রহণ করতে সমস্যা হয়েছে।",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleReject = async () => {
    if (isOwn) return;
    
    try {
      setLoading(true);
      
      // Update the request status using RPC function instead of direct update
      // This will bypass RLS issues since the RPC function can be given appropriate permissions
      const { error: rpcError } = await supabase.rpc('reject_purchase_request', {
        request_id: request.id
      });
      
      if (rpcError) {
        console.error('RPC error:', rpcError);
        throw rpcError;
      }
      
      // Show success toast
      toast({
        title: "অনুরোধ প্রত্যাখ্যান করা হয়েছে",
        description: "আপনি বই কেনার অনুরোধটি প্রত্যাখ্যান করেছেন।",
      });
      
      // Create notification for the buyer using our notification service
      await createNotification({
        user_id: request.buyer_id,
        sender_id: user?.id,
        message: `আপনার "${request.book?.title || 'বই'}" কেনার অনুরোধ বিক্রেতা প্রত্যাখ্যান করেছেন।`,
        type: 'request_rejected',
        related_id: request.id
      });
      
      // Notify parent component about the status change
      if (onStatusChange) {
        // অনুরোধ প্রত্যাখ্যান করার পর প্যারেন্ট কম্পোনেন্টকে জানানো
        onStatusChange('rejected');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "ত্রুটি",
        description: "অনুরোধ প্রত্যাখ্যান করতে সমস্যা হয়েছে।",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransactionHistory = () => {
    if (request.status === 'accepted') {
      // নিজের প্রোফাইলের কেনাকাটা ট্যাবে রিডাইরেক্ট করা
      navigate(`/profile?tab=purchases`);
    }
  };

  // Format the meetup date
  const formatMeetupDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'PPP', { locale: bn });
    } catch (error) {
      return dateStr;
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

  // Determine the status badge color and text
  const getStatusBadge = () => {
    switch (request.status) {
      case 'accepted':
        return <Badge className="bg-green-600 hover:bg-green-700">গৃহীত</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600 hover:bg-red-700">প্রত্যাখ্যাত</Badge>;
      default:
        return <Badge className="bg-amber-500 hover:bg-amber-600">অপেক্ষমান</Badge>;
    }
  };

  const handleOpenRatingDialog = () => {
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'রেটিং দিতে লগইন করুন',
        variant: 'destructive'
      });
      return;
    }
    
    setIsRatingDialogOpen(true);
  };

  const handleOpenReportDialog = () => {
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'রিপোর্ট করতে লগইন করুন',
        variant: 'destructive'
      });
      return;
    }
    
    if (hasAlreadyReported) {
      toast({
        title: 'রিপোর্ট সীমা',
        description: 'আপনি ইতিমধ্যে এই লেনদেনের জন্য একটি রিপোর্ট করেছেন',
        variant: 'destructive'
      });
      return;
    }
    
    setIsReportDialogOpen(true);
  };

  return (
    <>
      <Card className={`border ${
        isOwn ? 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800' 
             : 'border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800'
      } shadow-sm`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="text-md font-medium">
              {isOwn ? 'আপনার বই কেনার অনুরোধ' : `${request.buyer_name || 'একজন ক্রেতা'} বই কেনার অনুরোধ করেছেন`}
            </h3>
            {getStatusBadge()}
          </div>
          
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>দেখা করার দিন: {formatMeetupDate(request.meetup_date)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>সময়: {formatMeetupTime(request.meetup_date)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>দেখা করার স্থান: {request.meetup_location}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span>প্রস্তাবিত মূল্য: ৳{request.proposed_price}</span>
            </div>
          </div>
          
          {request.message && (
            <div className="text-sm mt-2 p-2 bg-background rounded border border-border">
              <p className="font-medium mb-1">অতিরিক্ত তথ্য:</p>
              <p className="text-muted-foreground">{request.message}</p>
            </div>
          )}
        </CardContent>
        
        {!isOwn && request.status === 'pending' && (
          <CardFooter className="p-3 pt-0 flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-red-300 hover:bg-red-200 hover:text-red-800 dark:hover:bg-red-800 dark:hover:text-red-100 font-medium" 
              onClick={handleReject}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-1" /> প্রত্যাখ্যান
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-green-300 hover:bg-green-200 hover:text-green-800 dark:hover:bg-green-800 dark:hover:text-green-100 font-medium" 
              onClick={handleAccept}
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> গ্রহণ
            </Button>
          </CardFooter>
        )}
        
        {isOwn && request.status === 'pending' && (
          <CardFooter className="p-3 pt-0">
            <div className="w-full text-center text-sm text-muted-foreground">
              <p>আপনার বই কেনার অনুরোধ পাঠানো হয়েছে</p>
            </div>
          </CardFooter>
        )}
        
        {request.status === 'accepted' && (
          <CardFooter className="p-3 pt-0 bg-green-100/50 dark:bg-green-900/20 flex-col gap-3">
            <div className="w-full flex flex-col items-center justify-center gap-2 text-sm text-green-700 dark:text-green-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <p>অনুরোধটি গৃহীত হয়েছে!</p>
              </div>
              <p className="text-sm text-center mt-1 font-medium">
                {isOwn ? 
                  `বিক্রেতা আপনার বই কেনার অনুরোধটি গ্রহণ করেছেন। আপনারা ${formatMeetupDate(request.meetup_date)} তারিখে ${formatMeetupTime(request.meetup_date)} সময়ে ${request.meetup_location} গিয়ে ৳${request.proposed_price} টাকা দিয়ে বইয়ের লেনদেন করবেন।` : 
                  `আপনি এই বই কেনার অনুরোধটি গ্রহণ করেছেন। আপনারা ${formatMeetupDate(request.meetup_date)} তারিখে ${formatMeetupTime(request.meetup_date)} সময়ে ${request.meetup_location} গিয়ে ৳${request.proposed_price} টাকা দিয়ে বইয়ের লেনদেন করবেন।`}
              </p>
              <Button 
                variant="link" 
                size="sm"
                className="text-primary text-xs p-0 h-auto hover:text-primary-focus hover:underline font-medium"
                onClick={handleViewTransactionHistory}
              >
                কেনাবেচার ইতিহাস দেখুন
              </Button>
            </div>

            {/* Add Rating and Report buttons for accepted requests */}
            <div className="w-full flex justify-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-300 hover:bg-yellow-200 hover:text-yellow-800 dark:hover:bg-yellow-800 dark:hover:text-yellow-100 font-medium"
                onClick={handleOpenRatingDialog}
              >
                <Star className="h-4 w-4 mr-1" /> রেটিং দিন
              </Button>
              {!hasAlreadyReported && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 hover:bg-red-200 hover:text-red-800 dark:hover:bg-red-800 dark:hover:text-red-100 font-medium"
                  onClick={handleOpenReportDialog}
                >
                  <Flag className="h-4 w-4 mr-1" /> রিপোর্ট করুন
                </Button>
              )}
            </div>
          </CardFooter>
        )}
        
        {request.status === 'rejected' && (
          <CardFooter className="p-3 pt-0 bg-red-100/50 dark:bg-red-900/20 flex-col gap-3">
            <div className="w-full flex flex-col items-center justify-center gap-2 text-sm text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2">
                <X className="h-4 w-4" />
                <p>অনুরোধটি প্রত্যাখ্যাত হয়েছে</p>
              </div>
              <p className="text-sm text-center mt-1 font-medium">
                {isOwn ? 
                  `বিক্রেতা আপনার বই কেনার অনুরোধটি প্রত্যাখ্যান করেছেন। আপনি অন্য বইয়ের জন্য অনুরোধ করতে পারেন অথবা বিক্রেতার সাথে আলোচনা করতে পারেন।` : 
                  `আপনি এই বই কেনার অনুরোধটি প্রত্যাখ্যান করেছেন। ক্রেতাকে এ বিষয়ে অবহিত করা হয়েছে।`}
              </p>
            </div>
            
            {/* Remove the report button section entirely */}
          </CardFooter>
        )}
      </Card>

      {/* Rating Dialog */}
      <RatingDialog
        open={isRatingDialogOpen}
        onOpenChange={setIsRatingDialogOpen}
        sellerId={isOwn ? request.seller_id : request.buyer_id}
        sellerName={isOwn ? request.book?.seller_name || 'বিক্রেতা' : request.buyer_name || 'ক্রেতা'}
        purchaseId={purchaseHistoryId || undefined}
        isBuyerReview={isOwn}
        isSellerReview={!isOwn}
        onRatingSubmit={() => {
          toast({
            title: 'রেটিং সাবমিট হয়েছে',
            description: 'ধন্যবাদ! আপনার রেটিং সফলভাবে সাবমিট হয়েছে।',
          });
        }}
      />

      {/* Report Dialog */}
      <ReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        userId={isOwn ? request.seller_id : request.buyer_id}
        userName={isOwn ? request.book?.seller_name || 'বিক্রেতা' : request.buyer_name || 'ক্রেতা'}
        transactionId={purchaseHistoryId || undefined}
        onReportSubmit={() => {
          setHasAlreadyReported(true);
          toast({
            title: 'রিপোর্ট সাবমিট হয়েছে',
            description: 'আপনার রিপোর্ট সফলভাবে সাবমিট হয়েছে।',
          });
        }}
      />
    </>
  );
};

export default BookPurchaseRequestCard; 
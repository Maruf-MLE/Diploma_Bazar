import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  sellerName: string;
  onRatingSubmit?: () => void;
  purchaseId?: string; // ট্রানজেকশন আইডি
  isBuyerReview?: boolean; // ক্রেতা রিভিউ দিচ্ছে কিনা
  isSellerReview?: boolean; // বিক্রেতা রিভিউ দিচ্ছে কিনা
}

const RatingDialog = ({ 
  open, 
  onOpenChange, 
  sellerId, 
  sellerName, 
  onRatingSubmit,
  purchaseId,
  isBuyerReview = false,
  isSellerReview = false
}: RatingDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false);
  
  // ডায়ালগ খোলার সময় চেক করি ইউজার আগে রিভিউ দিয়েছে কিনা
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!open || !user || !purchaseId) return;
      
      try {
        // পারচেজ আইডি দিয়ে রিভিউ আছে কিনা চেক করি
        if (purchaseId) {
          const { data, error } = await supabase
            .from('purchase_history')
            .select(isBuyerReview ? 'buyer_has_reviewed' : 'seller_has_reviewed')
            .eq('id', purchaseId)
            .single();
            
          if (error) {
            console.error('Error checking existing review:', error);
            return;
          }
          
          if (data) {
            // টাইপ ক্যাস্টিং করে এরর ঠিক করি
            const hasReviewed = isBuyerReview 
              ? !!(data as { buyer_has_reviewed: boolean }).buyer_has_reviewed
              : !!(data as { seller_has_reviewed: boolean }).seller_has_reviewed;
            
            setHasAlreadyReviewed(hasReviewed);
          }
        } else {
          // পুরানো সিস্টেমে চেক করি (পারচেজ আইডি ছাড়া)
          const { data, error } = await supabase
            .from('reviews')
            .select('id')
            .eq('reviewer_id', user.id)
            .eq('seller_id', sellerId)
            .maybeSingle();
            
          if (error) {
            console.error('Error checking existing review:', error);
            return;
          }
          
          setHasAlreadyReviewed(!!data);
        }
      } catch (error) {
        console.error('Error checking existing review:', error);
      }
    };
    
    checkExistingReview();
  }, [open, user, sellerId, purchaseId, isBuyerReview, isSellerReview]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'রেটিং দিতে লগইন করুন',
        variant: 'destructive'
      });
      return;
    }
    
    if (rating === 0) {
      toast({
        title: 'রেটিং প্রয়োজন',
        description: 'অনুগ্রহ করে একটি রেটিং নির্বাচন করুন',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Insert review into database
      const reviewData: any = {
        seller_id: sellerId,
        reviewer_id: user.id,
        rating: rating,
        comment: comment,
      };
      
      // যদি পারচেজ আইডি থাকে তাহলে সেটি যোগ করি
      if (purchaseId) {
        reviewData.purchase_id = purchaseId;
        reviewData.is_buyer_review = isBuyerReview;
        reviewData.is_seller_review = isSellerReview;
        reviewData.completed_transaction = true;
      }
      
      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);
      
      if (error) throw error;
      
      // Create notification for seller
      await supabase
        .from('notifications')
        .insert({
          user_id: sellerId,
          message: `${user.user_metadata?.name || 'একজন ব্যবহারকারী'} আপনাকে ${rating} স্টার রেটিং দিয়েছেন।`,
          type: 'new_rating',
          is_read: false
        });
      
      toast({
        title: 'রেটিং সাবমিট হয়েছে',
        description: 'আপনার রেটিং সফলভাবে সাবমিট হয়েছে',
      });
      
      // Reset form
      setRating(0);
      setComment('');
      
      // Close dialog
      onOpenChange(false);
      
      // Call callback if provided
      if (onRatingSubmit) {
        onRatingSubmit();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'ত্রুটি',
        description: 'রেটিং সাবমিট করতে সমস্যা হয়েছে',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isBuyerReview ? 'বিক্রেতাকে রেটিং দিন' : isSellerReview ? 'ক্রেতাকে রেটিং দিন' : 'রেটিং দিন'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {sellerName || (isBuyerReview ? 'বিক্রেতা' : isSellerReview ? 'ক্রেতা' : 'ব্যবহারকারী')}-কে আপনার অভিজ্ঞতা অনুযায়ী রেটিং দিন
          </DialogDescription>
        </DialogHeader>
        
        {hasAlreadyReviewed ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              আপনি ইতিমধ্যে এই লেনদেনের জন্য রেটিং দিয়েছেন।
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Rating */}
            <div className="flex justify-center py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={`h-8 w-8 cursor-pointer ${
                      (hoverRating || rating) >= star
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {/* Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="আপনার অভিজ্ঞতা সম্পর্কে লিখুন (ঐচ্ছিক)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                বাতিল
              </Button>
              <Button 
                type="submit"
                variant="rating-button"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    সাবমিট হচ্ছে...
                  </>
                ) : (
                  'সাবমিট করুন'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog; 
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { BookEntity } from '@/lib/BookEntity';
import { supabase } from '@/lib/supabase';
import { useToast } from './ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

interface BookPurchaseRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: BookEntity;
}

const BookPurchaseRequestForm = ({ open, onOpenChange, book }: BookPurchaseRequestFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [isCheckingInstitution, setIsCheckingInstitution] = useState(false);

  const [formData, setFormData] = useState({
    meetupDate: '',
    meetupLocation: '',
    proposedPrice: book.price.toString(),
    message: '',
  });

  // Fetch seller profile when component mounts
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!book?.seller_id) return;
      
      setIsCheckingInstitution(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', book.seller_id)
          .single();
          
        if (error) throw error;
        setSellerProfile(data);
        
        // Check if institutions match
        if (user && profile && data) {
          if (profile.institute_name !== data.institute_name) {
            onOpenChange(false);
            navigate('/not-allowed');
          }
        }
      } catch (error) {
        console.error('Error fetching seller profile:', error);
      } finally {
        setIsCheckingInstitution(false);
      }
    };
    
    if (open) {
      fetchSellerProfile();
    }
  }, [book?.seller_id, navigate, onOpenChange, open, profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "লগইন করুন",
        description: "অনুরোধ পাঠাতে আপনাকে প্রথমে লগইন করতে হবে।",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    // Check institution match before submitting
    if (profile && sellerProfile && profile.institute_name !== sellerProfile.institute_name) {
      toast({
        title: "অনুমতি নেই",
        description: "এই বইটি আপনার প্রতিষ্ঠানের কোনো বিক্রেতার বই নয়",
        variant: "destructive",
      });
      onOpenChange(false);
      navigate('/not-allowed');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Creating purchase request with data:', {
        book_id: book.id,
        buyer_id: user.id,
        seller_id: book.seller_id,
        meetup_date: formData.meetupDate,
        meetup_location: formData.meetupLocation,
        proposed_price: formData.proposedPrice
      });
      
      // Create purchase request
      const { data: purchaseData, error: requestError } = await supabase
        .from('purchase_requests')
        .insert({
          book_id: book.id,
          buyer_id: user.id,
          seller_id: book.seller_id,
          meetup_date: new Date(formData.meetupDate).toISOString(),
          meetup_location: formData.meetupLocation,
          proposed_price: parseFloat(formData.proposedPrice),
          message: formData.message,
          status: 'pending'
        })
        .select();
      
      if (requestError) throw requestError;
      
      console.log('Purchase request created:', purchaseData);
      
      // Create a notification for the seller
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: book.seller_id,
          title: `${user.email} আপনার "${book.title}" বইটি কেনার অনুরোধ করেছেন`,
          message: `বই কেনার অনুরোধ: ${formData.message}`,
          type: 'purchase_request',
          related_id: purchaseData?.[0]?.id,
          is_read: false
        });
        
      if (notifError) {
        console.error('Error creating notification:', notifError);
        throw notifError;
      }
      
      console.log('Notification created:', notifData);
      
      // Close the dialog
      onOpenChange(false);
      
      // Show success message
      toast({
        title: "অনুরোধ পাঠানো হয়েছে",
        description: "বিক্রেতাকে আপনার অনুরোধ পাঠানো হয়েছে।",
      });

      // Navigate to messaging page with query parameters
      // Create initial message
      const initialMessage = `আমি "${book.title}" বইটি কিনতে আগ্রহী। দয়া করে আমার অনুরোধ বিবেচনা করুন।`;
      navigate(`/messages?seller=${book.seller_id}&bookId=${book.id}&initialMessage=${encodeURIComponent(initialMessage)}`);
      
    } catch (error) {
      console.error('Error creating purchase request:', error);
      toast({
        title: "ত্রুটি",
        description: "অনুরোধ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingInstitution) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>অনুগ্রহ করে অপেক্ষা করুন...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">বই কেনার অনুরোধ</DialogTitle>
          <DialogDescription>
            বই কেনার জন্য বিক্রেতার সাথে দেখা করার তথ্য দিন
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-start">
              <Label className="text-sm font-medium mb-1">বইয়ের নাম</Label>
              <p className="text-foreground font-medium">{book.title}</p>
            </div>
            
            <div className="flex flex-col items-start">
              <Label className="text-sm font-medium mb-1">লেখক</Label>
              <p className="text-muted-foreground">{book.author}</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="meetupDate" className="text-sm font-medium">কখন বই নিবেন?</Label>
              <Input 
                id="meetupDate" 
                name="meetupDate" 
                type="date" 
                required
                value={formData.meetupDate}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="meetupLocation" className="text-sm font-medium">কোথায় বই নিবেন?</Label>
              <Input 
                id="meetupLocation" 
                name="meetupLocation" 
                placeholder="লোকেশন (যেমন: কফি শপ, ক্যাম্পাস)"
                required
                value={formData.meetupLocation}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="proposedPrice" className="text-sm font-medium">প্রস্তাবিত মূল্য (৳)</Label>
              <Input 
                id="proposedPrice" 
                name="proposedPrice" 
                type="number" 
                min="0"
                required
                value={formData.proposedPrice}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="message" className="text-sm font-medium">অতিরিক্ত তথ্য</Label>
              <Textarea 
                id="message" 
                name="message" 
                placeholder="বই কেনা সম্পর্কে আপনার অতিরিক্ত যে কোন তথ্য..."
                rows={3}
                value={formData.message}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              বাতিল
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  অপেক্ষা করুন...
                </>
              ) : (
                'বই কেনার অনুরোধ পাঠান'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookPurchaseRequestForm; 
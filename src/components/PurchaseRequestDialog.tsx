import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookEntity } from '@/lib/BookEntity';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { createNotification } from '@/lib/NotificationService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { CalendarIcon, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVerificationCheck } from '@/lib/verification';

interface PurchaseRequestDialogProps {
  book: BookEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PurchaseRequestDialog = ({ book, open, onOpenChange }: PurchaseRequestDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { checkAndShowWarning } = useVerificationCheck();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [time, setTime] = useState('14:00'); // Default time: 2:00 PM
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState(book.price.toString());
  const [message, setMessage] = useState('');
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [isCheckingInstitution, setIsCheckingInstitution] = useState(false);
  
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
        
        // Check if user is admin
        if (user) {
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          // If user is admin, allow access regardless of institution
          if (adminData) {
            setIsCheckingInstitution(false);
            return;
          }
        }
        
        // Check if institutions match for non-admin users
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
  
  // Format date in Bengali
  const formatMeetupDate = (date: Date | undefined) => {
    if (!date) return '';
    try {
      return format(date, 'PPP', { locale: bn });
    } catch (error) {
      return date.toLocaleDateString('bn-BD');
    }
  };

  // Combine date and time into a single Date object
  const combineDateAndTime = (date: Date | undefined, timeString: string): Date => {
    if (!date) return new Date();
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const combinedDate = new Date(date);
    combinedDate.setHours(hours, minutes, 0, 0);
    
    return combinedDate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'অনুরোধ পাঠাতে লগইন করুন',
        variant: 'destructive'
      });
      return;
    }
    
    // ভেরিফিকেশন চেক করি
    const isVerified = await checkAndShowWarning(user.id, 'message');
    if (!isVerified) {
      onOpenChange(false);
      return;
    }
    
    // Check if user is admin before institution check
    try {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      // If user is admin, skip institution check
      if (adminData) {
        // Continue with purchase request
      } else {
        // Check institution match before submitting for non-admin users
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
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      
      // Fall back to regular institution check if admin check fails
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
    }
    
    if (!date || !location || !time) {
      toast({
        title: 'তথ্য অসম্পূর্ণ',
        description: 'সব প্রয়োজনীয় তথ্য দিন',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Combine date and time
      const meetupDateTime = combineDateAndTime(date, time);
      
      // Create purchase request in database
      const { data, error } = await supabase
        .from('purchase_requests')
        .insert({
          book_id: book.id,
          buyer_id: user.id,
          seller_id: book.seller_id,
          meetup_date: meetupDateTime.toISOString(),
          meetup_location: location,
          proposed_price: parseFloat(price),
          message: message,
          status: 'pending'
        })
        .select();
      
      if (error) throw error;
      
      // Create notification for the seller
      await createNotification({
        user_id: book.seller_id,
        sender_id: user.id,
        message: `${user.user_metadata?.name || 'একজন ব্যবহারকারী'} আপনার "${book.title}" বইটি কিনতে চায়।`,
        type: 'purchase_request',
        related_id: book.id
      });
      
      toast({
        title: 'অনুরোধ পাঠানো হয়েছে',
        description: 'আপনার বই কেনার অনুরোধ বিক্রেতার কাছে পাঠানো হয়েছে',
      });
      
      onOpenChange(false);
      
      // Format time for the message
      const formattedTime = time.split(':').map(Number);
      const timeStr = formattedTime[0] >= 12 
        ? `${formattedTime[0] === 12 ? 12 : formattedTime[0] - 12}:${formattedTime[1].toString().padStart(2, '0')} PM`
        : `${formattedTime[0]}:${formattedTime[1].toString().padStart(2, '0')} AM`;
      
      // Navigate to the messages page with seller's ID as query parameter and include book ID and initial message
      const initialMessage = encodeURIComponent(`আমি "${book.title}" বইটি কিনতে আগ্রহী। ${formatMeetupDate(date)} তারিখে ${timeStr} সময়ে ${location} এ দেখা করতে চাই।`);
      navigate(`/messages?seller=${book.seller_id}&bookId=${book.id}&initialMessage=${initialMessage}`);
      
    } catch (error) {
      console.error('Error submitting purchase request:', error);
      toast({
        title: 'ত্রুটি',
        description: 'অনুরোধ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>বই কেনার অনুরোধ</DialogTitle>
          <DialogDescription>
            "{book.title}" বইটি কেনার জন্য নিচের ফর্মটি পূরণ করুন
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Pickup Date */}
          <div className="space-y-2">
            <Label htmlFor="date">কোন তারিখে বই নিতে চান?</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "তারিখ নির্বাচন করুন"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">সময়</Label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input 
                id="time" 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1"
                required
              />
            </div>
          </div>
          
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">মিটিং লোকেশন</Label>
            <Input 
              id="location" 
              placeholder="যেমন: ক্যাম্পাস গেট, সেন্ট্রাল লাইব্রেরি, টিএসসি ইত্যাদি" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          
          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">
              মূল্য {book.is_negotiable && <span className="text-xs text-muted-foreground">(আলোচনাসাপেক্ষ)</span>}
            </Label>
            <Input 
              id="price" 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={!book.is_negotiable}
              required
            />
          </div>
          
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">মেসেজ (ঐচ্ছিক)</Label>
            <Textarea 
              id="message" 
              placeholder="বিক্রেতার জন্য কোন বার্তা থাকলে এখানে লিখুন" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              বাতিল করুন
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  অনুরোধ পাঠানো হচ্ছে...
                </>
              ) : (
                'অনুরোধ পাঠান'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseRequestDialog; 
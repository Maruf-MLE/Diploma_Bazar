import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookEntity } from '@/lib/BookEntity';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Send, Loader2, MessageCircle, X, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { sendMessage } from '@/lib/MessageService';
import { supabase } from '@/lib/supabase';
import { useVerificationCheck } from '@/lib/verification';

// Predefined messages for quick selection
const predefinedMessages = [
  'আসসালামু আলাইকুম, বইটি কি এখনও পাওয়া যাবে?',
  'বইটির অবস্থা কেমন?',
  'দামটা কি চূড়ান্ত নাকি আলোচনা করা যাবে?'
];

// প্রোফাইলের জন্য প্রিডিফাইন্ড মেসেজ
const profilePredefinedMessages = [
  'আসসালামু আলাইকুম, আপনার কাছে কি বই আছে?',
  'আপনার সাথে কথা বলতে চাই',
  'আপনার প্রোফাইল দেখে যোগাযোগ করছি',
  'আপনি কি এখন বই বিক্রি করেন?'
];

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  bookId?: string;
  bookTitle?: string;
  book?: BookEntity | null;
}

const MessageDialog: React.FC<MessageDialogProps> = ({ 
  open, 
  onOpenChange, 
  recipientId, 
  recipientName,
  bookId, 
  bookTitle,
  book 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { checkAndShowWarning, isVerified } = useVerificationCheck();
  
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [checkingInstitution, setCheckingInstitution] = useState(true);
  const [sameInstitution, setSameInstitution] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // State to prevent multiple permission checks
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [permissionCheckStarted, setPermissionCheckStarted] = useState(false);
  
  // একবারই permission check করি যখন dialog খোলে
  useEffect(() => {
    const checkAllPermissions = async () => {
      // Prevent multiple checks
      if (permissionCheckStarted || permissionsChecked) {
        console.log('Permission check already started or completed, skipping...');
        return;
      }
      
      console.log('=== MessageDialog: Starting permission checks ===');
      console.log('Dialog open:', open);
      console.log('User exists:', !!user);
      console.log('User ID:', user?.id);
      console.log('Recipient ID:', recipientId);
      console.log('User profile exists:', !!profile);
      console.log('User profile institute:', profile?.institute_name);
      
      if (!user || !recipientId || !open) {
        console.log('Missing required data, aborting checks');
        setCheckingInstitution(false);
        return;
      }
      
      // যদি প্রোফাইল এখনো লোড না হয়ে থাকে তাহলে একটু অপেক্ষা করি
      if (!profile) {
        console.log('Profile not loaded yet, waiting...');
        setTimeout(() => {
          if (open && user && recipientId && !permissionCheckStarted) {
            checkAllPermissions();
          }
        }, 300);
        return;
      }
      
      try {
        setPermissionCheckStarted(true);
        setCheckingInstitution(true);
        
        // ১. প্রথমে সেলারের প্রোফাইল পাই
        console.log('Fetching seller profile...');
        const { data: sellerData, error: sellerError } = await supabase
          .from('profiles')
          .select('institute_name, name, avatar_url')
          .eq('id', recipientId)
          .single();
          
        if (sellerError) {
          console.error('Error fetching seller profile:', sellerError);
          throw sellerError;
        }
        
        console.log('Seller profile:', sellerData);
        setSellerProfile(sellerData);
        
        // ২. অ্যাডমিন চেক করি
        console.log('Checking if user is admin...');
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        // If user is admin, allow access regardless of institution
        if (adminData && !adminError) {
          console.log('🔑 User is admin, allowing access');
          setSameInstitution(true);
          setPermissionsChecked(true);
          setCheckingInstitution(false);
          return;
        }
        
        // ৩. প্রতিষ্ঠান ম্যাচ চেক করি
        console.log('Checking institution match...');
        console.log('User institute:', `"${profile?.institute_name}"`);
        console.log('Seller institute:', `"${sellerData?.institute_name}"`);
        
        if (profile && sellerData && profile.institute_name && sellerData.institute_name) {
          const userInstitute = profile.institute_name.trim().toLowerCase();
          const sellerInstitute = sellerData.institute_name.trim().toLowerCase();
          
          console.log('Normalized comparison:');
          console.log('User (normalized):', `"${userInstitute}"`);
          console.log('Seller (normalized):', `"${sellerInstitute}"`);
          
          if (userInstitute === sellerInstitute) {
            console.log('✅ Institutions match! Allowing message dialog');
            setSameInstitution(true);
            setPermissionsChecked(true);
            
            // ৪. ভেরিফিকেশন চেক (mandatory for messaging)
            if (!isVerified) {
              console.log('User not verified, checking verification status from server...');
              const verificationResult = await checkAndShowWarning(user.id, 'message');
              if (!verificationResult) {
                console.log('Verification check failed, closing dialog');
                setSameInstitution(false);
                setPermissionsChecked(true);
                onOpenChange(false);
                return;
              }
            }
          } else {
            console.log('❌ Institutions do not match');
            console.log('User:', `"${profile.institute_name.trim()}"`);
            console.log('Seller:', `"${sellerData.institute_name.trim()}"`);
            setSameInstitution(false);
            setPermissionsChecked(true);
            
            // Show toast notification
            toast({
              title: "মেসেজ পাঠানো যাবে না",
              description: "শুধুমাত্র একই প্রতিষ্ঠানের ব্যবহারকারীরা মেসেজ পাঠাতে পারবেন।",
              variant: "destructive",
            });
            
            // Close the dialog and redirect to not-allowed page
            setTimeout(() => {
              onOpenChange(false);
              navigate('/not-allowed');
            }, 1500); // Give time to read the toast
          }
        } else {
          console.log('❌ Missing institute information');
          console.log('Profile institute missing:', !profile?.institute_name);
          console.log('Seller institute missing:', !sellerData?.institute_name);
          setSameInstitution(false);
          setPermissionsChecked(true);
          
          // Show specific error message
          toast({
            title: "প্রতিষ্ঠানের তথ্য অসম্পূর্ণ",
            description: "মেসেজ পাঠাতে উভয় ব্যবহারকারীর প্রতিষ্ঠানের তথ্য থাকতে হবে।",
            variant: "destructive",
          });
          
          // Close the dialog and redirect to not-allowed page
          setTimeout(() => {
            onOpenChange(false);
            navigate('/not-allowed');
          }, 1500);
        }
      } catch (error) {
        console.error('Error in permission checks:', error);
        setSameInstitution(false);
        setPermissionsChecked(true);
        
        toast({
          title: "ত্রুটি",
          description: "মেসেজ পাঠানোর অনুমতি যাচাই করতে সমস্যা হয়েছে।",
          variant: "destructive",
        });
        
        // Close dialog on error
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } finally {
        setCheckingInstitution(false);
        console.log('=== MessageDialog: Permission checks completed ===');
      }
    };
    
    // শুধুমাত্র dialog খোলার সময় একবার চেক করি
    if (open && user && recipientId && profile && !permissionsChecked && !permissionCheckStarted) {
      checkAllPermissions();
    } else if (open && (!user || !recipientId)) {
      console.log('Missing required data for permission checks');
      setCheckingInstitution(false);
    }
  }, [open, user, recipientId, profile]); // Removed problematic dependencies
  
  // Focus the textarea when dialog opens
  useEffect(() => {
    if (open && textareaRef.current && sameInstitution) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, sameInstitution]);
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset all states
      setMessage('');
      setSending(false);
      setMessageSent(false);
      setSameInstitution(false);
      setCheckingInstitution(true);
      setSellerProfile(null);
      // Reset permission check states
      setPermissionsChecked(false);
      setPermissionCheckStarted(false);
      
      console.log('MessageDialog: All states reset on close');
    }
  }, [open]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user || !sameInstitution) return;
    
    // ভেরিফিকেশন চেক করি
    const isAllowed = await checkAndShowWarning(user.id, 'message');
    if (!isAllowed) {
      onOpenChange(false);
      return;
    }
    
    setSending(true);
    
    try {
      // Send message directly
      const { data, error } = await sendMessage(
        user.id,
        recipientId,
        message.trim(),
        bookId
      );
      
      if (error) throw error;
      
      // Show success state
      setMessageSent(true);
      
      // Show toast
      toast({
        title: "মেসেজ পাঠানো হয়েছে",
        description: "বিক্রেতা আপনার মেসেজ পেয়েছেন",
      });
      
      // Close dialog and redirect after a short delay
      setTimeout(() => {
        setMessage('');
        onOpenChange(false);
        
        // Navigate to messages page with seller and book ID
        // Add the initial message as a URL parameter
        const encodedMessage = encodeURIComponent(message.trim());
        const url = bookId 
          ? `/messages?seller=${recipientId}&bookId=${bookId}&initialMessage=${encodedMessage}`
          : `/messages?seller=${recipientId}&initialMessage=${encodedMessage}`;
          
        navigate(url);
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "ত্রুটি",
        description: "মেসেজ পাঠাতে সমস্যা হয়েছে",
        variant: "destructive",
      });
      setSending(false);
    }
  };
  
  const handleSelectPredefinedMessage = (predefinedMessage: string) => {
    setMessage(predefinedMessage);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const handleViewConversation = () => {
    // Navigate to messages page
    const url = bookId 
      ? `/messages?seller=${recipientId}&bookId=${bookId}`
      : `/messages?seller=${recipientId}`;
      
    navigate(url);
    onOpenChange(false);
  };
  
  // ব্যবহার করার জন্য সঠিক প্রিডিফাইন্ড মেসেজ নির্ধারণ করি
  const messagesToShow = bookId ? predefinedMessages : profilePredefinedMessages;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-3 sm:p-6 bg-background/95 backdrop-blur-sm border border-border shadow-lg overflow-hidden">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-base sm:text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="truncate">
              {sellerProfile?.name || recipientName || 'বিক্রেতা'}-কে মেসেজ দিন
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {bookId ? 'বইটি সম্পর্কে বিক্রেতাকে প্রশ্ন করুন বা আপনার আগ্রহ জানান' : 'ব্যবহারকারীকে মেসেজ পাঠান'}
          </DialogDescription>
        </DialogHeader>
        
        {book && bookTitle && (
        <div className="p-3 bg-muted/30 rounded-lg border border-border">
          <p className="font-medium text-foreground text-sm sm:text-base truncate">
              বই: {bookTitle || book.title}
          </p>
            {book && (
              <>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
            লেখক: {book.author}
          </p>
          <p className="text-base sm:text-lg font-bold text-primary mt-2">
            ৳{book.price}
          </p>
              </>
            )}
        </div>
        )}
        
        {checkingInstitution ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-3 text-sm">অনুগ্রহ করে অপেক্ষা করুন...</p>
          </div>
        ) : !user ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 my-2 sm:my-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-800 text-sm sm:text-base">লগইন প্রয়োজন</h3>
                <p className="text-xs sm:text-sm text-amber-700 mt-1">
                  মেসেজ পাঠাতে আগে লগইন করুন।
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200 h-8 text-xs sm:text-sm"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/login');
                  }}
                >
                  লগইন করুন
                </Button>
              </div>
            </div>
          </div>
        ) : !sameInstitution ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-2 sm:my-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="flex-1 overflow-hidden">
                <h3 className="font-medium text-red-800 text-sm sm:text-base">মেসেজ পাঠাতে অনুমতি নেই</h3>
                <p className="text-xs sm:text-sm text-red-700 mt-1">
                  শুধুমাত্র একই প্রতিষ্ঠানের ব্যবহারকারীরা একে অপরকে মেসেজ পাঠাতে পারবেন।
                </p>
                <div className="mt-2 text-xs sm:text-sm">
                  <p className="truncate"><span className="font-medium">আপনার প্রতিষ্ঠান:</span> {profile?.institute_name || 'অজানা'}</p>
                  <p className="truncate"><span className="font-medium">বিক্রেতার প্রতিষ্ঠান:</span> {sellerProfile?.institute_name || 'অজানা'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            {/* Predefined messages */}
            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pb-1">
              {messagesToShow.map((msg, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs py-2 px-3 h-auto min-h-[32px] whitespace-normal text-left justify-start"
                  onClick={() => handleSelectPredefinedMessage(msg)}
                  disabled={sending || messageSent}
                >
                  {msg}
                </Button>
              ))}
            </div>
            
            <div>
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="আপনার মেসেজ লিখুন..."
                className="min-h-20 sm:min-h-24 text-sm resize-none focus:ring-1 focus:ring-primary"
                disabled={sending || messageSent}
              />
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleViewConversation}
                className="text-xs h-9 order-1 sm:order-none"
              >
                সব মেসেজ দেখুন
              </Button>
              
              <div className="flex gap-2 order-0 sm:order-none">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="glass-button border border-border h-9 text-xs flex-1 sm:flex-none"
                  disabled={sending}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  বাতিল
                </Button>
                
                <Button
                  type="submit"
                  className="primary-button gap-1 sm:gap-2 h-9 text-xs flex-1 sm:flex-none"
                  disabled={!message.trim() || sending || messageSent}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      পাঠানো হচ্ছে...
                    </>
                  ) : messageSent ? (
                    <>
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      পাঠানো হয়েছে
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                      পাঠান
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog; 
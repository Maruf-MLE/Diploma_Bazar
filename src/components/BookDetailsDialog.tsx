import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { BookEntity } from '@/lib/BookEntity';
import { BookOpen, User, Calendar, Tag, MapPin, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import BookPurchaseRequestForm from './BookPurchaseRequestForm';
import { useAuth } from '@/contexts/AuthContext';
import MessageDialog from './MessageDialog';
import { useToast } from '@/hooks/use-toast';
import { useVerificationCheck } from '@/lib/verification';
import { canMessageUser, canPurchaseBook, INSTITUTE_MISMATCH_MESSAGES } from '@/lib/instituteUtils';

interface BookDetailsDialogProps {
  book: BookEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showPurchaseRequest?: boolean;
}

const BookDetailsDialog = ({ book, open, onOpenChange, showPurchaseRequest = false }: BookDetailsDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkAndShowWarning } = useVerificationCheck();
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  useEffect(() => {
    if (open && book) {
      console.log('BookDetailsDialog opened with book:', book);
    }
  }, [open, book]);
  
  // Open purchase form when showPurchaseRequest changes
  useEffect(() => {
    if (open && showPurchaseRequest) {
      setIsPurchaseFormOpen(true);
    }
  }, [open, showPurchaseRequest]);
  
  const handleContactSeller = async () => {
    if (!book) return;
    
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'বিক্রেতার সাথে যোগাযোগ করতে লগইন করুন',
        variant: 'destructive'
      });
      onOpenChange(false);
      navigate('/login');
      return;
    }
    
    // ভেরিফিকেশন চেক করি
    const isVerified = await checkAndShowWarning(user.id, 'message');
    if (!isVerified) {
      return;
    }
    
    // Institute matching চেক করি
    const { canMessage, error } = await canMessageUser(book.seller_id);
    if (!canMessage) {
      toast({
        title: 'মেসেজ পাঠানো যাবে না',
        description: error || INSTITUTE_MISMATCH_MESSAGES.MESSAGE,
        variant: 'destructive'
      });
      return;
    }
    
    // মেসেজ ডায়ালগ ওপেন করি
    setIsMessageDialogOpen(true);
  };
  
  const handlePurchaseRequest = async () => {
    if (!book || !user) return;
    
    // Institute matching চেক করি
    const { canPurchase, error } = await canPurchaseBook(book.id);
    if (!canPurchase) {
      toast({
        title: 'বই কেনার অনুরোধ পাঠানো যাবে না',
        description: error || INSTITUTE_MISMATCH_MESSAGES.PURCHASE,
        variant: 'destructive'
      });
      return;
    }
    
    setIsPurchaseFormOpen(true);
  };
  
  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return 'নতুন';
      case 'like_new': return 'নতুনের মতো';
      case 'good': return 'ভালো';
      case 'acceptable': return 'মোটামুটি';
      case 'poor': return 'পুরনো';
      default: return condition;
    }
  };
  
  if (!book) return null;
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">বইয়ের বিস্তারিত</DialogTitle>
            <DialogDescription>
              বইয়ের সম্পূর্ণ বিবরণ এবং বিক্রেতার তথ্য দেখুন
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6">
            <div className="flex gap-4">
              <div className="w-28 h-36 bg-muted rounded flex items-center justify-center overflow-hidden">
                {book.cover_image_url ? (
                  <img 
                    src={book.cover_image_url} 
                    alt={book.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">{book.title}</h2>
                <p className="text-muted-foreground">{book.author}</p>
                
                <div className="flex items-center mt-2 space-x-2">
                  <Badge variant={book.is_sold ? "destructive" : "default"}>
                    {book.is_sold ? 'বিক্রি হয়েছে' : 'বিক্রির জন্য উপলব্ধ'}
                  </Badge>
                  <Badge variant="outline">{getConditionLabel(book.condition)}</Badge>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-2xl font-bold text-primary">৳{book.price}</p>
                  {book.is_negotiable && (
                    <Badge variant="outline" className="text-xs">দর কষাকষি যোগ্য</Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">বিবরণ</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {book.description || 'কোন বিবরণ দেওয়া হয়নি।'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {book.category && (
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{book.category}</span>
                </div>
              )}
              
              {book.language && (
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{book.language}</span>
                </div>
              )}
              
              {book.created_at && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(book.created_at), 'PP')}
                  </span>
                </div>
              )}
              
              {book.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{book.location}</span>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={book.seller_avatar_url} />
                <AvatarFallback>
                  {book.seller_name ? book.seller_name.charAt(0) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{book.seller_name || 'অজানা বিক্রেতা'}</p>
                <p className="text-xs text-muted-foreground">বিক্রেতা</p>
              </div>
            </div>
            
            <DialogFooter className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={handleContactSeller}
                className="flex items-center"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                বিক্রেতার সাথে যোগাযোগ করুন
              </Button>
              
              {!book.is_sold && (
                <Button 
                  onClick={handlePurchaseRequest}
                  className="bg-primary hover:bg-primary/90"
                >
                  <User className="mr-2 h-4 w-4" />
                  বই কেনার অনুরোধ পাঠান
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      
      {book && (
        <>
        <BookPurchaseRequestForm
          open={isPurchaseFormOpen}
          onOpenChange={setIsPurchaseFormOpen}
          book={book}
        />
          
          <MessageDialog
            open={isMessageDialogOpen}
            onOpenChange={setIsMessageDialogOpen}
            recipientId={book.seller_id}
            recipientName={book.seller_name || 'অজানা বিক্রেতা'}
            bookId={book.id}
            bookTitle={book.title}
            book={book}
          />
        </>
      )}
    </>
  );
};

export default BookDetailsDialog; 
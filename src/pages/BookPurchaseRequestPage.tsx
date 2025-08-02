import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, BookOpen, Calendar, Tag, MapPin, ArrowLeft, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BookEntity } from '@/lib/BookEntity';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import PurchaseRequestDialog from '@/components/PurchaseRequestDialog';

const BookPurchaseRequestPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [book, setBook] = useState<BookEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  
  // Fetch book details
  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // First, get the book data
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .single();
        
        if (bookError) throw bookError;
        
        if (!bookData) {
          setError('বইটি খুঁজে পাওয়া যায়নি');
          return;
        }
        
        // Then, get the seller profile data separately
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name, avatar_url, institute_name')
          .eq('id', bookData.seller_id)
          .single();
        
        // Transform the data to match BookEntity
        const bookEntity: BookEntity = {
          ...bookData,
          seller_name: profileData?.name || 'অজানা বিক্রেতা',
          seller_avatar_url: profileData?.avatar_url,
          location: profileData?.institute_name
        };
        
        setBook(bookEntity);
      } catch (err) {
        console.error('Error fetching book details:', err);
        setError('বইয়ের বিস্তারিত লোড করতে সমস্যা হয়েছে');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookDetails();
  }, [id]);
  
  const handlePurchaseRequest = () => {
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'বই কেনার অনুরোধ পাঠাতে লগইন করুন',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    
    setIsPurchaseDialogOpen(true);
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
  
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'academic': return 'একাডেমিক';
      case 'fiction': return 'ফিকশন';
      case 'non_fiction': return 'নন-ফিকশন';
      case 'reference': return 'রেফারেন্স';
      case 'other': return 'অন্যান্য';
      default: return category;
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">বইয়ের বিস্তারিত লোড হচ্ছে...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <div className="max-w-md p-6 bg-background rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-center">ত্রুটি</h2>
              <p className="text-center text-muted-foreground mb-6">{error}</p>
              <div className="flex justify-center">
                <button 
                  onClick={() => navigate('/browse')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  বই ব্রাউজ করুন
                </button>
              </div>
            </div>
          </div>
        ) : book && (
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <Button 
              variant="ghost" 
              className="mb-6 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              পেছনে যান
            </Button>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="md:flex">
                {/* Book cover image */}
                <div className="md:w-1/3 bg-muted/30">
                  <div className="h-64 md:h-full w-full flex items-center justify-center overflow-hidden">
                    {book.cover_image_url ? (
                      <img 
                        src={book.cover_image_url} 
                        alt={book.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
                        <BookOpen className="h-16 w-16 text-primary/30" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Book details */}
                <div className="p-6 md:w-2/3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-1">{book.title}</h1>
                      <p className="text-muted-foreground">{book.author}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-4 space-x-2">
                    <Badge variant={book.status === 'sold' ? "destructive" : "default"}>
                      {book.status === 'sold' ? 'বিক্রিত' : 'বিক্রির জন্য উপলব্ধ'}
                    </Badge>
                    <Badge variant="outline">{getConditionLabel(book.condition)}</Badge>
                    {book.category && (
                      <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10">
                        {getCategoryLabel(book.category)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-3xl font-bold text-primary">৳{book.price}</p>
                    {book.is_negotiable && (
                      <Badge variant="outline" className="text-xs">দর কষাকষি যোগ্য</Badge>
                    )}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-foreground mb-2">বিবরণ</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {book.description || 'কোন বিবরণ দেওয়া হয়নি।'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {book.department && (
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{book.department}</span>
                        </div>
                      )}
                      
                      {book.publisher && (
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{book.publisher}</span>
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
                      
                      {book.location && book.location !== 'rgfertg' && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{book.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Seller info */}
                  <div className="flex items-center justify-between">
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
                  </div>
                  
                  {/* Purchase button */}
                  <div className="mt-8">
                    {book.status !== 'sold' && (
                      <Button 
                        onClick={handlePurchaseRequest}
                        className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg hover:from-primary/90 hover:to-accent/90 py-6 rounded-full transition-all duration-300"
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        বই কিনুন
                      </Button>
                    )}
                    
                    {book.status === 'sold' && (
                      <div className="text-center p-4 bg-destructive/10 rounded-lg">
                        <p className="text-destructive font-medium">এই বইটি ইতিমধ্যে বিক্রি হয়ে গেছে</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Purchase Request Dialog */}
      {book && (
        <PurchaseRequestDialog
          book={book}
          open={isPurchaseDialogOpen}
          onOpenChange={setIsPurchaseDialogOpen}
        />
      )}
    </div>
  );
};

export default BookPurchaseRequestPage; 
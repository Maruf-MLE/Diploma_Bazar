import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, BookOpen, User, Calendar, Tag, MapPin, MessageCircle, ArrowLeft, Heart, ShoppingCart, Percent, BookText, GraduationCap, School, ChevronRight, Image, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BookEntity, getBookById } from '@/lib/BookEntity';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import MessageDialog from '@/components/MessageDialog';
import PurchaseRequestDialog from '@/components/PurchaseRequestDialog';
import { useProfile } from '@/hooks/useProfile';
import { useVerificationCheck } from '@/lib/verification';

// 🛡️ Security imports
import { 
  sanitizeText, 
  validateAndSanitizeInput,
  logSecurityEvent 
} from '@/lib/securityUtils';

// Safe Text component
const SafeText = ({ children }: { children: string }) => {
  const safeText = sanitizeText(children || '');
  return <span>{safeText}</span>;
};
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { checkAndShowWarning } = useVerificationCheck();
  
  const [book, setBook] = useState<BookEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  
  // Wishlist state (with local storage persistence)
  const [isInWishlist, setIsInWishlist] = useState<boolean>(false);
  
  // State for message dialog
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  // State for purchase request dialog
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  
  // State for image gallery dialog
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Fetch seller profile
  const fetchSellerProfile = async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId)
        .single();
      
      if (error) throw error;
      setSellerProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching seller profile:', error);
      return null;
    }
  };
  
  // Check if user and book seller are from the same institution
  const checkInstitutionMatch = async (bookSellerInstitution: string | null) => {
    if (!user || !profile) return true; // If not logged in, allow viewing
    if (!bookSellerInstitution) return true; // If book has no institution data, allow viewing
    
    // Check if user is admin
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // If user is admin, allow access regardless of institution
      if (data) return true;
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
    
    // Compare institutions for non-admin users
    return profile.institute_name === bookSellerInstitution;
  };
  
  // Fetch book details
  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use getBookById to get book with seller information
        const { data: book, error } = await getBookById(id);
        
        if (error) throw error;
        if (!book) throw new Error('বই পাওয়া যায়নি');
        
        setBook(book);
        
        // Fetch seller profile for institution check
        if (book.seller_id) {
          const sellerData = await fetchSellerProfile(book.seller_id);
          
          // Check if institutions match
          if (user && profile && sellerData) {
            const institutionMatches = await checkInstitutionMatch(sellerData.institute_name);
            
            // If institutions don't match, redirect to not allowed page
            if (!institutionMatches) {
              navigate('/not-allowed');
              return;
            }
          }
        }
        
        // Load wishlist data from localStorage
        const wishlistData = localStorage.getItem('bookWishlist');
        const wishlist = wishlistData ? JSON.parse(wishlistData) : [];
        setIsInWishlist(wishlist.includes(id));
        
        // Check if we need to open purchase dialog from URL param
        const showPurchaseRequest = searchParams.get('purchase') === 'true';
        if (showPurchaseRequest) {
          setIsPurchaseDialogOpen(true);
        }
        
      } catch (err) {
        console.error('Error fetching book details:', err);
        setError(err instanceof Error ? err.message : 'বই লোড করতে সমস্যা হয়েছে');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookDetails();
  }, [id, navigate, searchParams, user, profile]);
  
  const handleContactSeller = async () => {
    if (!book) return;
    
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'বিক্রেতার সাথে যোগাযোগ করতে লগইন করুন',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    
    // ভেরিফিকেশন চেক করি
    const isVerified = await checkAndShowWarning(user.id, 'message');
    if (!isVerified) {
      return;
    }
    
    // Open message dialog instead of navigating
    setIsMessageDialogOpen(true);
  };
  
  const handlePurchaseRequest = async () => {
    if (!book) return;
    
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'বই কেনার অনুরোধ পাঠাতে লগইন করুন',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    
    // প্রতিষ্ঠানের মিল যাচাই করি
    if (sellerProfile) {
      const institutionMatches = await checkInstitutionMatch(sellerProfile.institute_name);
      if (!institutionMatches) {
        toast({
          title: 'অনুমতি নেই',
          description: 'শুধুমাত্র একই প্রতিষ্ঠানের ছাত্রছাত্রীরা এই বইটি কিনতে পারবেন',
          variant: 'destructive'
        });
        return;
      }
    }
    
    // ভেরিফিকেশন চেক করি
    const isVerified = await checkAndShowWarning(user.id, 'message');
    if (!isVerified) {
      return;
    }
    
    // Open purchase dialog directly instead of navigating
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
  
  const toggleWishlist = () => {
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'ইচ্ছেতালিকায় যোগ করতে লগইন করুন',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    
    if (!book) return;
    
    const savedWishlist = localStorage.getItem('bookWishlist');
    let wishlistIds = savedWishlist ? JSON.parse(savedWishlist) : [];
    
    if (isInWishlist) {
      // Remove from wishlist
      wishlistIds = wishlistIds.filter(id => id !== book.id);
      toast({
        title: 'সফল',
        description: 'বইটি ইচ্ছেতালিকা থেকে সরানো হয়েছে',
      });
    } else {
      // Add to wishlist
      wishlistIds.push(book.id);
      toast({
        title: 'সফল',
        description: 'বইটি ইচ্ছেতালিকায় যোগ করা হয়েছে',
      });
    }
    
    localStorage.setItem('bookWishlist', JSON.stringify(wishlistIds));
    setIsInWishlist(!isInWishlist);
  };
  
  // Open image gallery with specific image
  const openImageGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageGalleryOpen(true);
  };
  
  // Get all images (cover + additional)
  const getAllImages = () => {
    if (!book) return [];
    
    const images: string[] = [];
    if (book.cover_image_url) {
      images.push(book.cover_image_url);
    }
    
    if (book.additional_images && Array.isArray(book.additional_images)) {
      images.push(...book.additional_images);
    }
    
    return images;
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
                        onClick={() => openImageGallery(0)}
                        style={{ cursor: 'pointer' }}
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
                      <h1 className="text-2xl font-bold text-foreground mb-1"><SafeText>{book.title}</SafeText></h1>
                    </div>
                    
                    {/* Wishlist button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className={`rounded-full w-9 h-9 ${
                        isInWishlist 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'bg-background hover:bg-background/90'
                      } transition-all duration-200 shadow-sm`}
                      onClick={toggleWishlist}
                    >
                      <Heart 
                        className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} 
                      />
                    </Button>
                  </div>
                  
                  {/* Status and category badges */}
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
                  
                  {/* Price and discount info */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-primary">৳{book.price}</p>
                      {book.discount_rate && book.discount_rate > 0 && (
                        <div className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-sm font-medium flex items-center">
                          <Percent className="h-3 w-3 mr-1" />
                          {book.discount_rate}% ছাড
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Detailed information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Required fields with star mark */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm text-gray-500 mb-1">প্রয়োজনীয় তথ্য</h3>
                      
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-primary/70" />
                        <div>
                          <span className="text-sm font-medium">বইয়ের নাম *</span>
                          <p className="text-base"><SafeText>{book.title}</SafeText></p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <BookText className="h-4 w-4 text-primary/70" />
                        <div>
                          <span className="text-sm font-medium">প্রকাশনী *</span>
                          <p className="text-base"><SafeText>{book.publisher || 'উল্লেখ নেই'}</SafeText></p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-primary/70" />
                        <div>
                          <span className="text-sm font-medium">বইয়ের অবস্থা *</span>
                          <p className="text-base">{getConditionLabel(book.condition)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 flex items-center justify-center text-primary/70 font-bold text-xs">৳</div>
                        <div>
                          <span className="text-sm font-medium">মূল্য (টাকা) *</span>
                          <p className="text-base">৳{book.price}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional information */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm text-gray-500 mb-1">অতিরিক্ত তথ্য</h3>
                      
                      {book.discount_rate && book.discount_rate > 0 && (
                        <div className="flex items-center space-x-2">
                          <Percent className="h-4 w-4 text-green-600" />
                          <div>
                            <span className="text-sm font-medium">মূল্য ছাড়ের হার</span>
                            <p className="text-base">{book.discount_rate}%</p>
                          </div>
                        </div>
                      )}
                      
                      {book.department && (
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4 text-primary/70" />
                          <div>
                            <span className="text-sm font-medium">বিভাগ</span>
                            <p className="text-base"><SafeText>{book.department}</SafeText></p>
                          </div>
                        </div>
                      )}
                      
                      {book.semester && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-primary/70" />
                          <div>
                            <span className="text-sm font-medium">সেমিস্টার</span>
                            <p className="text-base"><SafeText>{book.semester}</SafeText></p>
                          </div>
                        </div>
                      )}
                      
                      {book.institute_name && (
                        <div className="flex items-center space-x-2">
                          <School className="h-4 w-4 text-primary/70" />
                          <div>
                            <span className="text-sm font-medium">প্রতিষ্ঠান</span>
                            <p className="text-base">{book.institute_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="font-medium text-foreground mb-2">বিবরণ</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {book.description || 'কোন বিবরণ দেওয়া হয়নি।'}
                    </p>
                  </div>
                  
                  {/* Additional Images Section */}
                  {book.additional_images && book.additional_images.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-medium text-foreground">বইয়ের ছবিসমূহ</h3>
                          {getAllImages().length > 4 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary flex items-center"
                              onClick={() => setIsImageGalleryOpen(true)}
                            >
                              আরো দেখুন <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          {getAllImages().slice(0, 4).map((image, index) => (
                            <div 
                              key={index} 
                              className="aspect-square rounded-md overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                              onClick={() => openImageGallery(index)}
                            >
                              <img 
                                src={image} 
                                alt={`${book.title} - ছবি ${index + 1}`} 
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  
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
                        <p className="font-medium"><SafeText>{book.seller_name || 'অজানা বিক্রেতা'}</SafeText></p>
                        <p className="text-xs text-muted-foreground">বিক্রেতা</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Button 
                      variant="outline" 
                      onClick={handleContactSeller}
                      className="flex-1 py-4 rounded-full bg-primary/90 text-white shadow-sm hover:bg-primary hover:shadow-md hover:scale-[1.02] transition-all duration-300 border-0"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      মেসেজ
                    </Button>
                    
                    <Button 
                      onClick={() => navigate(`/profile/${book.seller_id}`)}
                      variant="outline"
                      className="flex-1 py-4 rounded-full border-primary/20 bg-white hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-sm font-medium transition-all duration-300"
                    >
                      <User className="mr-2 h-4 w-4" />
                      বিক্রেতার প্রোফাইল
                    </Button>
                    
                    {book.status !== 'sold' && (
                      <Button 
                        onClick={handlePurchaseRequest}
                        variant="default"
                        className="flex-1 py-4 rounded-full bg-green-600 text-white font-medium shadow-sm hover:bg-green-500 hover:shadow-md hover:scale-[1.02] transition-all duration-300 text-base border-0"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        বই কেনার অনুরোধ
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
      
            {/* Message Dialog */}
      {book && (
        <MessageDialog
          open={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
                recipientId={book.seller_id}
                recipientName={book.seller_name || 'অজানা বিক্রেতা'}
                bookId={book.id}
                bookTitle={book.title}
                book={book}
        />
      )}
      
            {/* Purchase Request Dialog */}
      {book && (
        <PurchaseRequestDialog
          open={isPurchaseDialogOpen}
          onOpenChange={setIsPurchaseDialogOpen}
                book={book}
        />
      )}
            
            {/* Image Gallery Dialog */}
            <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
              <DialogContent className="sm:max-w-4xl p-0 bg-black/95 border-none">
                <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
                  <div className="flex justify-between items-center">
                    <DialogTitle className="text-white">{book?.title} - ছবিসমূহ</DialogTitle>
                    <DialogClose className="text-white hover:text-gray-300">
                      <X className="h-5 w-5" />
                    </DialogClose>
                  </div>
                </DialogHeader>
                
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
                  {/* Main image */}
                  <div className="w-full h-[60vh] flex items-center justify-center mb-4">
                    <img 
                      src={getAllImages()[selectedImageIndex]} 
                      alt={`${book?.title} - ছবি ${selectedImageIndex + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  
                  {/* Thumbnails */}
                  <div className="flex gap-2 overflow-x-auto py-2 px-4 w-full">
                    {getAllImages().map((image, index) => (
                      <div 
                        key={index} 
                        className={`w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                          index === selectedImageIndex ? 'border-primary' : 'border-transparent'
                        } cursor-pointer`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img 
                          src={image} 
                          alt={`${book?.title} - ছবি ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookDetailPage; 
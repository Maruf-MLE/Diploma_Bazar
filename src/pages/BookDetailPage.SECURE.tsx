// 🛡️ XSS Protected BookDetailPage
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  ArrowLeft, 
  Heart, 
  Star, 
  User,
  MessageCircle,
  Phone,
  BookText,
  Tag,
  GraduationCap,
  Calendar,
  Percent,
  MapPin,
  Loader2 
} from 'lucide-react';

// 🛡️ Security imports
import { 
  SafeText, 
  SafeHTML, 
  sanitizeText, 
  validateAndSanitizeInput,
  logSecurityEvent 
} from '@/lib/security';

import { Navigation } from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { BookRequestButton } from '@/components/BookRequestButton';
import { ImageViewer } from '@/components/ImageViewer';

interface Book {
  id: string;
  title: string;
  publisher?: string;
  condition: string;
  price: number;
  discount_rate?: number;
  department?: string;
  semester?: string;
  description?: string;
  cover_image_url?: string;
  additional_images?: string[];
  status: string;
  category?: string;
  seller_id: string;
  created_at: string;
  seller?: {
    id: string;
    name: string;
    avatar_url?: string;
    institute_name?: string;
    department?: string;
  };
}

export const BookDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // 🛡️ Input validation for book ID
  useEffect(() => {
    if (id) {
      const validation = validateAndSanitizeInput(id, 'text');
      if (!validation.isValid) {
        logSecurityEvent('INVALID_BOOK_ID', { id, error: validation.error });
        setError('অবৈধ বই ID');
        setLoading(false);
        return;
      }
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchBookDetails();
      if (user) {
        checkWishlistStatus();
      }
    }
  }, [id, user]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      
      // 🛡️ Validate and sanitize the book ID before query
      if (!id) {
        setError('বই ID পাওয়া যায়নি');
        return;
      }

      const validation = validateAndSanitizeInput(id, 'text');
      if (!validation.isValid) {
        setError('অবৈধ বই ID');
        return;
      }

      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          seller:profiles!books_seller_id_fkey (
            id,
            name,
            avatar_url,
            institute_name,
            department
          )
        `)
        .eq('id', validation.sanitized)
        .single();

      if (error) {
        console.error('Error fetching book:', error);
        setError('বইয়ের তথ্য লোড করতে সমস্যা হয়েছে');
        return;
      }

      // 🛡️ Sanitize all book data before setting state
      if (data) {
        const sanitizedBook: Book = {
          ...data,
          title: sanitizeText(data.title || ''),
          publisher: data.publisher ? sanitizeText(data.publisher) : undefined,
          description: data.description ? sanitizeText(data.description) : undefined,
          department: data.department ? sanitizeText(data.department) : undefined,
          semester: data.semester ? sanitizeText(data.semester) : undefined,
          seller: data.seller ? {
            ...data.seller,
            name: sanitizeText(data.seller.name || ''),
            institute_name: data.seller.institute_name ? sanitizeText(data.seller.institute_name) : undefined,
            department: data.seller.department ? sanitizeText(data.seller.department) : undefined
          } : undefined
        };
        
        setBook(sanitizedBook);
      }
    } catch (error) {
      console.error('Exception in fetchBookDetails:', error);
      setError('বইয়ের তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    if (!user || !id) return;
    
    try {
      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', id)
        .single();
      
      setIsInWishlist(!!data);
    } catch (error) {
      // Wishlist entry doesn't exist, which is fine
    }
  };

  const toggleWishlist = async () => {
    if (!user || !book) {
      navigate('/login');
      return;
    }

    try {
      if (isInWishlist) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('book_id', book.id);
        
        setIsInWishlist(false);
      } else {
        await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            book_id: book.id
          });
        
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const getConditionLabel = (condition: string) => {
    const conditions = {
      'new': 'নতুন',
      'like_new': 'নতুনের মতো',
      'good': 'ভালো',
      'fair': 'মোটামুটি',
      'poor': 'খারাপ'
    };
    return conditions[condition as keyof typeof conditions] || condition;
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      'academic': 'একাডেমিক',
      'story': 'গল্প',
      'novel': 'উপন্যাস',
      'poetry': 'কবিতা',
      'science': 'বিজ্ঞান',
      'history': 'ইতিহাস',
      'biography': 'জীবনী',
      'religion': 'ধর্মীয়',
      'technology': 'প্রযুক্তি',
      'other': 'অন্যান্য'
    };
    return categories[category as keyof typeof categories] || category;
  };

  const openImageGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageGalleryOpen(true);
  };

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
              <SafeText>{error}</SafeText>
              <div className="flex justify-center mt-6">
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
                      {/* 🛡️ Safe text display */}
                      <h1 className="text-2xl font-bold text-foreground mb-1">
                        <SafeText>{book.title}</SafeText>
                      </h1>
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
                    <Badge variant="outline">
                      <SafeText>{getConditionLabel(book.condition)}</SafeText>
                    </Badge>
                    {book.category && (
                      <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10">
                        <SafeText>{getCategoryLabel(book.category)}</SafeText>
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
                  
                  {/* Detailed information with safe text display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                          <p className="text-base">
                            <SafeText>{book.publisher || 'উল্লেখ নেই'}</SafeText>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-primary/70" />
                        <div>
                          <span className="text-sm font-medium">বইয়ের অবস্থা *</span>
                          <p className="text-base">
                            <SafeText>{getConditionLabel(book.condition)}</SafeText>
                          </p>
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
                    </div>
                  </div>

                  {/* Book description with safe HTML display */}
                  {book.description && (
                    <div className="mb-6">
                      <h3 className="font-medium text-sm text-gray-500 mb-2">বইয়ের বর্ণনা</h3>
                      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                        {/* 🛡️ Safe HTML display for description */}
                        <SafeHTML>{book.description}</SafeHTML>
                      </div>
                    </div>
                  )}

                  {/* Seller information with safe text display */}
                  {book.seller && (
                    <div className="mb-6">
                      <h3 className="font-medium text-sm text-gray-500 mb-3">বিক্রেতার তথ্য</h3>
                      <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {book.seller.avatar_url ? (
                            <img 
                              src={book.seller.avatar_url} 
                              alt={book.seller.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-primary/60" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            <SafeText>{book.seller.name}</SafeText>
                          </p>
                          {book.seller.institute_name && (
                            <p className="text-xs text-muted-foreground">
                              <SafeText>{book.seller.institute_name}</SafeText>
                            </p>
                          )}
                          {book.seller.department && (
                            <p className="text-xs text-muted-foreground">
                              <SafeText>{book.seller.department}</SafeText>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex space-x-3">
                    <BookRequestButton 
                      bookId={book.id} 
                      sellerId={book.seller_id}
                      bookTitle={book.title}
                      bookPrice={book.price}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Image Gallery Modal */}
      {isImageGalleryOpen && (
        <ImageViewer
          images={getAllImages()}
          initialIndex={selectedImageIndex}
          onClose={() => setIsImageGalleryOpen(false)}
        />
      )}
    </div>
  );
};

export default BookDetailPage;

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, MessageCircle, Star, Shield, Search, TrendingUp, ChevronRight, Heart, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { BookEntity, BookFilter, getBooks } from '@/lib/BookEntity';
import { supabase } from '@/lib/supabase';
import MessageDialog from '@/components/MessageDialog';
import '@/styles/book-card.css';

// Define interface for BookCard props
interface BookCardProps {
  book: BookEntity;
  wishlist: Set<string>;
  handleViewBookDetails: (book: BookEntity) => void;
  toggleWishlist: (bookId: string) => void;
  handleContactSeller: (book: BookEntity) => void;
  handlePurchaseRequest: (book: BookEntity) => void;
  getConditionLabel: (condition: string) => string;
  getCategoryLabel: (category: string) => string;
  getDepartmentLabel: (department: string) => string;
  handleDepartmentClick: (department: string) => void;
}

// Book Card Component - Extracted from BrowseBooksPage
const BookCard = ({ 
  book, 
  wishlist, 
  handleViewBookDetails, 
  toggleWishlist, 
  handleContactSeller, 
  handlePurchaseRequest, 
  getConditionLabel, 
  getCategoryLabel,
  getDepartmentLabel,
  handleDepartmentClick 
}: BookCardProps) => {
  return (
    <Card 
      className="book-card"
      onClick={() => handleViewBookDetails(book)}
    >
      {/* Book Image */}
      <div className="book-image">
        {book.cover_image_url ? (
          <img 
            src={book.cover_image_url} 
            alt={book.title} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="book-icon">📚</div>
        )}
        
        {/* Price Overlay */}
        <div className="price-overlay">
          <div className="price-tag-overlay">
            ৳{book.price}
          </div>
          {book.discount_rate && (
            <div className="discount-overlay">
              {book.discount_rate}% ছাড়
            </div>
          )}
        </div>
      </div>

      {/* Book Title */}
      <h3 className="book-title">{book.title}</h3>

      {/* Semester and Publisher - Positions Exchanged */}
      <div className="publisher-semester">
        <div className="semester-badge">
          {book.semester || 'উল্লেখ নেই'}
        </div>
        <div className="publisher-info-simple">
          <div className="publisher-text-simple">
            {book.publisher || 'প্রকাশনী উল্লেখ নেই'}
          </div>
        </div>
      </div>

      {/* Academic Info */}
      <div className="academic-info">
        <div className="academic-details">
          <div className="academic-item">
            <span className="academic-label">বিক্রেতা: </span>
            <span className="academic-value">
              {book.seller_name || 'অজানা বিক্রেতা'}
            </span>
          </div>
          <div className="academic-item">
            <span className="academic-label">বিভাগ: </span>
            <span className="academic-value">
              {book.department || 'উল্লেখ নেই'}
            </span>
          </div>
          <div className="academic-item">
            <span className="academic-label">প্রতিষ্ঠান: </span>
            <span className="academic-value">
              {book.institute_name || 'উল্লেখ নেই'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="card-actions">
        <button 
          className="btn-primary"
          onClick={(e) => {
            console.log('=== HOME PAGE: Message button clicked ===');
            console.log('Event object:', e);
            console.log('Book object:', book);
            e.stopPropagation();
            handleContactSeller(book);
          }}
        >
          মেসেজ করুন
        </button>
        <button 
          className="btn-secondary"
          onClick={(e) => {
            console.log('=== HOME PAGE: Details button clicked ===');
            e.stopPropagation();
            handleViewBookDetails(book);
          }}
        >
          বিস্তারিত
        </button>
      </div>
    </Card>
  );
};

const FeaturesSection = () => {
  const [featuredBooks, setFeaturedBooks] = useState<BookEntity[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [messageBook, setMessageBook] = useState<BookEntity | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch featured books from database
  useEffect(() => {
    const fetchFeaturedBooks = async () => {
      try {
        setBooksLoading(true);
        console.log('Fetching featured books for home page...');
        
        // Get 4 latest available books
        const { data: books, error } = await getBooks(
          { }, // No specific filter, get all available books
          4, // Limit to 4 books
          0, // Start from beginning
          'created_at', // Sort by creation date
          'desc' // Newest first
        );

        if (error) {
          console.error('Error fetching featured books:', error);
          // Don't show toast for now, just log the error
          setFeaturedBooks([]);
          return;
        }

        console.log('Featured books fetched successfully:', books?.length || 0, 'books');
        setFeaturedBooks(books || []);
      } catch (error) {
        console.error('Error in fetchFeaturedBooks:', error);
        setFeaturedBooks([]);
      } finally {
        setBooksLoading(false);
      }
    };

    fetchFeaturedBooks();
  }, []);

  // Handle book card interactions
  const handleViewBookDetails = (book: BookEntity) => {
    navigate(`/book/${book.id}`);
  };

  const toggleWishlist = (bookId: string) => {
    setWishlist(prev => {
      const newWishlist = new Set(prev);
      if (newWishlist.has(bookId)) {
        newWishlist.delete(bookId);
        toast({
          title: "উইশলিস্ট থেকে সরানো হয়েছে",
          description: "বইটি আপনার উইশলিস্ট থেকে সরিয়ে দেওয়া হয়েছে",
        });
      } else {
        newWishlist.add(bookId);
        toast({
          title: "উইশলিস্টে যোগ করা হয়েছে",
          description: "বইটি আপনার উইশলিস্টে যোগ করা হয়েছে",
        });
      }
      return newWishlist;
    });
  };

const handleContactSeller = async (book: BookEntity) => {
    console.log('=== HOME PAGE: handleContactSeller called ===');
    console.log('Book ID:', book.id);
    console.log('Book Title:', book.title);
    console.log('Book seller_id:', book.seller_id);
    console.log('User logged in:', !!user);
    console.log('Profile available:', !!profile);
    
    if (!user) {
      console.log('No user logged in, redirecting to login');
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'বিক্রেতার সাথে যোগাযোগ করতে লগইন করুন',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }

    if (!profile) {
      console.log('No profile found, showing error');
      toast({
        title: 'প্রোফাইল তথ্য পাওয়া যায়নি',
        description: 'আপনার প্রোফাইল সম্পূর্ণ করুন',
        variant: 'destructive'
      });
      navigate('/profile');
      return;
    }
    
    console.log('Opening message dialog');
    console.log('Current user institute:', profile.institute_name);
    console.log('MessageDialog will handle both institution and verification checks');
    
    // MessageDialog component will handle both institution and verification checks automatically
    setMessageBook(book);
    setIsMessageDialogOpen(true);
  };

  const handlePurchaseRequest = (book: BookEntity) => {
    if (!user) {
      toast({
        title: "লগইন প্রয়োজন",
        description: "কেনার অনুরোধ পাঠাতে লগইন করুন",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    navigate(`/purchase-request/${book.id}`);
  };

  // Helper functions for labels
  const getConditionLabel = (condition: string) => {
    const labels = {
      new: 'নতুন',
      like_new: 'নতুনের মতো',
      good: 'ভালো',
      acceptable: 'মোটামুটি',
      poor: 'পুরানো'
    };
    return labels[condition] || condition;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      academic: 'একাডেমিক',
      novel: 'উপন্যাস',
      story: 'গল্প',
      scifi: 'সাইন্স ফিকশন',
      religious: 'ধর্মীয়',
      selfhelp: 'আত্ম-উন্নয়ন',
      biography: 'জীবনী',
      history: 'ইতিহাস',
      science: 'বিজ্ঞান',
      poetry: 'কবিতা',
      comics: 'কমিকস',
      reference: 'রেফারেন্স',
      other: 'অন্যান্য'
    };
    return labels[category] || category;
  };

  const getDepartmentLabel = (department: string) => {
    return department || 'উল্লেখ নেই';
  };

  const handleDepartmentClick = (department: string) => {
    navigate(`/browse?department=${encodeURIComponent(department)}`);
  };

  const features = [
    {
      icon: BookOpen,
      title: 'স্মার্ট বুক পোস্টিং',
      description: 'সহজেই আপনার বই পোস্ট করুন এবং সঠিক দামে বিক্রি করুন।',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      gradientFrom: 'from-[#C5E1FF]',
      gradientTo: 'to-[#A8D1FF]',
      path: '/sell'
    },
    {
      icon: Search,
      title: 'অ্যাডভান্স সার্চ',
      description: 'বিষয়, লেখক, দাম অনুযায়ী দ্রুত বই খুঁজে পান।',
      color: 'text-green-600',
      bg: 'bg-green-50',
      gradientFrom: 'from-[#C2F1DB]',
      gradientTo: 'to-[#9DE4BE]',
      path: '/browse'
    },
    {
      icon: MessageCircle,
      title: 'ইনস্ট্যান্ট মেসেজিং',
      description: 'বিক্রেতার সাথে সরাসরি যোগাযোগ করুন এবং দর কষাকষি করুন।',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      gradientFrom: 'from-[#DFD6FF]',
      gradientTo: 'to-[#C6BAF7]',
      path: '/messages'
    },
    {
      icon: Star,
      title: 'রেটিং সিস্টেম',
      description: 'বিক্রেতা ও ক্রেতাদের রেটিং দেখে নিরাপদ লেনদেন করুন।',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      gradientFrom: 'from-[#FFF0B3]',
      gradientTo: 'to-[#FFE070]',
      path: '/browse'
    },
    {
      icon: Shield,
      title: 'নিরাপত্তা গ্যারান্টি',
      description: 'AI যাচাইকরণ এবং মডারেশনের মাধ্যমে সম্পূর্ণ নিরাপত্তা।',
      color: 'text-red-600',
      bg: 'bg-red-50',
      gradientFrom: 'from-[#FFD6D6]',
      gradientTo: 'to-[#FFB3B3]',
      path: '/register'
    },
    {
      icon: TrendingUp,
      title: 'ট্রেন্ডিং বই',
      description: 'জনপ্রিয় এবং চাহিদাসম্পন্ন বইগুলো সহজে খুঁজে পান।',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      gradientFrom: 'from-[#D8E0FF]',
      gradientTo: 'to-[#B8C6FF]',
      path: '/browse'
    }
  ];

  const conditionBadge = (condition) => {
    const badges = {
      new: 'bg-green-100 text-green-800',
      like_new: 'bg-blue-100 text-blue-800',
      good: 'bg-yellow-100 text-yellow-800',
      acceptable: 'bg-orange-100 text-orange-800',
      poor: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      new: 'নতুন',
      like_new: 'প্রায় নতুন',
      good: 'ভালো',
      acceptable: 'মোটামুটি',
      poor: 'পুরানো'
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badges[condition]}`}>
        {labels[condition]}
      </span>
    );
  };

  return (
    <section className="pt-10 md:pt-16 pb-4 md:pb-8" style={{backgroundColor: '#F9FAFB'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured Books Section - Now with Real Data */}
        <div className="mb-0 pt-0 pb-16 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#F5F8FB'}}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">
              <span className="gradient-text">জনপ্রিয় বইসমূহ</span>
            </h2>
            <Link to="/browse" className="text-primary font-medium hover:underline flex items-center">
              সব বই দেখুন <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {booksLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden h-full">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              ))
            ) : featuredBooks.length > 0 ? (
              featuredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  wishlist={wishlist}
                  handleViewBookDetails={handleViewBookDetails}
                  toggleWishlist={toggleWishlist}
                  handleContactSeller={handleContactSeller}
                  handlePurchaseRequest={handlePurchaseRequest}
                  getConditionLabel={getConditionLabel}
                  getCategoryLabel={getCategoryLabel}
                  getDepartmentLabel={getDepartmentLabel}
                  handleDepartmentClick={handleDepartmentClick}
                />
              ))
            ) : (
              // No books found
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">কোন বই পাওয়া যায়নি</h3>
                <p className="text-gray-500">এখনও কোন বই যোগ করা হয়নি।</p>
                <Link to="/sell" className="mt-4 inline-block">
                  <Button>প্রথম বই যোগ করুন</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Features Section - Now Second with improved design */}
        <div className="relative pt-16 pb-0 mb-12 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#F9FAFB'}}>
          {/* Content */}
          <div className="relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="gradient-text">বিশেষ সুবিধাসমূহ</span>
              </h2>
              <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
                আমাদের উন্নত প্রযুক্তি এবং নিরাপদ প্ল্যাটফর্মের মাধ্যমে 
                পান অসাধারণ বুক এক্সচেঞ্জ অভিজ্ঞতা
              </p>
            </div>

            {/* Features Grid - Modern Professional Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {features.map((feature, index) => (
                <div key={index} className="group">
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col relative overflow-hidden border border-gray-100/50">
                    
                    {/* Top Gradient Bar */}
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    
                    {/* Icon Section */}
                    <div className="flex items-center justify-center pt-8 pb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-20 scale-150"></div>
                        <div className="relative p-4 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100/50">
                          <feature.icon className={`h-8 w-8 ${feature.color}`} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="px-6 pb-8 flex flex-col flex-grow text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm leading-relaxed flex-grow">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Bottom accent */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Join Now Button */}
            <div className="text-center mt-10">
              <Link to="/register">
                <Button className="primary-button px-8 py-6 rounded-full shadow-lg hover:shadow-xl text-lg font-medium">
                  আজই যোগ দিন
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Message Dialog */}
      {messageBook && (
        <MessageDialog
          open={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
          recipientId={messageBook.seller_id}
          recipientName={messageBook.seller_name || 'অজানা বিক্রেতা'}
          bookId={messageBook.id}
          bookTitle={messageBook.title}
          book={messageBook}
        />
      )}
    </section>
  );
};

export default FeaturesSection;

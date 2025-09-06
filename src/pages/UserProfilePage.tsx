import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star, MessageCircle, Loader2, Calendar, Flag, Check, FileCheck, ShoppingCart, Eye, DollarSign, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { getUserBooks, BookEntity } from '@/lib/BookEntity';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import BookDetailsDialog from '@/components/BookDetailsDialog';
import ReportDialog from '@/components/ReportDialog';
import { getUserVerificationStatus } from '@/lib/supabase';
import MessageDialog from '@/components/MessageDialog';
import { useVerificationCheck } from '@/lib/verification';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('mybooks');
  const { checkAndShowWarning } = useVerificationCheck();
  
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    institute_name: '',
    department: '',
    semester: '',
    roll_number: '',
    avatar_url: '/placeholder.svg',
    rating: 0,
    totalReviews: 0,
    totalPosts: 0,
    totalSold: 0,
    isVerified: false
  });
  
  const [loading, setLoading] = useState(true);
  const [userBooks, setUserBooks] = useState<BookEntity[]>([]);
  const [soldBooks, setSoldBooks] = useState<BookEntity[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingSoldBooks, setLoadingSoldBooks] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // State for book details dialog
  const [selectedBook, setSelectedBook] = useState<BookEntity | null>(null);
  const [isBookDetailsDialogOpen, setIsBookDetailsDialogOpen] = useState(false);

  // Add state for report dialog
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  
  // Add state for message dialog
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  // Add state for report info dialog
  const [isReportInfoDialogOpen, setIsReportInfoDialogOpen] = useState(false);

  // Fetch user's books directly from supabase with retry mechanism
  const fetchBooksDirectly = async (userId: string) => {
    try {
      setLoadingBooks(true);
      setLoadingSoldBooks(true);
      console.log('Fetching books directly for user:', userId);
      
      // Get all books by this user directly from supabase
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching books directly:', error);
        throw error;
      }
      
      console.log(`Books data for user ${userId}:`, data);
      
      // Get profile data for seller
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url, institute_name')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile for books:', profileError);
      }
      
      if (data && data.length > 0) {
        console.log('Received books data directly:', data);
        
        // Add seller information to books
        const booksWithSellerInfo = data.map(book => ({
          ...book,
          seller_name: profileData?.name || 'অজানা বিক্রেতা',
          seller_avatar_url: profileData?.avatar_url || undefined,
          location: profileData?.institute_name || undefined
        }));
        
        // Filter available and sold books based only on status field
        // since is_sold field doesn't exist
        const availableBooks = booksWithSellerInfo.filter(book => 
          book.status === 'available' || book.status === 'pending'
        );
        
        const soldBooksData = booksWithSellerInfo.filter(book => 
          book.status === 'sold'
        );
        
        console.log('Available books:', availableBooks);
        console.log('Sold books:', soldBooksData);
        
        // Update state
        setUserBooks(availableBooks);
        setSoldBooks(soldBooksData);
        
        // Update counts
        setUserData(prevData => ({
          ...prevData,
          totalPosts: data.length,
          totalSold: soldBooksData.length
        }));
      } else {
        console.log('No books found for user:', userId);
        setUserBooks([]);
        setSoldBooks([]);
      }
    } catch (error) {
      console.error('Error in fetchBooksDirectly:', error);
      toast({
        title: 'ত্রুটি',
        description: 'বইয়ের তথ্য লোড করা যায়নি',
        variant: 'destructive',
      });
      
      // Set empty arrays to avoid undefined errors
      setUserBooks([]);
      setSoldBooks([]);
    } finally {
      setLoadingBooks(false);
      setLoadingSoldBooks(false);
    }
  };

  // Fetch user's reviews - using exact same logic as ProfilePage
  const fetchReviews = async (userId: string) => {
    try {
      setLoadingReviews(true);
      console.log('Fetching reviews for user:', userId);
      
      // Fetch reviews where the user is the seller (received reviews)
      const { data: sellerReviews, error: sellerError } = await supabase
        .from('reviews')
        .select('*')
        .eq('seller_id', userId);
      
      if (sellerError) {
        console.error('Error fetching seller reviews:', sellerError);
        throw sellerError;
      }
      
      console.log('Received seller reviews data:', sellerReviews);
      
      if (!sellerReviews || sellerReviews.length === 0) {
        console.log('No reviews found for this user');
        setReviews([]);
        // Set zero ratings when no reviews
        setUserData(prevData => ({
          ...prevData,
          totalReviews: 0,
          rating: 0
        }));
        return;
      }
      
      // Now fetch profiles for each reviewer
      const reviewsWithProfiles = await Promise.all(
        sellerReviews.map(async (review) => {
          if (review.reviewer_id) {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('name, avatar_url')
                .eq('id', review.reviewer_id)
                .single();
                
              if (profileError) {
                console.error('Error fetching reviewer profile:', profileError);
                return {
                  ...review,
                  profiles: { name: 'অজানা ব্যবহারকারী', avatar_url: null }
                };
              }
              
              return {
                ...review,
                profiles: profileData
              };
            } catch (profileError) {
              console.error('Error processing profile:', profileError);
              return {
                ...review,
                profiles: { name: 'অজানা ব্যবহারকারী', avatar_url: null }
              };
            }
          }
          return {
            ...review,
            profiles: { name: 'অজানা ব্যবহারকারী', avatar_url: null }
          };
        })
      );
      
      console.log('Reviews with profiles:', reviewsWithProfiles);
      setReviews(reviewsWithProfiles);

      // Calculate average rating - EXACT same logic as ProfilePage
      const averageRating =
        reviewsWithProfiles.length > 0
          ?
            reviewsWithProfiles.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
              reviewsWithProfiles.length
          : 0;
      
      // Update review stats in userData - same as ProfilePage
      setUserData(prevData => ({
        ...prevData,
        totalReviews: reviewsWithProfiles.length,
        rating: Number(averageRating.toFixed(1))
      }));
      
    } catch (error) {
      console.error('Error in fetchReviews:', error);
      toast({
        title: 'ত্রুটি',
        description: 'রিভিউ লোড করা যায়নি',
        variant: 'destructive',
      });
      setReviews([]);
      // Set zero ratings on error
      setUserData(prevData => ({
        ...prevData,
        totalReviews: 0,
        rating: 0
      }));
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    async function fetchUserProfile() {
      if (!id) {
        navigate('/');
        return;
      }
      
      try {
        setLoading(true);
        
        // Get user's profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
          
        if (profileError) throw profileError;
        
        // Check if user is verified
        const { isVerified, error: verificationError } = await getUserVerificationStatus(id);
        
        console.log('Verification status for user:', id, 'is:', isVerified);
          
        if (verificationError) {
          console.error('Error checking verification status:', verificationError);
        }
        
        if (profile) {
          // Determine the correct avatar URL - prefer manually uploaded over database value
          const getAvatarUrl = () => {
            // Check if there's a manually uploaded avatar (not from Google)
            if (profile.avatar_url && 
                !profile.avatar_url.includes('googleusercontent.com') && 
                !profile.avatar_url.includes('googleapis.com') &&
                profile.avatar_url !== '/placeholder.svg') {
              console.log('✅ UserProfilePage: Using manually uploaded avatar:', profile.avatar_url);
              return profile.avatar_url;
            }
            
            // Otherwise use the database value (which might be Google photo or placeholder)
            return profile.avatar_url || '/placeholder.svg';
          };
          
          const userData = {
            id: id,
            name: profile.name || '',
            institute_name: profile.institute_name || '',
            department: profile.department || '',
            semester: profile.semester || '',
            roll_number: profile.roll_number || '',
            avatar_url: getAvatarUrl(),
            rating: profile.avg_rating || 0, // Initial value from profile
            totalReviews: profile.review_count || 0, // Initial value from profile
            totalPosts: 0,
            totalSold: 0,
            isVerified: isVerified
          };
          
          setUserData(userData);
          
          console.log('Fetching data for user:', id);
          
          // Fetch books directly with a small delay to ensure state is updated
          setTimeout(() => {
            fetchBooksDirectly(id);
          }, 100);
          
          // Fetch reviews with a small delay
          setTimeout(() => {
            fetchReviews(id);
          }, 200);
          
        } else {
          toast({
            title: 'ত্রুটি',
            description: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি',
            variant: 'destructive',
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'ত্রুটি',
          description: 'প্রোফাইল লোড করা যায়নি',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [id, navigate, toast]);

  // Set default tab based on data availability
  useEffect(() => {
    if (!loading) {
      // Only set default tab once when data is first loaded
      const hasSetTab = sessionStorage.getItem(`tab-set-${id}`);
      if (!hasSetTab) {
        if (userBooks.length > 0) {
          setActiveTab('mybooks');
        } else if (soldBooks.length > 0) {
          setActiveTab('history');
        } else if (reviews.length > 0) {
          setActiveTab('reviews');
        } else {
          // Default to books tab if no data is available
          setActiveTab('mybooks');
        }
        sessionStorage.setItem(`tab-set-${id}`, 'true');
      }
    }
  }, [loading, userBooks.length, soldBooks.length, reviews.length, id]);

  const handleContactSeller = async () => {
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
    
    // মেসেজ ডায়ালগ ওপেন করি
    setIsMessageDialogOpen(true);
  };

  const handleReport = () => {
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'রিপোর্ট করতে লগইন করুন',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    
    // রিপোর্ট ইনফো ডায়ালগ ওপেন করি
    setIsReportInfoDialogOpen(true);
  };
  
  // Handle book details button click
  const handleViewBookDetails = (book: BookEntity) => {
    console.log('Viewing book details:', book);
    setSelectedBook(book);
    setIsBookDetailsDialogOpen(true);
  };

  // Handle tab change with better logging
  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
    
    // If changing to reviews tab, try fetching reviews again
    if (value === 'reviews') {
      console.log('Fetching reviews again...');
      fetchReviews(id || '');
    }
    
    // If changing to history tab, try fetching books again
    if (value === 'history') {
      console.log('Fetching books for history tab...');
      fetchBooksDirectly(id || '');
    }
    
    // If changing to mybooks tab, try fetching books again
    if (value === 'mybooks') {
      console.log('Fetching books for mybooks tab...');
      fetchBooksDirectly(id || '');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF4FF]">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section - Similar to ProfilePage */}
        <div className="relative mb-12 bg-blue-200 p-4 shadow-lg rounded-b-lg sm:rounded-xl">
          {/* Profile content container */}
          <div className="mx-auto">
            <div className="bg-[#EEF4FF] rounded-lg sm:rounded-2xl shadow-xl border border-gray-50 p-4 sm:p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                {/* Avatar section */}
                <div className="relative">
                  <div className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-xl rounded-full overflow-hidden">
                    <img 
                      src={userData.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLDivElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="w-full h-full bg-primary/10 rounded-full text-4xl flex items-center justify-center"
                      style={{ display: 'none' }}
                    >
                      {userData.name ? userData.name.split(' ').map(n => n[0]).join('') : ''}
                    </div>
                  </div>
                </div>
                
                {/* User info section */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold">{userData.name}</h1>
                      <div className="flex items-center justify-center md:justify-start mt-2 gap-2">
                        {userData.isVerified ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-sm">
                            <Check className="h-3 w-3 mr-1" /> ভেরিফায়েড
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm">
                            <FileCheck className="h-3 w-3 mr-1" /> ভেরিফায়েড নয়
                          </Badge>
                        )}
                        <div className="flex items-center bg-amber-50 rounded-full px-3 py-1 border border-amber-200">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 fill-amber-400 mr-1" />
                          <span className="text-sm font-semibold text-amber-700">{userData.rating}</span>
                          <span className="text-xs text-amber-600/80 ml-1">({userData.totalReviews} রিভিউ)</span>
                        </div>
                </div>
                    </div>
                    
                    {/* Contact button - only show if not viewing own profile */}
                    {user && user.id !== id && (
                    <Button 
                      onClick={handleContactSeller}
                      className="mt-4 md:mt-0 bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-md w-full md:w-auto"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> মেসেজ পাঠান
                    </Button>
                    )}
                  </div>
                  
                  {/* User details in a grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div className="text-gray-500 dark:text-gray-400 mb-1">প্রতিষ্ঠান</div>
                      <div className="font-medium">{userData.institute_name}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div className="text-gray-500 dark:text-gray-400 mb-1">বিভাগ</div>
                      <div className="font-medium">{userData.department}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div className="text-gray-500 dark:text-gray-400 mb-1">সেমিস্টার</div>
                      <div className="font-medium">{userData.semester}</div>
                    </div>
                  </div>
                  
                  {/* Report button - only show if not viewing own profile */}
                  {user && user.id !== id && (
                  <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline"
                      size="sm" 
                    onClick={handleReport}
                      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                      <Flag className="h-3 w-3 mr-1" /> রিপোর্ট করুন
                  </Button>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-lg transition-all">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-4">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">পোস্ট করা বই</div>
              <div className="text-2xl font-bold">{userData.totalPosts}</div>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-lg transition-all">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mr-4">
              <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">বিক্রিত বই</div>
              <div className="text-2xl font-bold">{userData.totalSold}</div>
            </div>
          </div>

          <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-lg transition-all">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mr-4">
              <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">গড় রেটিং</div>
              <div className="text-2xl font-bold">{userData.rating} <span className="text-sm font-normal">({userData.totalReviews})</span></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-50 p-6">
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <TabsTrigger value="mybooks" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md">
                <BookOpen className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">বইসমূহ</span>
                {userBooks.length > 0 && <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/30 rounded-full px-1.5">{userBooks.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md">
                <ShoppingCart className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">বিক্রয় ইতিহাস</span>
                {soldBooks.length > 0 && <span className="ml-1 text-xs bg-green-100 dark:bg-green-900/30 rounded-full px-1.5">{soldBooks.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md">
                <Star className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">রিভিউ</span>
                {reviews.length > 0 && <span className="ml-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 rounded-full px-1.5">{reviews.length}</span>}
              </TabsTrigger>
              </TabsList>
              
            <TabsContent value="mybooks" className="space-y-4 px-1 pt-2">
                  {loadingBooks ? (
                <div className="flex justify-center items-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
                  <span>লোড হচ্ছে...</span>
                    </div>
              ) : userBooks && userBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userBooks.map((book) => (
                    <Card key={book.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all bg-white dark:bg-gray-800">
                        <div className="flex h-full">
                        <div className="w-1/3">
                              <img 
                            src={book.cover_image_url || '/placeholder.svg'} 
                                alt={book.title} 
                            className="h-full w-full object-cover"
                              />
                              </div>
                        <div className="w-2/3 p-4">
                          <h3 className="font-semibold text-lg line-clamp-1">{book.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{book.author}</p>
                          <div className="flex items-center mt-2">
                            <Badge variant={
                              book.status === 'available' ? 'default' : 
                              book.status === 'pending' ? 'secondary' : 
                              'destructive'
                            } className="font-medium">
                              {book.status === 'available' ? 'বিক্রয়যোগ্য' : 
                               book.status === 'pending' ? 'অপেক্ষমান' : 
                               'বিক্রিত'}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center">
                            <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                            <span className="font-semibold">{book.price} টাকা</span>
                            {book.is_negotiable && <span className="text-xs ml-2">(আলোচনাসাপেক্ষ)</span>}
                            </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewBookDetails(book)} className="bg-white dark:bg-transparent">
                              <Eye className="h-3 w-3 mr-1" /> বিস্তারিত
                              </Button>
                          </div>
                          </div>
                        </div>
                      </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium">কোন বই পাওয়া যায়নি</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">এই ব্যবহারকারী এখনও কোন বই পোস্ট করেননি</p>
                </div>
              )}
              </TabsContent>
              
            <TabsContent value="history" className="space-y-4 px-1 pt-2">
                  {loadingSoldBooks ? (
                <div className="flex justify-center items-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
                  <span>লোড হচ্ছে...</span>
                    </div>
              ) : soldBooks && soldBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {soldBooks.map((book) => (
                    <Card key={book.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all bg-white dark:bg-gray-800">
                        <div className="flex h-full">
                        <div className="w-1/3">
                              <img 
                            src={book.cover_image_url || '/placeholder.svg'} 
                                alt={book.title} 
                            className="h-full w-full object-cover"
                              />
                              </div>
                        <div className="w-2/3 p-4">
                          <h3 className="font-semibold text-lg line-clamp-1">{book.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{book.author}</p>
                          <div className="flex items-center mt-2">
                            <Badge variant="destructive" className="font-medium">
                                বিক্রিত
                              </Badge>
                            </div>
                          <div className="mt-2 flex items-center">
                            <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                            <span className="font-semibold">{book.price} টাকা</span>
                          </div>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{book.updated_at ? format(new Date(book.updated_at), 'PP') : 'অজানা তারিখ'}</span>
                              </div>
                              <Button 
                            size="sm" 
                                variant="outline" 
                            className="mt-2 bg-white dark:bg-transparent"
                            onClick={() => handleViewBookDetails(book)}
                              >
                            <Eye className="h-3 w-3 mr-1" /> বিস্তারিত
                              </Button>
                            </div>
                          </div>
                    </Card>
                  ))}
                        </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium">কোন বিক্রয় ইতিহাস নেই</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">এই ব্যবহারকারী এখনও কোন বই বিক্রি করেননি</p>
                </div>
              )}
              </TabsContent>
              
            <TabsContent value="reviews" className="space-y-4 px-1 pt-2">
                  {loadingReviews ? (
                <div className="flex justify-center items-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
                  <span>লোড হচ্ছে...</span>
                    </div>
              ) : reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    // Handle different possible structures for reviewer data
                    const reviewerName = review.profiles?.name || 
                                        review.reviewer?.name || 
                                        'অজানা ব্যবহারকারী';
                    
                    const avatarUrl = review.profiles?.avatar_url || 
                                     review.reviewer?.avatar_url || 
                                     undefined;
                    
                    const reviewerInitial = reviewerName ? reviewerName.charAt(0) : 'U';
                    
                    return (
                      <Card key={review.id} className="border-0 shadow-md hover:shadow-lg transition-all bg-white dark:bg-gray-800">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback>{reviewerInitial}</AvatarFallback>
                              </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{reviewerName}</h3>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${i < (review.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{review.comment || 'কোন মন্তব্য নেই'}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {review.created_at ? format(new Date(review.created_at), 'PP') : ''}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                        </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <Star className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium">কোন রিভিউ নেই</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">এই ব্যবহারকারী এখনও কোন রিভিউ পাননি</p>
                </div>
              )}
              </TabsContent>
            </Tabs>
        </div>
      </div>
      
      {/* Book Details Dialog */}
      <BookDetailsDialog
        book={selectedBook}
        open={isBookDetailsDialogOpen}
        onOpenChange={setIsBookDetailsDialogOpen}
      />

      {/* Report dialog */}
      <ReportDialog 
        open={isReportDialogOpen} 
        onOpenChange={setIsReportDialogOpen}
        userId={id || ''}
        userName={userData.name}
      />

      {/* Add MessageDialog component */}
      {id && (
        <MessageDialog
          open={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
          recipientId={id}
          recipientName={userData.name}
        />
      )}
      
      {/* Report Info Dialog */}
      <Dialog open={isReportInfoDialogOpen} onOpenChange={setIsReportInfoDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              রিপোর্ট করার নিয়ম
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                আপনি কোনো ব্যবহারকারীকে কোনো কারণে রিপোর্ট করতে চাইলে আপনাকে অবশ্যই আগে তার সাথে একবার বইয়ের লেনদেন করতে হবে। তারপরই আপনি তাকে রিপোর্ট করতে পারবেন।
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                বইয়ের লেনদেন যদি হয়ে থাকে এবং ব্যবহারকারী যদি আপনার সাথে কোনো প্রতারণা বা খারাপ ব্যবহার করে থাকে, তাহলে আপনি আপনার মেসেজ পেজে গিয়ে এই ব্যবহারকারীর ট্যাবে গিয়ে রিপোর্ট করতে পারবেন।
              </p>
            </div>
            
            <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">সতর্কতা</h4>
                <p className="text-sm text-amber-700">
                  অযথা কাউকে রিপোর্ট করা থেকে বিরত থাকুন। মিথ্যা রিপোর্ট করলে আপনার অ্যাকাউন্ট সাসপেন্ড করা হতে পারে।
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsReportInfoDialogOpen(false)}
            >
              বুঝেছি
            </Button>
            
            <Button 
              variant="default"
              onClick={() => {
                setIsReportInfoDialogOpen(false);
                navigate('/messages');
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              মেসেজ পেজে যান
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfilePage; 
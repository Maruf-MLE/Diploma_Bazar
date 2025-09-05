import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Star, MessageCircle, Edit, ShoppingCart, DollarSign, Heart, HelpCircle, Settings, Camera, Loader2, X, Check, Eye, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import { supabase, updateUserProfile, uploadAvatar, subscribeToProfileChanges, getUserVerificationStatus, subscribeToVerificationChanges } from '@/lib/supabase';
import { navigateToRoute } from '@/lib/urlHelper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUserBooks, BookEntity, markBookAsSold } from '@/lib/BookEntity';
import BookEditDialog from '@/components/BookEditDialog';
import BookDetailsDialog from '@/components/BookDetailsDialog';
import TransactionHistoryTab from '@/components/TransactionHistoryTab';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ProfilePage = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mybooks');
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    institute_name: '',
    department: '',
    semester: '',
    roll_number: '',
    avatar_url: '/placeholder.svg',
    email: '',
    isVerified: false,
    rating: 0,
    totalReviews: 0,
    totalPosts: 0,
    totalPurchases: 0,
    totalMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    institute_name: '',
    department: '',
    semester: '',
    roll_number: '',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [userBooks, setUserBooks] = useState<BookEntity[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  
  // State for reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // State for book edit and details dialogs
  const [selectedBook, setSelectedBook] = useState<BookEntity | null>(null);
  const [isBookEditDialogOpen, setIsBookEditDialogOpen] = useState(false);
  const [isBookDetailsDialogOpen, setIsBookDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<BookEntity | null>(null);
  const [deletingBook, setDeletingBook] = useState(false);

  // Handle verification badge click - redirect to verification page
  const handleVerificationClick = () => {
    navigateToRoute('/verification');
  };

  // Check if the location state has an activeTab property or URL has tab parameter
  useEffect(() => {
    // URL থেকে tab প্যারামিটার নেওয়া
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam && ['mybooks', 'purchases'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (user) {
          // Get user's profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileError) throw profileError;
          
          if (profile) {
            const userData = {
              id: user.id,
              name: profile.name || '',
              institute_name: profile.institute_name || '',
              department: profile.department || '',
              semester: profile.semester || '',
              roll_number: profile.roll_number || '',
              avatar_url: profile.avatar_url || '/placeholder.svg',
              email: user.email || '',
              isVerified: false, // Will be updated by fetchVerificationStatus
              rating: profile.avg_rating || 0, // Use rating from profile
              totalReviews: profile.review_count || 0, // Use review count from profile
              totalPosts: 12, // Mock data for now
              totalPurchases: 8, // Mock data for now
              totalMessages: 45 // Mock data for now
            };
            
            setUserData(userData);
            setFormData({
              name: userData.name,
              institute_name: userData.institute_name,
              department: userData.department,
              semester: userData.semester,
              roll_number: userData.roll_number,
            });
            
            // Fetch user's books
            fetchUserBooks(user.id);
            
            // Fetch user's reviews
            fetchReviews(user.id);
            
            // Fetch verification status
            fetchVerificationStatus(user.id);
            
            // Setup realtime subscription for profile changes
            const profileSubscription = subscribeToProfileChanges(user.id, (payload) => {
              const updatedProfile = payload.new;
              setUserData(prevData => ({
                ...prevData,
                name: updatedProfile.name || prevData.name,
                institute_name: updatedProfile.institute_name || prevData.institute_name,
                department: updatedProfile.department || prevData.department,
                semester: updatedProfile.semester || prevData.semester,
                roll_number: updatedProfile.roll_number || prevData.roll_number,
                avatar_url: updatedProfile.avatar_url || prevData.avatar_url,
              }));
            });
            
            // Setup realtime subscription for verification status changes
            const verificationSubscription = subscribeToVerificationChanges(user.id, () => {
              console.log('Verification status changed, refreshing...');
              fetchVerificationStatus(user.id);
            });
            
            return () => {
              profileSubscription.unsubscribe();
              verificationSubscription.unsubscribe();
            };
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'ত্রুটি',
          description: 'প্রোফাইল লোড করা যায়নি',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [toast]);

  // Fetch verification status using RLS-safe function
  const fetchVerificationStatus = async (userId: string) => {
    try {
      setVerificationLoading(true);
      console.log('🔍 ProfilePage: Checking verification status for user:', userId);
      
      // Use the RLS-safe function instead of direct table access
      const { data: verificationResult, error: verificationError } = await supabase
        .rpc('check_user_verification_status', {
          user_uuid: userId
        });
        
      if (verificationError) {
        console.error('❌ ProfilePage: Error checking verification:', verificationError);
        return;
      }
      
      const isUserVerified = verificationResult === true;
      console.log('✅ ProfilePage: Verification status:', isUserVerified);
      
      setUserData(prevData => ({
        ...prevData,
        isVerified: isUserVerified
      }));
    } catch (error) {
      console.error('❌ ProfilePage: Error in fetchVerificationStatus:', error);
    } finally {
      setVerificationLoading(false);
    }
  };

  // Setup realtime subscription for books updates
  useEffect(() => {
    if (!userData.id) return;
    
    // Subscribe to changes in the books table for this user
    const channel = supabase
      .channel('books-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'books',
          filter: `seller_id=eq.${userData.id}`
        }, 
        (payload) => {
          console.log('Books update received:', payload);
          
          // Refresh the books list when changes occur
          fetchUserBooks(userData.id);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData.id]);

  // Fetch user's books
  const fetchUserBooks = async (userId: string) => {
    try {
      setLoadingBooks(true);
      const { data, error } = await getUserBooks(userId);
      
      if (error) throw error;
      
      setUserBooks(data);
      
      // Update totalPosts count
      setUserData(prevData => ({
        ...prevData,
        totalPosts: data.length
      }));
      
    } catch (error) {
      console.error('Error fetching user books:', error);
    } finally {
      setLoadingBooks(false);
    }
  };

  // Fetch user's reviews
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

      // Calculate average rating
      const averageRating =
        reviewsWithProfiles.length > 0
          ?
            reviewsWithProfiles.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
              reviewsWithProfiles.length
          : 0;
      
      // Update review stats in userData
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
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSavingProfile(true);
      
      const { success, error } = await updateUserProfile(userData.id, formData);
      
      if (!success) throw error;
      
      toast({
        title: 'সফল',
        description: 'প্রোফাইল সফলভাবে আপডেট হয়েছে',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'ত্রুটি',
        description: 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    try {
      setUploadingAvatar(true);
      const file = files[0];
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'ত্রুটি',
          description: 'ফাইল সাইজ 2MB এর বেশি হতে পারবে না',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast({
          title: 'ত্রুটি',
          description: 'শুধুমাত্র JPEG, PNG, WebP ফাইল আপলোড করা যাবে',
          variant: 'destructive',
        });
        return;
      }
      
      const { success, publicUrl, error } = await uploadAvatar(userData.id, file);
      
      if (!success) throw error;
      
      setUserData({
        ...userData,
        avatar_url: publicUrl
      });
      
      toast({
        title: 'সফল',
        description: 'প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'ত্রুটি',
        description: 'প্রোফাইল ছবি আপডেট করতে ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle book edit button click
  const handleEditBook = (book: BookEntity) => {
    setSelectedBook(book);
    setIsBookEditDialogOpen(true);
  };
  
  // Handle book details button click
  const handleViewBookDetails = (book: BookEntity) => {
    navigate(`/book/${book.id}`);
  };
  
  // Handle book update from edit dialog
  const handleBookUpdated = (updatedBook: BookEntity) => {
    // Update the book in the local state
    setUserBooks(prevBooks => 
      prevBooks.map(book => 
        book.id === updatedBook.id ? updatedBook : book
      )
    );
    
    toast({
      title: 'সফল',
      description: 'বইয়ের তথ্য আপডেট হয়েছে',
    });
  };

  // Handle marking a book as sold (delete from marketplace)
  const handleMarkAsSold = (book: BookEntity) => {
    setBookToDelete(book);
    setIsDeleteDialogOpen(true);
  };

  // Confirm marking book as sold
  const confirmMarkAsSold = async () => {
    if (!bookToDelete) return;

    try {
      setDeletingBook(true);
      const { success, error } = await markBookAsSold(bookToDelete.id, userData.id, bookToDelete);

      if (!success) throw error;

      // Update the book in the local state
      setUserBooks(prevBooks =>
        prevBooks.map(book =>
          book.id === bookToDelete.id ? { ...book, status: 'sold' } : book
        )
      );

      toast({
        title: 'সফল',
        description: 'বইটি বিক্রিত হিসেবে চিহ্নিত করা হয়েছে এবং আপনার বিক্রিত বইয়ের তালিকায় যোগ করা হয়েছে',
      });

      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error marking book as sold:', error);
      toast({
        title: 'ত্রুটি',
        description: 'বইটি বিক্রিত হিসেবে চিহ্নিত করা যায়নি',
        variant: 'destructive',
      });
    } finally {
      setDeletingBook(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF4FF]">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Redesigned Hero Section for Mobile Responsiveness */}
        <div className="relative mb-12 bg-blue-200 p-4 shadow-lg rounded-b-lg sm:rounded-xl">
          {/* Profile content container */}
          <div className="mx-auto">
            <div className="bg-[#EEF4FF] rounded-lg sm:rounded-2xl shadow-xl border border-gray-50 p-4 sm:p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                {/* Avatar section with improved upload button */}
                <div className="relative mx-auto">
                  <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-gray-300 shadow-lg rounded-full">
                    <AvatarImage src={userData.avatar_url} alt={userData.name} />
                    <AvatarFallback className="text-2xl sm:text-3xl bg-blue-100 text-blue-700 rounded-full font-semibold">
                      {userData.name ? userData.name.split(' ').map(n => n[0]).join('') : ''}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="default"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 sm:h-10 sm:w-10 border-0 bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                </div>
                
                {/* User info section */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">{userData.name}</h1>
                      <div className="flex flex-wrap items-center justify-center md:justify-start mt-3 gap-2 sm:gap-3">
                        {verificationLoading ? (
                          <Badge className="bg-slate-200 hover:bg-slate-300 text-slate-700 border-0 shadow-sm">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> চেক করা হচ্ছে...
                          </Badge>
                        ) : userData.isVerified ? (
                          <Badge 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-sm cursor-pointer transition-all duration-200 hover:scale-105"
                            onClick={handleVerificationClick}
                          >
                            <Check className="h-3 w-3 mr-1" /> ভেরিফায়েড
                          </Badge>
                        ) : (
                          <Badge 
                            className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm cursor-pointer transition-all duration-200 hover:scale-105"
                            onClick={handleVerificationClick}
                          >
                            <HelpCircle className="h-3 w-3 mr-1" /> ভেরিফায়েড নয়
                          </Badge>
                        )}
                        <div className="flex items-center bg-amber-50 rounded-full px-3 py-1 border border-amber-200">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 fill-amber-400 mr-1" />
                          <span className="text-sm font-semibold text-amber-700">{userData.rating}</span>
                          <span className="text-xs text-amber-600/80 ml-1">({userData.totalReviews} রিভিউ)</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Edit profile button - more visible */}
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="mt-4 md:mt-0 bg-[#2568E4] hover:bg-[#1e56c7] text-white border-0 shadow-md w-full sm:w-auto">
                      <Edit className="mr-2 h-4 w-4" /> প্রোফাইল এডিট
                    </Button>
                  </div>
                  
                  {/* User details in a grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6 text-sm">
                    <div className="bg-slate-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/60 shadow-sm">
                      <div className="text-slate-500 mb-1 font-medium">প্রতিষ্ঠান</div>
                      <div className="font-semibold text-slate-800">{userData.institute_name}</div>
                    </div>
                    <div className="bg-slate-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/60 shadow-sm">
                      <div className="text-slate-500 mb-1 font-medium">বিভাগ</div>
                      <div className="font-semibold text-slate-800">{userData.department}</div>
                    </div>
                    <div className="bg-slate-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/60 shadow-sm">
                      <div className="text-slate-500 mb-1 font-medium">সেমিস্টার</div>
                      <div className="font-semibold text-slate-800">{userData.semester}</div>
                    </div>
                    <div className="bg-slate-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/60 shadow-sm">
                      <div className="text-slate-500 mb-1 font-medium">রোল</div>
                      <div className="font-semibold text-slate-800">{userData.roll_number}</div>
                    </div>
                  </div>
                  
                  {/* Email verification status - integrated into hero */}
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200/60 shadow-sm">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <div className={`w-2 h-2 rounded-full mr-2 sm:mr-3 ${userData.isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      <span className="text-sm text-slate-700">ইমেইল: <span className="font-semibold text-slate-800">{userData.email}</span></span>
                    </div>
                    <div 
                      className={userData.isVerified ? 
                        "bg-emerald-100 text-emerald-800 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-emerald-200" : 
                        "bg-amber-100 text-amber-800 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-amber-200"
                      }
                      onClick={handleVerificationClick}
                    >
                      {userData.isVerified ? 'ভেরিফায়েড' : 'ভেরিফাই করুন'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/jpeg, image/png, image/jpg, image/webp"
          />
        </div>

        {/* Stats Section - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group relative overflow-hidden bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-slate-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full -translate-y-4 translate-x-4 opacity-30"></div>
            <div className="relative flex items-center">
              <div className="p-3 bg-blue-100 rounded-2xl mr-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">পোস্ট করা বই</div>
                <div className="text-3xl font-bold text-slate-800">{userData.totalPosts}</div>
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-slate-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 rounded-full -translate-y-4 translate-x-4 opacity-30"></div>
            <div className="relative flex items-center">
              <div className="p-3 bg-emerald-100 rounded-2xl mr-4">
                <ShoppingCart className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">কেনাকাটা</div>
                <div className="text-3xl font-bold text-slate-800">{userData.totalPurchases}</div>
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border border-slate-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-100 rounded-full -translate-y-4 translate-x-4 opacity-30"></div>
            <div className="relative flex items-center">
              <div className="p-3 bg-purple-100 rounded-2xl mr-4">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">মেসেজ</div>
                <div className="text-3xl font-bold text-slate-800">{userData.totalMessages}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-[#EEF4FF] backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border-0 p-4 sm:p-6 md:p-8">
          <Tabs defaultValue="mybooks" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-[#F8FBFF] p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm border border-slate-200/40">
              <TabsTrigger value="mybooks" className="data-[state=active]:bg-[#4C4EE7] data-[state=active]:text-white text-slate-600 font-medium rounded-lg py-2 px-3 text-sm transition-all duration-300 hover:bg-slate-100">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">আমার বই</span>
              </TabsTrigger>
              <TabsTrigger value="purchases" className="data-[state=active]:bg-[#4C4EE7] data-[state=active]:text-white text-slate-600 font-medium rounded-lg py-2 px-3 text-sm transition-all duration-300 hover:bg-slate-100">
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">কেনাকাটা</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-[#4C4EE7] data-[state=active]:text-white text-slate-600 font-medium rounded-lg py-2 px-3 text-sm transition-all duration-300 hover:bg-slate-100">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">রিভিউ</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mybooks" className="space-y-4 px-1 pt-2">
              {loadingBooks ? (
                <div className="flex justify-center items-center py-16 bg-gradient-to-br from-[#E8F2FF] to-[#F0F8FF] rounded-2xl border border-blue-200/30 shadow-inner">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-slate-600 font-medium">লোড হচ্ছে...</span>
                </div>
              ) : userBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {userBooks.map((book) => (
                    <Card key={book.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-[#F8FBFF] rounded-2xl hover:scale-105 min-h-[340px]">
                      <div className="flex flex-col h-full">
                        <img
                          src={book.cover_image_url || '/placeholder.svg'}
                          alt={book.title}
                          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-lg line-clamp-1 mb-1 text-slate-800">{book.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-1">{book.author}</p>
                            <div className="flex items-center mt-2">
                              <Badge variant={book.status === 'available' ? 'default' : book.status === 'pending' ? 'secondary' : 'destructive'} className="font-medium shadow-sm">
                                {book.status === 'available' ? 'বিক্রয়যোগ্য' : book.status === 'pending' ? 'অপেক্ষমান' : 'বিক্রিত'}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center">
                              <DollarSign className="h-4 w-4 text-emerald-600 mr-1" />
                              <span className="font-semibold text-slate-800">{book.price} টাকা</span>
                              {book.is_negotiable && <span className="text-xs ml-2 text-slate-500">(আলোচনাসাপেক্ষ)</span>}
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewBookDetails(book)} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-700 hover:text-white hover:from-blue-600 hover:to-indigo-600 hover:border-blue-600 shadow-md transition-all duration-300 rounded-xl font-semibold">
                              <Eye className="h-3 w-3 mr-1" /> বিস্তারিত
                            </Button>
                            {book.status === 'available' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleEditBook(book)} className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 text-emerald-700 hover:text-white hover:from-emerald-600 hover:to-green-600 hover:border-emerald-600 shadow-md transition-all duration-300 rounded-xl font-semibold">
                                  <Edit className="h-3 w-3 mr-1" /> এডিট
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsSold(book)}
                                  className="bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-700 hover:text-white hover:from-red-600 hover:to-rose-600 hover:border-red-600 shadow-md transition-all duration-300 rounded-xl font-semibold"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" /> বিক্রিত
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-gradient-to-br from-[#E8F2FF] to-[#F0F8FF] rounded-3xl border border-blue-200/30 shadow-inner">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full blur-xl opacity-40"></div>
                    <BookOpen className="relative h-20 w-20 mx-auto text-blue-400 mb-2" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent mb-4">আপনি এখনও কোনো বই পোস্ট করেননি</h3>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">আপনার বই বিক্রি করতে একটি পোস্ট তৈরি করুন</p>
                  <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg rounded-xl px-8 py-3 font-semibold transition-all duration-300 hover:scale-105">
                    <Link to="/sell">বই বিক্রি করুন</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchases" className="space-y-4 px-1 pt-2">
              <TransactionHistoryTab userId={userData.id} />
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4 px-1 pt-2">
              {loadingReviews ? (
                <div className="flex justify-center items-center py-12 bg-gradient-to-br from-[#E8F2FF] to-[#F0F8FF] rounded-xl border border-blue-200/30">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
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
                      <Card key={review.id} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-[#F8FBFF] rounded-2xl hover:scale-105">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 border-2 border-slate-200/60 shadow-sm">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">{reviewerInitial}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-800">{reviewerName}</h3>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${i < (review.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} 
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed mt-2">{review.comment || 'কোন মন্তব্য নেই'}</p>
                              <p className="text-xs text-slate-400 mt-3">
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
              <div className="text-center py-20 bg-gradient-to-br from-[#E8F2FF] to-[#F0F8FF] rounded-3xl border border-blue-200/30 shadow-inner">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-amber-200 rounded-full blur-xl opacity-40"></div>
                    <Star className="relative h-20 w-20 mx-auto text-amber-400 mb-2" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent mb-4">কোন রিভিউ নেই</h3>
                  <p className="text-slate-500 mb-4 max-w-sm mx-auto">আপনি এখনও কোন রিভিউ পাননি</p>
              </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Profile Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px] bg-white border border-slate-200/60 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800">প্রোফাইল এডিট করুন</DialogTitle>
            <DialogDescription className="text-slate-600">
              আপনার প্রোফাইল ইনফরমেশন আপডেট করুন। সম্পন্ন হলে সেভ বাটনে ক্লিক করুন।
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-slate-700 font-medium">পূর্ণ নাম</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="institute_name" className="text-slate-700 font-medium">প্রতিষ্ঠানের নাম</Label>
                <Input
                  id="institute_name"
                  name="institute_name"
                  value={formData.institute_name}
                  onChange={handleFormChange}
                  required
                  readOnly
                  className="border-slate-200 bg-slate-50 cursor-not-allowed text-slate-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department" className="text-slate-700 font-medium">বিভাগ</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  required
                  readOnly
                  className="border-slate-200 bg-slate-50 cursor-not-allowed text-slate-500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="semester" className="text-slate-700 font-medium">সেমিস্টার</Label>
                <Select 
                  name="semester"
                  value={formData.semester} 
                  onValueChange={(value) => handleSelectChange(value, 'semester')}
                  required
                >
                  <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                    <SelectValue placeholder="সেমিস্টার নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="১ম সেমিস্টার">১ম সেমিস্টার</SelectItem>
                    <SelectItem value="২য় সেমিস্টার">২য় সেমিস্টার</SelectItem>
                    <SelectItem value="৩য় সেমিস্টার">৩য় সেমিস্টার</SelectItem>
                    <SelectItem value="৪র্থ সেমিস্টার">৪র্থ সেমিস্টার</SelectItem>
                    <SelectItem value="৫ম সেমিস্টার">৫ম সেমিস্টার</SelectItem>
                    <SelectItem value="৬ষ্ঠ সেমিস্টার">৬ষ্ঠ সেমিস্টার</SelectItem>
                    <SelectItem value="৭ম সেমিস্টার">৭ম সেমিস্টার</SelectItem>
                    <SelectItem value="৮ম সেমিস্টার">৮ম সেমিস্টার</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="roll_number" className="text-slate-700 font-medium">রোল নম্বর</Label>
                <Input
                  id="roll_number"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleFormChange}
                  required
                  readOnly
                  className="border-slate-200 bg-slate-50 cursor-not-allowed text-slate-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                বাতিল
              </Button>
              <Button 
                type="submit" 
                disabled={savingProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  'সংরক্ষণ করুন'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Book Edit Dialog */}
      <BookEditDialog
        book={selectedBook}
        open={isBookEditDialogOpen}
        onOpenChange={setIsBookEditDialogOpen}
        onBookUpdated={handleBookUpdated}
      />
      
      {/* Book Details Dialog */}
      <BookDetailsDialog
        book={selectedBook}
        open={isBookDetailsDialogOpen}
        onOpenChange={setIsBookDetailsDialogOpen}
      />

      {/* Confirm Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বইটি বিক্রিত হিসেবে চিহ্নিত করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই অ্যাকশন নিলে বইটি মার্কেটপ্লেস থেকে সরে যাবে এবং আপনার কেনাকাটা ট্যাবে বিক্রিত বই হিসেবে দেখা যাবে। 
              এই অ্যাকশন আর ফিরিয়ে নেওয়া যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBook}>বাতিল</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmMarkAsSold} 
              disabled={deletingBook}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deletingBook ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  প্রক্রিয়াধীন...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  নিশ্চিত করুন
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfilePage;

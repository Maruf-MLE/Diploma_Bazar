import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, MessageCircle, CheckCircle, Star, BookOpen, Loader2, Eye, Heart, ShoppingCart, ChevronDown, ChevronRight, ArrowUp, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { BookEntity, BookFilter, getBooks } from '@/lib/BookEntity';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Navigation from '@/components/Navigation';
import MessageDialog from '@/components/MessageDialog';
import { supabase, getUserVerificationStatus } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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

// Define debounce utility function
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const bookConditions = [
  { value: 'new', label: 'নতুন' },
  { value: 'like_new', label: 'নতুনের মতো' },
  { value: 'good', label: 'ভালো' },
  { value: 'acceptable', label: 'মোটামুটি' },
  { value: 'poor', label: 'পুরনো' }
];

const bookCategories = [
  { value: 'academic', label: 'একাডেমিক' },
  { value: 'novel', label: 'উপন্যাস' },
  { value: 'story', label: 'গল্প' },
  { value: 'scifi', label: 'সাইন্স ফিকশন' },
  { value: 'religious', label: 'ধর্মীয়' },
  { value: 'selfhelp', label: 'আত্ম-উন্নয়ন' },
  { value: 'biography', label: 'জীবনী' },
  { value: 'history', label: 'ইতিহাস' },
  { value: 'science', label: 'বিজ্ঞান' },
  { value: 'poetry', label: 'কবিতা' },
  { value: 'comics', label: 'কমিকস' },
  { value: 'reference', label: 'রেফারেন্স' },
  { value: 'other', label: 'অন্যান্য' }
];

// প্রতিষ্ঠান, সেমিস্টার, বিভাগ, এবং প্রকাশনী ড্রপডাউনের জন্য ডাটা
const departments = [
  { value: 'কম্পিউটার টেকনোলজি', label: 'কম্পিউটার টেকনোলজি' },
  { value: 'সিভিল টেকনোলজি', label: 'সিভিল টেকনোলজি' },
  { value: 'ইলেকট্রিক্যাল টেকনোলজি', label: 'ইলেকট্রিক্যাল টেকনোলজি' },
  { value: 'মেকানিক্যাল টেকনোলজি', label: 'মেকানিক্যাল টেকনোলজি' },
  { value: 'ইলেকট্রনিক্স টেকনোলজি', label: 'ইলেকট্রনিক্স টেকনোলজি' },
  { value: 'পাওয়ার টেকনোলজি', label: 'পাওয়ার টেকনোলজি' },
  { value: 'মেকাট্রনিক্স টেকনোলজি', label: 'মেকাট্রনিক্স টেকনোলজি' },
  { value: 'রেফ্রিজারেশন অ্যান্ড এয়ার কন্ডিশনিং টেকনোলজি', label: 'রেফ্রিজারেশন অ্যান্ড এয়ার কন্ডিশনিং টেকনোলজি' },
  { value: 'অটোমোবাইল টেকনোলজি', label: 'অটোমোবাইল টেকনোলজি' },
  { value: 'টেক্সটাইল টেকনোলজি', label: 'টেক্সটাইল টেকনোলজি' },
  { value: 'শিপবিল্ডিং টেকনোলজি', label: 'শিপবিল্ডিং টেকনোলজি' },
  { value: 'মেরিন টেকনোলজি', label: 'মেরিন টেকনোলজি' },
  { value: 'ফুড টেকনোলজি', label: 'ফুড টেকনোলজি' },
  { value: 'আর্কিটেকচার', label: 'আর্কিটেকচার' },
  { value: 'কেমিক্যাল টেকনোলজি', label: 'কেমিক্যাল টেকনোলজি' },
  { value: 'বায়োমেডিকেল টেকনোলজি', label: 'বায়োমেডিকেল টেকনোলজি' },
  { value: 'এনভায়রনমেন্টাল টেকনোলজি', label: 'এনভায়রনমেন্টাল টেকনোলজি' },
  { value: 'মাইনিং টেকনোলজি', label: 'মাইনিং টেকনোলজি' },
  { value: 'নিউক্লিয়ার টেকনোলজি', label: 'নিউক্লিয়ার টেকনোলজি' },
  { value: 'পেট্রোলিয়াম টেকনোলজি', label: 'পেট্রোলিয়াম টেকনোলজি' }
];

// Book Card Component - Extracted for better code organization
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
          <div className="publisher-text-simple publisher-badge">
            {/* Show only 'টেকনিক্যাল' for 'টেকনিক্যাল প্রকাশনী' on mobile, full name on larger screens */}
            <span className="block md:hidden">
              {book.publisher === 'টেকনিক্যাল প্রকাশনী' ? 'টেকনিক্যাল' : (book.publisher || 'প্রকাশনী উল্লেখ নেই')}
            </span>
            <span className="hidden md:block">
              {book.publisher || 'প্রকাশনী উল্লেখ নেই'}
            </span>
          </div>
        </div>
      </div>

      {/* Academic Info - Only Institute like home page */}
      <div className="academic-info">
        <div className="academic-details">
          <div className="academic-item">
            <span className="academic-label">প্রতিষ্ঠান: </span>
            <span className="academic-value">
              {book.institute_name || 'উল্লেখ নেই'}
            </span>
          </div>
        </div>
      </div>

      {/* Seller Info */}
      <div className="seller-info">
        <div className="seller-profile">
          <div className="seller-avatar">
            {book.seller_avatar_url ? (
              <img 
                src={book.seller_avatar_url} 
                alt={book.seller_name || 'বিক্রেতা'}
                className="seller-avatar-img"
              />
            ) : (
              <div className="seller-avatar-placeholder">
                {(book.seller_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="seller-details">
            <span className="seller-label desktop-only">বিক্রেতা: </span>
            <span className="seller-name">
              {book.seller_name || 'অজানা বিক্রেতা'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="card-actions flex gap-2">
        <button 
          className="btn-primary flex-1"
          onClick={(e) => {
            e.stopPropagation();
            handleContactSeller(book);
          }}
        >
          মেসেজ
        </button>
        <button 
          className="btn-secondary flex-1"
          onClick={(e) => {
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

// Filter Dialog Component with TypeScript typing
interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: BookFilter;
  setFilters: React.Dispatch<React.SetStateAction<BookFilter>>;
  priceRange: [number, number];
  setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  sortOption: string;
  setSortOption: React.Dispatch<React.SetStateAction<string>>;
  resetAllFilters: () => void;
}

const FilterDialog = ({ 
  open, 
  onOpenChange, 
  filters, 
  setFilters, 
  priceRange, 
  setPriceRange,
  sortOption,
  setSortOption,
  resetAllFilters
}: FilterDialogProps) => {
  // Local state to track changes before applying
  const [localFilters, setLocalFilters] = useState<BookFilter>({...filters});
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([...priceRange]);
  
  // Update local state when props change or dialog opens
  useEffect(() => {
    if (open) {
      setLocalFilters({...filters});
      setLocalPriceRange([...priceRange]);
    }
  }, [open, filters, priceRange]);
  
  // Apply filters and close dialog
  const handleApplyFilters = () => {
    console.log('Applying filters:', { localFilters, localPriceRange });
    setFilters({...localFilters});
    setPriceRange([...localPriceRange]);
    onOpenChange(false);
  };
  
  // Reset filters locally
  const handleResetFilters = () => {
    console.log('Resetting local filters');
    setLocalFilters({});
    setLocalPriceRange([0, 5000]);
    setSortOption('oldest');
  };
  
  // Apply reset globally
  const handleGlobalReset = () => {
    console.log('Resetting all filters globally');
    handleResetFilters();
    resetAllFilters();
    onOpenChange(false);
  };

  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        console.log('Closing filter dialog with Escape key');
        onOpenChange(false);
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  // If not open, don't render
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onOpenChange(false);
      }
    }}>
      <div className="bg-white w-full max-w-md sm:max-w-sm md:max-w-md rounded-lg shadow-xl animate-in fade-in-0 zoom-in-90 duration-300 max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            বই ফিল্টার করুন
          </h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="overflow-y-auto flex-grow p-4 max-h-[60vh]">
          <div className="space-y-5">
            {/* Price Range Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">মূল্য পরিসীমা</p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="bg-background/50 border-primary/10">৳{localPriceRange[0]}</Badge>
                  <span className="text-muted-foreground">-</span>
                  <Badge variant="outline" className="bg-background/50 border-primary/10">৳{localPriceRange[1]}</Badge>
                </div>
              </div>
              <Slider 
                value={[localPriceRange[0], localPriceRange[1]]} 
                min={0} 
                max={5000} 
                step={100}
                onValueChange={(value) => setLocalPriceRange([value[0], value[1]])}
                className="mt-2"
              />
            </div>
            
            <Separator className="my-1" />
            
            {/* Sorting Options */}
            <div>
              <label className="text-sm font-medium mb-2 block">সাজান</label>
              <Select 
                value={sortOption}
                onValueChange={(value) => setSortOption(value)}
              >
                <SelectTrigger className="bg-background/50 border-primary/10 hover:border-primary/20 focus:border-primary/30 h-11">
                  <SelectValue placeholder="সাজানোর ক্রম" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">সর্বশেষ যোগ করা (নতুন আগে)</SelectItem>
                  <SelectItem value="oldest">পুরাতন আগে</SelectItem>
                  <SelectItem value="price_low">কম দাম থেকে বেশি</SelectItem>
                  <SelectItem value="price_high">বেশি দাম থেকে কম</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator className="my-1" />
            
            {/* Department Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">বিভাগ</label>
              <Select 
                value={localFilters.department || "any"}
                onValueChange={(value) => {
                  setLocalFilters(prev => ({ 
                    ...prev, 
                    department: value === "any" ? undefined : value 
                  }));
                }}
              >
                <SelectTrigger className="bg-background/50 border-primary/10 hover:border-primary/20 focus:border-primary/30 h-11">
                  <SelectValue placeholder="সব বিভাগ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">সব বিভাগ</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Semester Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">সেমিস্টার</label>
              <Select 
                value={localFilters.semester || "any"}
                onValueChange={(value) => {
                  setLocalFilters(prev => ({ 
                    ...prev, 
                    semester: value === "any" ? undefined : value 
                  }));
                }}
              >
                <SelectTrigger className="bg-background/50 border-primary/10 hover:border-primary/20 focus:border-primary/30 h-11">
                  <SelectValue placeholder="সব সেমিস্টার" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">সব সেমিস্টার</SelectItem>
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
            
            {/* Publisher Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">প্রকাশনী</label>
              <Select 
                value={localFilters.publisher || "any"}
                onValueChange={(value) => {
                  setLocalFilters(prev => ({ 
                    ...prev, 
                    publisher: value === "any" ? undefined : value 
                  }));
                }}
              >
                <SelectTrigger className="bg-background/50 border-primary/10 hover:border-primary/20 focus:border-primary/30 h-11">
                  <SelectValue placeholder="সব প্রকাশনী" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">সব প্রকাশনী</SelectItem>
                  <SelectItem value="হক প্রকাশনী">হক প্রকাশনী</SelectItem>
                  <SelectItem value="টেকনিক্যাল প্রকাশনী">টেকনিক্যাল প্রকাশনী</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Institution Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">প্রতিষ্ঠান</label>
              <Select 
                value={localFilters.institute_name || "any"}
                onValueChange={(value) => {
                  setLocalFilters(prev => ({ 
                    ...prev, 
                    institute_name: value === "any" ? undefined : value 
                  }));
                }}
              >
                <SelectTrigger className="bg-background/50 border-primary/10 hover:border-primary/20 focus:border-primary/30 h-11">
                  <SelectValue placeholder="সব প্রতিষ্ঠান" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">সব প্রতিষ্ঠান</SelectItem>
                  <SelectItem value="বরিশাল পলিটেকনিক ইনস্টিটিউট">বরিশাল পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="ভোলা পলিটেকনিক ইনস্টিটিউট">ভোলা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="বগুড়া পলিটেকনিক ইনস্টিটিউট">বগুড়া পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="ব্রাহ্মণবাড়িয়া পলিটেকনিক ইনস্টিটিউট">ব্রাহ্মণবাড়িয়া পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="বাংলাদেশ সুইডেন পলিটেকনিক ইনস্টিটিউট">বাংলাদেশ সুইডেন পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="বরগুনা পলিটেকনিক ইনস্টিটিউট">বরগুনা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="বাংলাদেশ ইনস্টিটিউট অব গ্লাস অ্যান্ড সিরামিকস">বাংলাদেশ ইনস্টিটিউট অব গ্লাস অ্যান্ড সিরামিকস</SelectItem>
                  <SelectItem value="বাংলাদেশ সার্ভে ইনস্টিটিউট">বাংলাদেশ সার্ভে ইনস্টিটিউট</SelectItem>
                  <SelectItem value="চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট">চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="কক্সবাজার পলিটেকনিক ইনস্টিটিউট">কক্সবাজার পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট">চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="কুমিল্লা পলিটেকনিক ইনস্টিটিউট">কুমিল্লা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="চট্টগ্রাম মহিলা পলিটেকনিক ইনস্টিটিউট">চট্টগ্রাম মহিলা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="চাঁদপুর পলিটেকনিক ইনস্টিটিউট">চাঁদপুর পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="ঢাকা পলিটেকনিক ইনস্টিটিউট">ঢাকা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="ঢাকা মহিলা পলিটেকনিক ইনস্টিটিউট">ঢাকা মহিলা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="দিনাজপুর পলিটেকনিক ইনস্টিটিউট">দিনাজপুর পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="ফেনী পলিটেকনিক ইনস্টিটিউট">ফেনী পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="ফেনী কম্পিউটার ইনস্টিটিউট">ফেনী কম্পিউটার ইনস্টিটিউট</SelectItem>
                  <SelectItem value="ফরিদপুর পলিটেকনিক ইনস্টিটিউট">ফরিদপুর পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="গ্রাফিক আর্টস ইনস্টিটিউট">গ্রাফিক আর্টস ইনস্টিটিউট</SelectItem>
                  <SelectItem value="গোপালগঞ্জ পলিটেকনিক ইনস্টিটিউট">গোপালগঞ্জ পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="হবিগঞ্জ পলিটেকনিক ইনস্টিটিউট">হবিগঞ্জ পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="ঝিনাইদহ পলিটেকনিক ইনস্টিটিউট">ঝিনাইদহ পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="যশোর পলিটেকনিক ইনস্টিটিউট">যশোর পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="খুলনা পলিটেকনিক ইনস্টিটিউট">খুলনা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="খুলনা মহিলা পলিটেকনিক ইনস্টিটিউট">খুলনা মহিলা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="কিশোরগঞ্জ পলিটেকনিক ইনস্টিটিউট">কিশোরগঞ্জ পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="কুষ্টিয়া পলিটেকনিক ইনস্টিটিউট">কুষ্টিয়া পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="কুড়িগ্রাম পলিটেকনিক ইনস্টিটিউট">কুড়িগ্রাম পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="লক্ষ্মীপুর পলিটেকনিক ইনস্টিটিউট">লক্ষ্মীপুর পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="মুন্সিগঞ্জ পলিটেকনিক ইনস্টিটিউট">মুন্সিগঞ্জ পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="মাগুরা পলিটেকনিক ইনস্টিটিউট">মাগুরা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="নওগাঁ পলিটেকনিক ইনস্টিটিউট">নওগাঁ পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="ময়মনসিংহ পলিটেকনিক ইনস্টিটিউট">ময়মনসিংহ পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="মৌলভীবাজার পলিটেকনিক ইনস্টিটিউট">মৌলভীবাজার পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="নরসিংদী পলিটেকনিক ইনস্টিটিউট">নরসিংদী পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="পটুয়াখালী পলিটেকনিক ইনস্টিটিউট">পটুয়াখালী পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="পাবনা পলিটেকনিক ইনস্টিটিউট">পাবনা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="রংপুর পলিটেকনিক ইনস্টিটিউট">রংপুর পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="রাজশাহী পলিটেকনিক ইনস্টিটিউট">রাজশাহী পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="রাজশাহী মহিলা পলিটেকনিক ইনস্টিটিউট">রাজশাহী মহিলা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="সাতক্ষীরা পলিটেকনিক ইনস্টিটিউট">সাতক্ষীরা পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="শরীয়তপুর পলিটেকনিক ইনস্টিটিউট">শরীয়তপুর পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="শেরপুর পলিটেকনিক ইনস্টিটিউট">শেরপুর পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="সিরাজগঞ্জ পলিটেকনিক ইনস্টিটিউট">সিরাজগঞ্জ পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="সিলেট পলিটেকনিক ইনস্টিটিউট">সিলেট পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="টাঙ্গাইল পলিটেকনিক ইনস্টিটিউট">টাঙ্গাইল পলিটেকনিক ইনস্টিটিউট</SelectItem>
                  <SelectItem value="ঠাকুরগাঁও পলিটেকনিক ইনস্টিটিউট">ঠাকুরগাঁও পলিটেকনিক ইনস্টিটিউট</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between gap-2 p-4 border-t sticky bottom-0 bg-white shadow-md">
          <Button 
            variant="ghost" 
            onClick={handleGlobalReset}
            className="bg-background/50 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300 transition-all duration-300 h-10"
          >
            <X className="h-4 w-4 mr-2" />
            রিসেট
          </Button>
          
          <Button 
            onClick={handleApplyFilters}
            className="bg-primary text-white h-10 hover:bg-primary/90 hover:shadow-md transition-all duration-300 font-medium"
          >
            <Filter className="h-4 w-4 mr-2" />
            প্রয়োগ করুন
          </Button>
        </div>
      </div>
    </div>
  );
};

const BrowseBooksPage = () => {
  const { user, isVerified, verificationLoading } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(
    Boolean(searchParams.get('department')) || 
    Boolean(searchParams.get('category')) || 
    Boolean(searchParams.get('condition')) || 
    Boolean(searchParams.get('min_price')) || 
    Boolean(searchParams.get('max_price'))
  );
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  
  // Track filter dialog state changes
  useEffect(() => {
    console.log('Filter dialog open state changed:', isFilterDialogOpen);
  }, [isFilterDialogOpen]);
  
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [books, setBooks] = useState<BookEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BookFilter>({
    category: searchParams.get('category') || undefined,
    department: searchParams.get('department') || undefined,
    condition: searchParams.get('condition') || undefined,
    semester: searchParams.get('semester') || undefined,
    publisher: searchParams.get('publisher') || undefined,
    institute_name: searchParams.get('institute_name') || undefined
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get('min_price') || '0'), 
    parseInt(searchParams.get('max_price') || '5000')
  ]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);
  const [page, setPage] = useState(0);
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'oldest');
  const BOOKS_PER_PAGE = 12;
  
  // State for message dialog
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageBook, setMessageBook] = useState<BookEntity | null>(null);
  
  // State for wishlist (with local storage persistence)
  const [wishlist, setWishlist] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('bookWishlist');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Update search params and save filter state
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    if (searchTerm) newParams.set('search', searchTerm);
    if (filters.category) newParams.set('category', filters.category);
    if (filters.department) newParams.set('department', filters.department);
    if (filters.condition) newParams.set('condition', filters.condition);
    if (filters.semester) newParams.set('semester', filters.semester);
    if (filters.publisher) newParams.set('publisher', filters.publisher);
    if (filters.institute_name) newParams.set('institute_name', filters.institute_name);
    if (priceRange[0] > 0) newParams.set('min_price', priceRange[0].toString());
    if (priceRange[1] < 5000) newParams.set('max_price', priceRange[1].toString());
    if (sortOption !== 'newest') newParams.set('sort', sortOption);
    
    setSearchParams(newParams);
    
    // Save filter state to sessionStorage
    const filterState = {
      searchTerm,
      filters,
      priceRange,
      sortOption
    };
    sessionStorage.setItem('bookFilterState', JSON.stringify(filterState));
  }, [searchTerm, filters, priceRange, sortOption, setSearchParams]);

  // Load saved filter state on initial render
  useEffect(() => {
    // Only load saved state if there are no URL parameters
    if ([...searchParams.entries()].length === 0) {
      try {
        const savedState = sessionStorage.getItem('bookFilterState');
        if (savedState) {
          const { searchTerm: savedSearchTerm, filters: savedFilters, 
                  priceRange: savedPriceRange, sortOption: savedSortOption } = JSON.parse(savedState);
          
          console.log('Restoring saved filter state:', { savedSearchTerm, savedFilters, savedPriceRange, savedSortOption });
          
          // Restore saved state
          setSearchTerm(savedSearchTerm || '');
          setFilters(savedFilters || {});
          setPriceRange(savedPriceRange || [0, 5000]);
          setSortOption(savedSortOption || 'oldest');
        }
      } catch (err) {
        console.error('Error loading saved filter state:', err);
        // If there's an error, clear session storage
        sessionStorage.removeItem('bookFilterState');
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bookWishlist', JSON.stringify([...wishlist]));
  }, [wishlist]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Memoize the callback function to prevent infinite updates
  const handleRealtimeUpdate = useCallback((payload) => {
    const newBook = payload.new as BookEntity;
    const oldBook = payload.old as BookEntity;
    
    if (payload.eventType === 'UPDATE') {
      setBooks(prev => 
        prev.map(book => book.id === newBook.id ? newBook : book)
      );
    } else if (payload.eventType === 'INSERT') {
      // Only add if it matches current filters
      if (
(!filters.category || filters.category === newBook.category) &&
        (!filters.condition || filters.condition === newBook.condition) &&
        (!filters.department || filters.department === newBook.department) &&
        (!filters.semester || filters.semester === newBook.semester) &&
        (!filters.publisher || filters.publisher === newBook.publisher) &&
        (newBook.price >= priceRange[0] && newBook.price <= priceRange[1])
      ) {
        setBooks(prev => [newBook, ...prev]);
      }
    } else if (payload.eventType === 'DELETE') {
      setBooks(prev => prev.filter(book => book.id !== oldBook.id));
    }
  }, [filters, priceRange]);

  // Subscribe to realtime updates
  useSupabaseRealtime(
    {
      table: 'books',
      event: '*'
    },
    handleRealtimeUpdate,
    true
  );

  // Fetch books when filters change
  useEffect(() => {
    fetchBooks();
  }, [searchTerm, filters, priceRange, sortOption]);

  // Fetch books from API with improved error handling
const fetchBooks = async () => {
    // সব লোডিং অবস্থা সেট করি
    setLoading(true);
    setError(null);
    setPage(0);
    // Validate filters
    if (filters.semester === 'any') filters.semester = undefined;
    if (filters.publisher === 'any') filters.publisher = undefined;
    
    try {
      // ফিল্টার অব্জেক্ট তৈরি করি
      const bookFilter: BookFilter = {
        category: filters.category,
        condition: filters.condition,
        department: filters.department,
        semester: filters.semester,
        publisher: filters.publisher,
        institute_name: filters.institute_name,
        min_price: priceRange[0],
        max_price: priceRange[1],
        search_term: searchTerm
      };
      
      // Debug: বিস্তারিত ফিল্টার তথ্য
      console.log('=== Filter Debug Info ===');
      console.log('Current filters state:', filters);
      console.log('Price range:', priceRange);
      console.log('Search term:', searchTerm);
      console.log('Final book filter object:', JSON.stringify(bookFilter, null, 2));
      
      // সর্টিং অপশন অনুযায়ী প্যারামিটার সেট করি
      let sortBy = 'created_at';
      let sortOrder: 'asc' | 'desc' = 'desc';
      
      switch (sortOption) {
        case 'oldest':
          sortBy = 'created_at';
          sortOrder = 'asc';
          break;
        case 'price_low':
          sortBy = 'price';
          sortOrder = 'asc';
          break;
        case 'price_high':
          sortBy = 'price';
          sortOrder = 'desc';
          break;
        default: // newest
          sortBy = 'created_at';
          sortOrder = 'desc';
      }
      
      console.log('Sort options:', { sortBy, sortOrder });
      console.log('Calling getBooks with:', { bookFilter, BOOKS_PER_PAGE, sortBy, sortOrder });
      
      // API কল করি এবং সাধারণ মেথড এর বদলে getBooks ব্যবহার করি 
      // যাতে সকল কেইসে ডাটা প্রসেসিং হয়
      const result = await getBooks(bookFilter, BOOKS_PER_PAGE, 0, sortBy, sortOrder);
      
      // এরর চেক করি
      if (result.error) {
        console.error('Error from getBooks:', result.error);
        throw new Error(result.error.message || 'Error fetching books');
      }
      
      // ডাটা চেক করি - যদি ডাটা undefined হয়
      if (!result.data) {
        throw new Error('No data received from API');
      }
      
      // সফল হলে স্টেট আপডেট করি
      setBooks(result.data);
      setHasMoreBooks(result.data.length === BOOKS_PER_PAGE);
      
      // যদি খুঁজে কোন বই না পাওয়া যায়, তাহলে মেসেজ দেখাই
      if (result.data.length === 0) {
        console.log('No books found matching filters');
      }
    } catch (err: any) {
      console.error('Error fetching books:', err);
      
      // বিস্তারিত এরর ম্যাসেজ
      if (err.message && err.message.includes('network')) {
        setError('ইন্টারনেট সংযোগ সমস্যা। আপনার ইন্টারনেট কানেকশন চেক করুন।');
      } else if (err.status === 429) {
        setError('অতিরিক্ত অনুরোধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।');
      } else {
        setError('বই লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      }
      
      // খালি অ্যারে সেট করা হচ্ছে
      setBooks([]);
      setHasMoreBooks(false);
    } finally {
      // লোডিং বন্ধ করা
      setLoading(false);
    }
  };

  // Load more books
  const loadMoreBooks = useCallback(async () => {
    // যদি বর্তমানে লোডিং চলছে, তাহলে রিটার্ন করা
    if (isLoadingMore) return;
    
    // লোডিং স্টেট সেট করা
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      // ফিল্টার সেটিং সেট করা
      const bookFilter: BookFilter = {
        category: filters.category,
        condition: filters.condition,
        department: filters.department,
        semester: filters.semester,
        publisher: filters.publisher,
        institute_name: filters.institute_name,
        min_price: priceRange[0],
        max_price: priceRange[1],
        search_term: searchTerm
      };
      
      // সর্টিং অপশন সেট করা
      let sortBy = 'created_at';
      let sortOrder: 'asc' | 'desc' = 'desc';
      
      switch (sortOption) {
        case 'oldest':
          sortBy = 'created_at';
          sortOrder = 'asc';
          break;
        case 'price_low':
          sortBy = 'price';
          sortOrder = 'asc';
          break;
        case 'price_high':
          sortBy = 'price';
          sortOrder = 'desc';
          break;
        default: // newest
          sortBy = 'created_at';
          sortOrder = 'desc';
      }
      
      // পেজিনেশন অফসেট গণনা করা
      const offset = nextPage * BOOKS_PER_PAGE;
      console.log(`Loading more books, page: ${nextPage}, offset: ${offset}, filter:`, bookFilter);
      
      // API কল
      const result = await getBooks(bookFilter, BOOKS_PER_PAGE, offset, sortBy, sortOrder);
      
      // রেজাল্ট চেক করা
      if (result.error) {
        console.error('Error loading more books:', result.error);
        throw result.error;
      }
      
      // ডাটা চেক এবং স্টেট আপডেট করা
      if (result.data && result.data.length > 0) {
        setBooks(prevBooks => {
          // ডুপ্লিকেট বই যাতে না থাকে তার জন্য আইডি চেক করা
          const existingIds = new Set(prevBooks.map(book => book.id));
          const uniqueNewBooks = result.data.filter(book => !existingIds.has(book.id));
          
          return [...prevBooks, ...uniqueNewBooks];
        });
        
        setPage(nextPage);
        setHasMoreBooks(result.data.length === BOOKS_PER_PAGE);
        
        console.log(`Loaded ${result.data.length} more books, hasMore: ${result.data.length === BOOKS_PER_PAGE}`);
      } else {
        // আর বেশি বই না থাকলে হ্যাজমোর ফ্ল্যাগ আপডেট করা
        setHasMoreBooks(false);
        console.log('No more books to load');
        
        // নোটিফিকেশন দেখানো
        toast({
          title: "সব বই দেখানো হয়েছে",
          description: "আর কোনো বই পাওয়া যায়নি।",
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error('Error loading more books:', err);
      
      // এরর নোটিফিকেশন দেখানো
      toast({
        title: "বই লোড করা যায়নি",
        description: err.message || "আরও বই লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      // লোডিং স্টেট রিসেট করা
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, page, filters, priceRange, searchTerm, sortOption, toast]);

  // Send message to seller
  const handleContactSeller = async (book: BookEntity) => {
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'বিক্রেতার সাথে যোগাযোগ করতে লগইন করুন',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    
    console.log('🚀 handleContactSeller called:', {
      userId: user.id,
      bookId: book.id,
      authContextVerified: isVerified,
      verificationLoading: verificationLoading,
    });
    
    // If verification is still loading or not yet determined, do a direct check
    let currentVerificationStatus = isVerified;
    
    if (verificationLoading || (!isVerified && !verificationLoading)) {
      console.log('⏳ Verification status unclear, doing direct check...');
      console.log('Current state:', { isVerified, verificationLoading });
      
      try {
        // Do a direct verification check instead of waiting
        const { isVerified: directVerified, error } = await getUserVerificationStatus(user.id);
        
        if (error) {
          console.error('Error in direct verification check:', error);
          
          // Fallback: if direct check fails, assume not verified for safety
          console.log('🚨 Direct check failed, assuming not verified for safety');
          currentVerificationStatus = false;
        } else {
          currentVerificationStatus = directVerified;
          console.log('✅ Direct verification check result:', directVerified);
        }
        
      } catch (error) {
        console.error('Exception in direct verification check:', error);
        
        // Fallback: if direct check fails with exception, assume not verified
        console.log('🚨 Direct check exception, assuming not verified for safety');
        currentVerificationStatus = false;
      }
    } else {
      console.log('✅ Using cached verification status:', isVerified);
    }
    
    if (!currentVerificationStatus) {
      console.log('❌ User is NOT verified');
      
      toast({
        title: 'ভেরিফিকেশন প্রয়োজন',
        description: 'বিক্রেতার সাথে মেসেজ করতে আপনার অ্যাকাউন্ট ভেরিফাই করা থাকতে হবে।',
        variant: 'destructive'
      });
      navigate('/verification');
      return;
    }
    
    console.log('✅ User is verified - proceeding with message flow');
    
    // Check if user and seller are from the same institution
    if (profile && book.seller_id) {
      try {
        // Fetch seller profile
        const { data: sellerProfile, error } = await supabase
          .from('profiles')
          .select('institute_name')
          .eq('id', book.seller_id)
          .single();
          
        if (error) throw error;
        
        // If institutions don't match, redirect to not-allowed page
        if (profile.institute_name !== sellerProfile?.institute_name) {
          navigate('/not-allowed');
          return;
        }
      } catch (error) {
        console.error('Error checking institution match:', error);
        toast({
          title: "ত্রুটি",
          description: "প্রতিষ্ঠানের তথ্য যাচাই করতে সমস্যা হয়েছে।",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Open message dialog with the selected book
    setMessageBook(book);
    setIsMessageDialogOpen(true);
  };

  // Get condition label
  const getConditionLabel = (condition: string) => {
    return bookConditions.find(c => c.value === condition)?.label || condition;
  };
  
  // Handle view book details
  const handleViewBookDetails = (book: BookEntity) => {
    // Navigate to the book detail page instead of showing a dialog
    navigate(`/book/${book.id}`);
  };
  
  // Handle purchase request
  const handlePurchaseRequest = async (book: BookEntity) => {
    if (!user) {
      toast({
        title: "লগইন প্রয়োজন",
        description: "বই কেনার অনুরোধ করতে আগে লগইন করুন",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    // Check if user and seller are from the same institution
    if (profile && book.seller_id) {
      try {
        // Fetch seller profile
        const { data: sellerProfile, error } = await supabase
          .from('profiles')
          .select('institute_name')
          .eq('id', book.seller_id)
          .single();
          
        if (error) throw error;
        
        // If institutions don't match, redirect to not allowed page
        if (profile.institute_name !== sellerProfile?.institute_name) {
          navigate('/not-allowed');
          return;
        }
      } catch (error) {
        console.error('Error checking institution match:', error);
      }
    }
    
    // Navigate to the book detail page with purchase param
    navigate(`/book/${book.id}?purchase=true`);
  };
  
  // Get category label
  const getCategoryLabel = (category: string) => {
    return bookCategories.find(c => c.value === category)?.label || category;
  };
  
  // Get department label
  const getDepartmentLabel = (department: string) => {
    return departments.find(d => d.value === department)?.label || department;
  };
  
  // Handle department click
  const handleDepartmentClick = (department: string) => {
    setFilters(prev => ({ ...prev, department }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Toggle wishlist
  const toggleWishlist = (bookId: string) => {
    if (!user) {
      toast({
        title: 'লগইন প্রয়োজন',
        description: 'ইচ্ছেতালিকায় যোগ করতে লগইন করুন',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    
    setWishlist(prev => {
      const newWishlist = new Set(prev);
      if (newWishlist.has(bookId)) {
        newWishlist.delete(bookId);
        toast({
          title: 'সফল',
          description: 'বইটি ইচ্ছেতালিকা থেকে সরানো হয়েছে',
        });
      } else {
        newWishlist.add(bookId);
        toast({
          title: 'সফল',
          description: 'বইটি ইচ্ছেতালিকায় যোগ করা হয়েছে',
        });
      }
      return newWishlist;
    });
  };
  
  // Reset all filters
  const resetAllFilters = useCallback(() => {
    // সমস্ত ফিল্টার রিসেট করি
    setFilters({});
    setPriceRange([0, 5000]);
    setSortOption('oldest');
    setSearchTerm('');
    
    // URL থেকে সমস্ত ফিল্টার পরিষ্কার করি
    setSearchParams(new URLSearchParams());
    
    // বইয়ের লিস্ট পুনরায় লোড করি
    setTimeout(() => {
      fetchBooks();
    }, 0);
    
    // সাফল্যের মেসেজ দেখাই
    toast({
      title: "ফিল্টার রিসেট হয়েছে",
      description: "সমস্ত ফিল্টার পুনরায় সেট করা হয়েছে।",
      variant: "default",
    });
  }, [setSearchParams, fetchBooks, toast]);
  
  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate book card skeletons for loading state
  const renderSkeletons = () => {
    return Array(8).fill(0).map((_, index) => (
      <Card key={`skeleton-${index}`} className="book-card animate-pulse">
        <div className="h-[240px] relative">
          <Skeleton className="w-full h-full" />
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2 mb-3" />
          <div className="flex justify-between mb-2">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-3 w-2/5 mt-auto mb-2" />
          <div className="flex justify-between gap-2 mt-2">
            <Skeleton className="h-9 w-1/2" />
            <Skeleton className="h-9 w-1/2" />
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="min-h-screen bg-[#EFF4FA]">
      <Navigation />
      
      {/* Floating back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 animate-fade-in"
          aria-label="উপরে যান"
        >
          <ArrowUp size={20} />
        </button>
      )}
      
      {/* Modern Hero Section with 3D elements and animation */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-[#EFF4FA] to-accent/5">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-primary/10 animate-pulse-slow"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-accent/10 animate-pulse-slow animation-delay-2000"></div>
          <div className="absolute top-40 right-1/4 w-20 h-20 rounded-full bg-secondary/10 animate-pulse-slow animation-delay-1000"></div>
          
          {/* Floating book illustrations */}
          <div className="hidden md:block absolute -right-20 top-20 transform rotate-12 opacity-20 animate-float">
            <BookOpen size={180} className="text-primary/30" />
          </div>
          <div className="hidden md:block absolute left-10 bottom-5 transform -rotate-6 opacity-10 animate-float animation-delay-2000">
            <BookOpen size={120} className="text-accent/30" />
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-8 md:pb-12 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            {/* Hero content */}
            <div className="max-w-2xl mb-10 lg:mb-0">
            {/* Breadcrumb */}
              <Breadcrumb className="mb-6">
              <BreadcrumbList>
                {filters.department && (
                  <BreadcrumbItem>
                    <BreadcrumbLink className="text-foreground/70">
                      {getDepartmentLabel(filters.department)}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                )}
                {filters.category && (
                  <>
                    {filters.department && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      <BreadcrumbLink className="text-foreground/70">
                        {getCategoryLabel(filters.category)}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-4">
                আপনার পছন্দের বই খুঁজুন
              </h1>
              
              <p className="text-lg text-foreground/70 mb-8">
                হাজার হাজার বইয়ের মধ্যে আপনার পছন্দের বইটি খুঁজে নিন সহজেই। বিক্রি করুন আপনার পুরানো বইগুলি।
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="px-3 py-1.5 bg-primary/10 text-primary border-none text-xs font-normal hover:bg-primary/10 hover:text-primary">
                    {books.length}+ বই উপলব্ধ
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1.5 bg-accent/10 text-accent border-none text-xs font-normal hover:bg-accent/10 hover:text-accent">
                    দ্রুত ডেলিভারি
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1.5 bg-primary/10 text-primary border-none text-xs font-normal hover:bg-primary/10 hover:text-primary">
                    সেরা মূল্য
                  </Badge>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-fit flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-primary/20 text-sm text-gray-800 hover:bg-white/80 hover:border-primary/20 hover:text-gray-800"
                  onClick={() => setIsVideoDialogOpen(true)}
                >
                  <Play className="h-4 w-4 text-primary" />
                  কিভাবে বই কিনবেন দেখুন এই ভিডিওতে
                </Button>
              </div>
            </div>

            {/* 3D-style search card - Increased height */}
            <div className="w-full lg:w-[500px] perspective-1000">
              <Card className="bg-white border border-gray-200 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-5">
                    {/* Search field */}
                    <div>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="বই, লেখক বা বিষয় দিয়ে খুঁজুন..." 
                          className="pl-10 bg-white border-primary/10 hover:border-primary/20 focus:border-primary/30 h-12 text-base"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                
                    {/* Filters toggle */}
                    <div>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-white border-primary/10 hover:border-primary/20 focus:border-primary/30 h-12 text-base"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Opening filter dialog from main button');
                          setIsFilterDialogOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Filter className="h-5 w-5 text-primary" />
                          ফিল্টার করুন
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </div>
                    
                    {/* বিভাগ সেকশন - Always visible */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium">বিভাগ</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-primary hover:text-primary/80 hover:bg-primary/5 p-0 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/all-departments');
                          }}
                        >
                          <span className="text-xs">আরও দেখুন</span>
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'কম্পিউটার টেকনোলজি', label: 'কম্পিউটার টেকনোলজি', shortLabel: 'কম্পিউটার' },
                          { value: 'সিভিল টেকনোলজি', label: 'সিভিল টেকনোলজি', shortLabel: 'সিভিল' },
                          { value: 'ইলেকট্রিক্যাল টেকনোলজি', label: 'ইলেকট্রিক্যাল টেকনোলজি', shortLabel: 'ইলেকট্রিক্যাল' },
                          { value: 'মেকানিক্যাল টেকনোলজি', label: 'মেকানিক্যাল টেকনোলজি', shortLabel: 'মেকানিক্যাল' },
                          { value: 'ইলেকট্রনিক্স টেকনোলজি', label: 'ইলেকট্রনিক্স টেকনোলজি', shortLabel: 'ইলেকট্রনিক্স' },
                          { value: 'ফুড টেকনোলজি', label: 'ফুড টেকনোলজি', shortLabel: 'ফুড' }
                        ].map((dept, index) => (
                          <Badge 
                            key={index}
                            variant={filters.department === dept.value ? "default" : "outline"}
                            className={`${filters.department === dept.value 
                              ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                              : 'bg-white border-gray-300 hover:border-primary/50 hover:bg-primary/8 text-gray-700 font-medium'} 
                              cursor-pointer text-xs py-2 px-3 rounded-full transition-all duration-200 shadow-sm hover:shadow-md`}
                            onClick={() => {
                              console.log('Department badge clicked:', dept.value);
                              setFilters(prev => ({ 
                                ...prev, 
                                department: prev.department === dept.value ? undefined : dept.value 
                              }));
                            }}
                          >
                            {/* Show short label on mobile, full label on larger screens */}
                            <span className="block md:hidden">{dept.shortLabel}</span>
                            <span className="hidden md:block">{dept.label}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Section Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                সকল বই
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                আপনার পছন্দের বইটি খুঁজে নিন আমাদের বিশাল সংগ্রহ থেকে
              </p>
            </div>
            {!loading && !error && (
              <div className="text-right">
                <p className="text-lg font-semibold text-primary">
                  {books.length}+ বই পাওয়া গেছে
                </p>
                <p className="text-xs text-muted-foreground">
                  উপলব্ধ সংগ্রহ
                </p>
              </div>
            )}
          </div>
          <div className="w-full h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"></div>
        </div>
        
        {/* Books Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {loading ? (
            renderSkeletons()
        ) : error ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-destructive/10 text-destructive rounded-lg p-4 max-w-lg mx-auto">
                <p className="font-medium">{error}</p>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => fetchBooks()}
                  className="mt-4"
                >
                  <span className="mr-2">আবার চেষ্টা করুন</span>
                  {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
              </div>
            </div>
        ) : books.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-muted rounded-lg p-8 max-w-lg mx-auto">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">কোন বই পাওয়া যায়নি</h3>
                <p className="text-muted-foreground mb-4">
                  আপনার সার্চ ক্রাইটেরিয়া পরিবর্তন করে আবার চেষ্টা করুন।
                </p>
                <Button 
                  variant="outline"
                  onClick={resetAllFilters}
                >
                  ফিল্টার রিসেট করুন
                </Button>
              </div>
            </div>
        ) : (
          books.map(book => (
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
        )}
        </div>
        
        {/* Load More Button */}
        {!loading && !error && books.length > 0 && hasMoreBooks && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              onClick={loadMoreBooks}
              disabled={isLoadingMore}
              className="px-8 py-6 rounded-full border border-primary/20 hover:border-primary/40 transition-all duration-300"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  লোড হচ্ছে...
                </>
              ) : (
                'আরও বই দেখুন'
              )}
            </Button>
          </div>
        )}
      </main>
      
      {/* Add Message Dialog */}
      <MessageDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        recipientId={messageBook?.seller_id || ''}
        recipientName={messageBook?.seller_name || 'অজানা বিক্রেতা'}
        bookId={messageBook?.id}
        bookTitle={messageBook?.title}
        book={messageBook}
      />
      
      {/* Filter Dialog */}
      <FilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        filters={filters}
        setFilters={setFilters}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        sortOption={sortOption}
        setSortOption={setSortOption}
        resetAllFilters={resetAllFilters}
      />
      
      {/* Video Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-3xl w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800">কিভাবে বই কিনবেন - ভিডিও গাইড</DialogTitle>
          </DialogHeader>
          <div className="relative pb-[56.25%] h-0 mt-4 rounded-lg overflow-hidden shadow-xl border border-slate-200">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/8SywvJirSMc?si=jWWXG02DoFb1v2-b"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseBooksPage;
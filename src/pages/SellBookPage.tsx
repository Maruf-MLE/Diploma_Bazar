import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { BookOpen, Camera, MapPin, Tag, User, GraduationCap, Building, DollarSign, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';

const SellBookPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [author] = useState('লেখক তথ্য'); // Hidden field with default value
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('new');
  const [conditionDescription] = useState(''); // Hidden field with default value
  const [category] = useState('বই'); // Hidden field with default value
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([]);
  const [location] = useState(''); // Hidden field with default value
  const [discountRate, setDiscountRate] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isNegotiable] = useState(true); // Hidden field with default value
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Fetch user profile data and verification status
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setIsCheckingVerification(false);
        return;
      }
      
      try {
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('department, institute_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profile) {
          setUserProfile(profile);
          setDepartment(profile.department || '');
          setInstituteName(profile.institute_name || '');
        }

        // Fetch verification status
        const { data: verificationData, error: verificationError } = await supabase
          .from('verification_data')
          .select('is_verified')
          .eq('user_id', user.id)
          .single();

        if (verificationError) {
          console.error('Error fetching verification:', verificationError);
          // If no verification record exists, user is not verified
          setIsVerified(false);
        } else {
          setIsVerified(verificationData?.is_verified || false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsVerified(false);
      } finally {
        setIsCheckingVerification(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  // File upload function
  const uploadImageToSupabase = async (file: File, folder: string = 'covers'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('books')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('books')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Handle cover image file change
  const handleCoverImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "ত্রুটি",
        description: "শুধুমাত্র ইমেজ ফাইল আপলোড করুন।",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "ত্রুটি",
        description: "ফাইলের সাইজ ১০MB এর চেয়ে কম হতে হবে।",
        variant: "destructive",
      });
      return;
    }

    setCoverImageFile(file);
  };

  // Handle additional images file change
  const handleAdditionalImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "ত্রুটি",
          description: "শুধুমাত্র ইমেজ ফাইল আপলোড করুন।",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "ত্রুটি",
          description: "প্রতিটি ফাইলের সাইজ ১০MB এর চেয়ে কম হতে হবে।",
          variant: "destructive",
        });
        return;
      }
    }

    // Limit to 5 additional images
    if (files.length > 5) {
      toast({
        title: "ত্রুটি",
        description: "সর্বোচ্চ ৫টি অতিরিক্ত ছবি আপলোড করতে পারবেন।",
        variant: "destructive",
      });
      return;
    }

    setAdditionalImageFiles(files);
  };

  // Remove additional image
  const removeAdditionalImage = (index: number) => {
    const newFiles = additionalImageFiles.filter((_, i) => i !== index);
    setAdditionalImageFiles(newFiles);
  };

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">লগইন প্রয়োজন</h2>
            <p className="text-gray-600 mb-4">বই বিক্রি করতে হলে আপনাকে লগইন করতে হবে।</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              লগইন করুন
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while checking verification
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">যাচাই করা হচ্ছে...</h2>
            <p className="text-gray-600">আপনার তথ্য যাচাই করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন।</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is verified
  if (isVerified === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">যাচাইকরণ প্রয়োজন</h2>
            <p className="text-gray-600 mb-4">বই বিক্রি করতে হলে আপনাকে প্রথমে যাচাইকরণ সম্পন্ন করতে হবে।</p>
            <Button onClick={() => window.location.href = 'http://localhost:8080/verification'} className="w-full">
              যাচাইকরণ করুন
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "ত্রুটি",
        description: "আপনাকে লগইন করতে হবে।",
        variant: "destructive",
      });
      return;
    }

    // Basic validation
    if (!title.trim() || !description.trim() || !price.trim()) {
      toast({
        title: "ত্রুটি",
        description: "সব প্রয়োজনীয় ক্ষেত্র পূরণ করুন।",
        variant: "destructive",
      });
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast({
        title: "ত্রুটি",
        description: "সঠিক মূল্য প্রবেশ করান।",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      setIsUploadingImages(true);
      
      // Upload cover image if file is selected
      let finalCoverImageUrl = coverImageUrl;
      if (coverImageFile) {
        const uploadedUrl = await uploadImageToSupabase(coverImageFile, 'covers');
        if (uploadedUrl) {
          finalCoverImageUrl = uploadedUrl;
        } else {
          toast({
            title: "ত্রুটি",
            description: "কভার ইমেজ আপলোড করতে সমস্যা হয়েছে।",
            variant: "destructive",
          });
          setIsSubmitting(false);
          setIsUploadingImages(false);
          return;
        }
      }
      
      // Upload additional images if files are selected
      let finalAdditionalImages = [...additionalImageUrls];
      if (additionalImageFiles.length > 0) {
        for (const file of additionalImageFiles) {
          const uploadedUrl = await uploadImageToSupabase(file, 'additional');
          if (uploadedUrl) {
            finalAdditionalImages.push(uploadedUrl);
          } else {
            toast({
              title: "সতর্কতা",
              description: "কিছু অতিরিক্ত ছবি আপলোড করতে সমস্যা হয়েছে।",
              variant: "destructive",
            });
          }
        }
      }
      
      setIsUploadingImages(false);

      // Process discount rate
      const numericDiscountRate = discountRate.trim() ? parseFloat(discountRate) : null;
      if (numericDiscountRate !== null && (isNaN(numericDiscountRate) || numericDiscountRate < 0 || numericDiscountRate > 100)) {
        toast({
          title: "ত্রুটি",
          description: "ছাড়ের হার 0-100% এর মধ্যে হতে হবে।",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('books')
        .insert({
          id: crypto.randomUUID(),
          title: title.trim(),
          author: author.trim(),
          description: description.trim(),
          price: numericPrice,
          condition,
          condition_description: conditionDescription.trim() || null,
          category: category.trim(),
          semester: semester.trim() || null,
          department: department.trim() || null,
          institute_name: instituteName.trim() || null,
          cover_image_url: finalCoverImageUrl.trim() || null,
          additional_images: finalAdditionalImages.length > 0 ? finalAdditionalImages : null,
          seller_id: user.id,
          location: location.trim() || null,
          discount_rate: numericDiscountRate,
          publisher: publisher.trim() || null,
          is_negotiable: isNegotiable,
          status: 'available',
          is_sold: false
        });

      if (error) throw error;

      toast({
        title: "সফল",
        description: "বই সফলভাবে যোগ করা হয়েছে!",
      });
      
      // Reset form
      setTitle('');
      // author, conditionDescription, location, isNegotiable are hidden and use default values
      setDescription('');
      setPrice('');
      setCondition('new');
      // category is hidden and uses default value
      setSemester('');
      setDepartment('');
      setInstituteName('');
      setCoverImageFile(null);
      setCoverImageUrl('');
      setAdditionalImageFiles([]);
      setAdditionalImageUrls([]);
      setDiscountRate('');
      setPublisher('');
      
      // Redirect to browse page after success
      setTimeout(() => {
        navigate('/browse');
      }, 2000);

    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: "ত্রুটি",
        description: "বই যোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen py-8 pt-24" style={{ backgroundColor: '#EEF4FF' }}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 py-8 px-4 rounded-lg" style={{ backgroundColor: '#4653D5' }}>
          <BookOpen className="h-12 w-12 text-white mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">বই বিক্রি করুন</h1>
          <p className="text-white/90">আপনার বই যোগ করুন এবং অন্যদের সাথে শেয়ার করুন</p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="border-b border-gray-100 pb-6">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
              <BookOpen className="h-6 w-6 text-primary" />
              বই বিক্রির ফর্ম
            </CardTitle>
            <p className="text-gray-600 mt-2">নিচের সকল তথ্য পূরণ করে আপনার বই বিক্রি করুন</p>
          </CardHeader>
          <CardContent className="p-4 md:p-8" style={{ backgroundColor: '#ECF2FE' }}>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-3 md:space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">বইয়ের শিরোনাম *</Label>
                    <Input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="বইয়ের নাম লিখুন"
                      className="border-gray-300 focus:border-primary focus:ring-primary h-9 md:h-10"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="publisher" className="text-sm font-medium text-gray-700">প্রকাশনী</Label>
                    <Select value={publisher} onValueChange={setPublisher}>
                      <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary h-9 md:h-10">
                        <SelectValue placeholder="প্রকাশনী নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="টেকনিক্যাল প্রকাশনী">টেকনিক্যাল প্রকাশনী</SelectItem>
                        <SelectItem value="হক প্রকাশনী">হক প্রকাশনী</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">বই সমূহ *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="বই সম্পর্কে বিস্তারিত লিখুন"
                    rows={3}
                    className="border-gray-300 focus:border-primary focus:ring-primary md:rows-4"
                    required
                  />
                </div>
              </div>

              {/* Pricing & Condition Section */}
              <div className="space-y-3 md:space-y-6">
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">মূল্য (টাকা) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      min="1"
                      className="border-gray-300 focus:border-primary focus:ring-primary h-9 md:h-10"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="condition" className="text-sm font-medium text-gray-700">অবস্থা *</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary h-9 md:h-10">
                        <SelectValue placeholder="অবস্থা নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">নতুন</SelectItem>
                        <SelectItem value="like_new">প্রায় নতুন</SelectItem>
                        <SelectItem value="good">ভালো</SelectItem>
                        <SelectItem value="acceptable">গ্রহণযোগ্য</SelectItem>
                        <SelectItem value="poor">খারাপ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5 col-span-2 md:col-span-1">
                    <Label htmlFor="discount" className="text-sm font-medium text-gray-700">ছাড়ের হার (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(e.target.value)}
                      placeholder="0-100"
                      min="0"
                      max="100"
                      className="border-gray-300 focus:border-primary focus:ring-primary h-9 md:h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information Section */}
              <div className="space-y-3 md:space-y-6">
                
                <div className="grid grid-cols-1 gap-3 md:gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="semester" className="text-sm font-medium text-gray-700">সেমিস্টার</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary h-9 md:h-10">
                        <SelectValue placeholder="সেমিস্টার নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="১য় সেমিস্টার">১য় সেমিস্টার</SelectItem>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="department" className="text-sm font-medium text-gray-700">বিভাগ</Label>
                      <Input
                        id="department"
                        type="text"
                        value={department}
                        readOnly
                        disabled
                        className="bg-gray-100 cursor-not-allowed border-gray-300 h-9 md:h-10"
                        placeholder="আপনার প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে পূরণ হবে"
                      />
                      <p className="text-xs text-gray-500 hidden md:block">এটি আপনার প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে নেওয়া হয়েছে</p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="institute" className="text-sm font-medium text-gray-700">প্রতিষ্ঠানের নাম</Label>
                      <Input
                        id="institute"
                        type="text"
                        value={instituteName}
                        readOnly
                        disabled
                        className="bg-gray-100 cursor-not-allowed border-gray-300 h-9 md:h-10"
                        placeholder="আপনার প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে পূরণ হবে"
                      />
                      <p className="text-xs text-gray-500 hidden md:block">এটি আপনার প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে নেওয়া হয়েছে</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images Section - Collapsible on Mobile */}
              <div className="space-y-3 md:space-y-6">
                
                {/* Cover Image Upload - Compact */}
                <div className="space-y-2 md:space-y-4">
                  <Label className="text-sm font-medium text-gray-700">কভার ইমেজ</Label>
                  <div className="space-y-2 md:space-y-4">
                    {/* File Upload - Smaller on mobile */}
                    <div>
                      <Label htmlFor="coverImageFile" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 md:p-6 text-center hover:border-primary transition-colors">
                          <ImageIcon className="h-8 w-8 md:h-12 md:w-12 mx-auto text-gray-400 mb-1 md:mb-2" />
                          <p className="text-xs md:text-sm text-gray-600 mb-1">ছবি আপলোড করুন</p>
                          <p className="text-xs text-gray-500 hidden md:block">JPG, PNG, WEBP (সর্বোচ্চ ১০MB)</p>
                        </div>
                      </Label>
                      <Input
                        id="coverImageFile"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageChange}
                        className="hidden"
                      />
                    </div>
                    
                    {/* Show selected file - Compact */}
                    {coverImageFile && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <ImageIcon className="h-4 w-4 text-green-600" />
                        <span className="text-xs md:text-sm text-green-700 flex-1 truncate">{coverImageFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCoverImageFile(null)}
                          className="h-6 w-6 p-0 md:h-8 md:w-8"
                        >
                          <X className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional Images Upload - More Compact */}
                <div className="space-y-2 md:space-y-4">
                  <Label className="text-sm font-medium text-gray-700">অতিরিক্ত ছবি (ঐচ্ছিক)</Label>
                  <div className="space-y-2 md:space-y-4">
                    {/* File Upload - Smaller */}
                    <div>
                      <Label htmlFor="additionalImagesFile" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 md:p-4 text-center hover:border-primary transition-colors">
                          <Upload className="h-6 w-6 md:h-8 md:w-8 mx-auto text-gray-400 mb-1 md:mb-2" />
                          <p className="text-xs md:text-sm text-gray-600">একাধিক ছবি নির্বাচন করুন</p>
                          <p className="text-xs text-gray-500 hidden md:block">JPG, PNG, WEBP (প্রতিটি সর্বোচ্চ ১০MB)</p>
                        </div>
                      </Label>
                      <Input
                        id="additionalImagesFile"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAdditionalImagesChange}
                        className="hidden"
                      />
                    </div>
                    
                    {/* Show selected files - Compact */}
                    {additionalImageFiles.length > 0 && (
                      <div className="space-y-1 md:space-y-2">
                        <p className="text-xs md:text-sm font-medium text-gray-700">নির্বাচিত ছবি:</p>
                        {additionalImageFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-1.5 md:p-2 bg-blue-50 rounded-lg">
                            <ImageIcon className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                            <span className="text-xs md:text-sm text-blue-700 flex-1 truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAdditionalImage(index)}
                              className="h-5 w-5 p-0 md:h-6 md:w-6"
                            >
                              <X className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button - Mobile Optimized */}
              <div className="flex justify-center pt-4 md:pt-8 border-t border-gray-200">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isUploadingImages}
                  className="w-full md:w-auto px-6 md:px-8 py-2.5 md:py-3 text-base md:text-lg bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isUploadingImages ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">ছবি আপলোড হচ্ছে...</span>
                      <span className="sm:hidden">আপলোড হচ্ছে...</span>
                    </>
                  ) : isSubmitting ? (
                    <>
                      <span className="hidden sm:inline">যোগ করা হচ্ছে...</span>
                      <span className="sm:hidden">যোগ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">বই যোগ করুন</span>
                      <span className="sm:hidden">যোগ করুন</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default SellBookPage;


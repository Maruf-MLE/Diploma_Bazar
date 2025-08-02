import React, { useState, useEffect } from 'react';
import { Upload, Check, AlertCircle, Loader2, FileCheck, X, BookOpen, Camera, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, getUserVerificationStatus } from '@/lib/supabase';
import Navigation from '@/components/Navigation';

const VerificationStepTwo = () => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ভেরিফিকেশন স্ট্যাটাস চেক করি এবং যদি ইউজার ভেরিফাইড হয় তাহলে অ্যাপ্রুভড পেজে রিডাইরেক্ট করি
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user) return;
      
      try {
        // ভেরিফিকেশন স্ট্যাটাস চেক করি
        const { isVerified, error } = await getUserVerificationStatus(user.id);
        
        if (error) {
          console.error('Error checking verification status:', error);
          return;
        }
        
        // যদি ইউজার ভেরিফাইড হয়, তাহলে ভেরিফিকেশন অ্যাপ্রুভড পেজে রিডাইরেক্ট করি
        if (isVerified) {
          // ভেরিফিকেশন আইডি নেওয়ার জন্য ডাটাবেস থেকে ডেটা নেই
          const { data, error: fetchError } = await supabase
            .from('verification_data')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (!fetchError && data?.id) {
            navigate(`/verification/approved/${data.id}`);
          } else {
            // যদি ভেরিফিকেশন আইডি না পাওয়া যায়, তাহলে প্রোফাইল পেজে রিডাইরেক্ট করি
            toast({
              title: "আপনি ইতিমধ্যে ভেরিফাইড",
              description: "আপনার অ্যাকাউন্ট ইতিমধ্যে ভেরিফাইড করা হয়েছে।",
            });
            navigate('/profile');
          }
        }
      } catch (error) {
        console.error('Error in verification status check:', error);
      }
    };
    
    checkVerificationStatus();
  }, [user, navigate, toast]);

  // ইউজারের ডেটা চেক করি
  useEffect(() => {
    if (user) {
      checkExistingData();
      checkFirstStepCompleted();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // প্রথম ধাপ সম্পন্ন হয়েছে কিনা চেক করি
  const checkFirstStepCompleted = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('verification_data')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking first step verification:', error);
        
        // প্রথম ধাপ সম্পন্ন না হলে রিডাইরেক্ট করি
        if (error.code === 'PGRST116') {
          toast({
            title: "প্রথম ধাপ সম্পন্ন করুন",
            description: "ভেরিফিকেশনের দ্বিতীয় ধাপে যাওয়ার আগে প্রথম ধাপ সম্পন্ন করুন।",
            variant: "destructive",
          });
          navigate('/verification');
          return;
        }
      }
      
      if (!data) {
        toast({
          title: "প্রথম ধাপ সম্পন্ন করুন",
          description: "ভেরিফিকেশনের দ্বিতীয় ধাপে যাওয়ার আগে প্রথম ধাপ সম্পন্ন করুন।",
          variant: "destructive",
        });
        navigate('/verification');
      }
    } catch (error) {
      console.error('Error checking first step verification:', error);
    }
  };

  // আগে থেকে ফেইস ভেরিফিকেশন ডেটা আছে কিনা চেক করি
  const checkExistingData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('face_verification')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing face verification data:', error);
        return;
      }

      if (data) {
        setHasExistingData(true);
        
        if (data.photo_url) {
          setPhotoPreview(data.photo_url);
        }
        
        if (data.is_verified) {
          setVerificationSuccess(true);
        }
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ফাইল আপলোড হ্যান্ডলার
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    
    if (!file) return;
    
    // ফাইল টাইপ চেক করি
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast({
        title: "অবৈধ ফাইল টাইপ",
        description: "দয়া করে শুধুমাত্র JPG, JPEG বা PNG ফরম্যাটের ছবি আপলোড করুন।",
        variant: "destructive",
      });
      return;
    }
    
    // ফাইল সাইজ চেক করি (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ফাইল সাইজ খুব বড়",
        description: "দয়া করে 5MB এর কম সাইজের ছবি আপলোড করুন।",
        variant: "destructive",
      });
      return;
    }
    
    // ফাইল এবং প্রিভিউ সেট করি
    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  // ফাইল রিমুভ হ্যান্ডলার
  const removeFile = () => {
    setPhotoFile(null);
    if (photoPreview && !photoPreview.startsWith('http')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
  };

  // ডেটা সাবমিট করার ফাংশন
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "লগইন প্রয়োজন",
        description: "আপনাকে প্রথমে লগইন করতে হবে।",
        variant: "destructive",
      });
      return;
    }
    
    // ছবি আপলোড করা আবশ্যক
    if (!photoFile && !photoPreview) {
      toast({
        title: "ছবি আপলোড করুন",
        description: "দয়া করে নির্দেশনা অনুযায়ী একটি ছবি আপলোড করুন।",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    try {
      let photoUrl = photoPreview;
      
      // যদি নতুন ফাইল আপলোড করা হয়
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-face-photo-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('verification_photos')
          .upload(fileName, photoFile);
          
        if (uploadError) {
          throw new Error(`ছবি আপলোড করতে সমস্যা: ${uploadError.message}`);
        }
        
        // পাবলিক URL পাই
        const { data: publicData } = supabase.storage
          .from('verification_photos')
          .getPublicUrl(fileName);
          
        photoUrl = publicData.publicUrl;
      }
      
      // আগে থেকে ডেটা আছে কিনা চেক করি
      if (hasExistingData) {
        // ডেটা আপডেট করি
        const { error: updateError } = await supabase
          .from('face_verification')
          .update({
            photo_url: photoUrl,
            status: 'pending', // এডমিন রিভিউ এর জন্য পেন্ডিং
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
          
        if (updateError) throw updateError;
      } else {
        // নতুন ডেটা তৈরি করি
        const { error: insertError } = await supabase
          .from('face_verification')
          .insert({
            user_id: user.id,
            photo_url: photoUrl,
            status: 'pending', // এডমিন রিভিউ এর জন্য পেন্ডিং
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      }
      
      // সাফল্য মেসেজ দেখাই
      toast({
        title: "ভেরিফিকেশন সাবমিট হয়েছে",
        description: "আপনার ফটো সফলভাবে সাবমিট করা হয়েছে। অনুমোদনের জন্য অপেক্ষা করুন।",
        variant: "default",
      });
      
      // ভেরিফিকেশন সাকসেস স্টেট আপডেট করি
      setVerificationSuccess(true);
      
    } catch (error: any) {
      console.error('Error submitting verification photo:', error);
      toast({
        title: "সাবমিট করতে সমস্যা",
        description: error.message || "ছবি সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  // লোডিং স্পিনার দেখাই
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-3xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        {/* ভেরিফিকেশন ধাপ */}
        <div className="mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              দ্বিতীয় ধাপ: ফেইস ভেরিফিকেশন
            </h2>
            <p className="text-blue-700 mt-1">
              আপনার এডমিট কার্ড/আইডি কার্ড হাতে নিয়ে একটি ছবি আপলোড করুন
            </p>
          </div>
        </div>
        
        {verificationSuccess ? (
          <div className="text-center">
            <div className="bg-green-50 p-8 rounded-lg border border-green-200 mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">ভেরিফিকেশনের দ্বিতীয় ধাপ সম্পূর্ণ হয়েছে</h2>
              <p className="text-green-700 mb-6">
                আপনার ফটো সফলভাবে সাবমিট করা হয়েছে। অনুমোদনের জন্য অপেক্ষা করুন।
              </p>
              <Button 
                className="flex items-center gap-2"
                onClick={() => navigate('/')}
              >
                হোম পেইজে যান
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            {photoPreview && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-700 mb-3">আপলোড করা ছবি</h3>
                <div className="border border-gray-200 rounded-lg p-2 bg-white">
                  <img 
                    src={photoPreview} 
                    alt="User Photo" 
                    className="w-full max-h-96 object-contain rounded"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ফেইস ভেরিফিকেশন</h1>
              <p className="text-lg text-gray-600">
                নিজের এডমিট কার্ড/আইডি কার্ড হাতে নিয়ে একটি ছবি আপলোড করুন
              </p>
            </div>
            
            {/* ফোটো আপলোড কার্ড */}
            <Card className="shadow-sm border border-gray-200 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  ছবি আপলোড
                </CardTitle>
                <CardDescription>
                  অনুগ্রহ করে নিম্নলিখিত নির্দেশনা অনুসরণ করুন:
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* নির্দেশনাবলী */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h4 className="font-medium text-blue-800 mb-2">নির্দেশনাবলী:</h4>
                  <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
                    <li>আপনার এডমিট কার্ড/আইডি কার্ড হাতে নিয়ে সেলফি তুলুন</li>
                    <li>আপনার মুখ এবং এডমিট কার্ড/আইডি কার্ড দুটোই স্পষ্টভাবে দেখা যাবে</li>
                    <li>ভালো আলোর মধ্যে ছবি তুলুন যাতে সব কিছু পরিষ্কার দেখা যায়</li>
                    <li>মেয়েরা হিজাব পরে ছবি তুলতে পারেন</li>
                  </ul>
                </div>
                
                {photoPreview ? (
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Photo Preview" 
                      className="w-full h-64 object-contain rounded-md border border-gray-200 bg-white"
                    />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={removeFile}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => document.getElementById('photo-input')?.click()}
                  >
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      ছবি আপলোড করতে ক্লিক করুন বা ছবি টেনে আনুন
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG (সর্বোচ্চ 5MB)
                    </p>
                  </div>
                )}
                <Input
                  id="photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={uploading || !photoPreview}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      আপলোড হচ্ছে...
                    </>
                  ) : hasExistingData ? (
                    'ভেরিফিকেশন আপডেট করুন'
                  ) : (
                    'ভেরিফিকেশন সম্পূর্ণ করুন'
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="mt-8 bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h3 className="font-medium text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                গুরুত্বপূর্ণ তথ্য
              </h3>
              <p className="mt-2 text-sm text-amber-700">
                আপনার ফটো সাবমিট করার পর, এডমিনরা এটি পর্যালোচনা করবেন। অনুমোদনের পর আপনি সাইটের সকল সুবিধা ব্যবহার করতে পারবেন।
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerificationStepTwo; 
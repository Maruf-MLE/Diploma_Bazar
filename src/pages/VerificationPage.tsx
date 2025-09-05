import React, { useState, useEffect } from 'react';
import { Upload, Check, AlertCircle, Loader2, FileCheck, X, BookOpen, School, User, ArrowRight, CheckCircle2, AlertTriangle, GraduationCap, Play } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const VerificationPage = () => {
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // ওয়ার্নিং ডায়ালগ স্টেট
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // ভিডিও গাইড ডায়ালগ স্টেট
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  // ম্যানুয়াল ইনপুট ডেটা
  const [formData, setFormData] = useState<{
    rollNo: string;
    regNo: string;
    department: string;
    instituteName: string;
  }>({
    rollNo: '',
    regNo: 'অজানা',
    department: '',
    instituteName: ''
  });

  // ইউজারের ডেটা লোডিং স্টেট
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [profileData, setProfileData] = useState<{
    roll_number: string;
    name: string;
    department: string;
    institute_name: string;
  } | null>(null);

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
          // ভেরিফিকেশন আইডি নেওয়ার জন্য ডাটাবেস থেকে ডাটা নেই
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

  // ব্যবহারকারীর ডেটা চেক করি
  useEffect(() => {
    if (user) {
      loadUserProfileAndVerificationData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // ইউজারের প্রোফাইল এবং ভেরিফিকেশন ডেটা লোড করি
  const loadUserProfileAndVerificationData = async () => {
    try {
      setIsLoading(true);

      // প্রোফাইল ডেটা লোড করি
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('roll_number, name, department, institute_name')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        console.error('Error loading profile data:', profileError);
        toast({
          title: "প্রোফাইল লোড করতে সমস্যা",
          description: "আপনার প্রোফাইল তথ্য লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
          variant: "destructive",
        });
        return;
      }

      if (profile) {
        setProfileData(profile);

        // প্রোফাইল থেকে তথ্য দিয়ে form ডেটা সেট করি
        setFormData(prev => ({
          ...prev,
          rollNo: profile.roll_number || '',
          department: profile.department || '',
          instituteName: profile.institute_name || ''
        }));
      }

      // ভেরিফিকেশন ডেটা লোড করি
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_data')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (verificationError && verificationError.code !== 'PGRST116') {
        console.error('Error checking existing verification data:', verificationError);
        return;
      }

      if (verificationData) {
        setHasExistingData(true);
        setFormData({
          rollNo: profile?.roll_number || verificationData.roll_no || '',
          regNo: verificationData.reg_no || 'অজানা',
          department: profile?.department || verificationData.department || '',
          instituteName: profile?.institute_name || verificationData.institute_name || ''
        });

        if (verificationData.document_url) {
          setDocumentPreview(verificationData.document_url);
        }

        // যদি ইউজারের আগে থেকে ভেরিফিকেশন ডেটা থাকে তাহলে সাকসেস স্টেট true করি
        setVerificationSuccess(true);
      } else if (profile) {
        // যদি ভেরিফিকেশন ডেটা না থাকে কিন্তু প্রোফাইল আছে, প্রোফাইল থেকে সব তথ্য সেট করি
        setFormData({
          rollNo: profile.roll_number || '',
          regNo: 'অজানা',
          department: profile.department || '',
          instituteName: profile.institute_name || ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "ডেটা লোড করতে সমস্যা",
        description: "আপনার তথ্য লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
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

    // ফাইল সাইজ চেক করি (15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "ফাইল সাইজ খুব বড়",
        description: "দয়া করে 15MB এর কম সাইজের ছবি আপলোড করুন।",
        variant: "destructive",
      });
      return;
    }

    // ফাইল এবং প্রিভিউ সেট করি
    setDocumentFile(file);
    const previewUrl = URL.createObjectURL(file);
    setDocumentPreview(previewUrl);
  };

  // ফাইল রিমুভ হ্যান্ডলার
  const removeFile = () => {
    setDocumentFile(null);
    if (documentPreview && !documentPreview.startsWith('http')) {
      URL.revokeObjectURL(documentPreview);
    }
    setDocumentPreview(null);
    // প্রোফাইল থেকে সব তথ্য রেখে দিই, শুধু রেজিস্ট্রেশন নম্বর রিসেট করি
    setFormData(prev => ({
      rollNo: profileData?.roll_number || prev.rollNo,
      regNo: 'অজানা',
      department: profileData?.department || prev.department,
      instituteName: profileData?.institute_name || prev.instituteName
    }));
  };

  // ওয়ার্নিং ডায়ালগ দেখানোর ফাংশন
  const showWarningDialog = (message: string) => {
    setWarningMessage(message);
    setWarningDialogOpen(true);
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

    // কমপক্ষে একটি ছবি আপলোড করা আবশ্যক
    if (!documentFile && !documentPreview) {
      toast({
        title: "ছবি আপলোড করুন",
        description: "দয়া করে একটি ছবি আপলোড করুন।",
        variant: "destructive",
      });
      return;
    }

    // রোল নম্বর চেক করি (প্রোফাইল থেকে আসা উচিত)
    if (!formData.rollNo.trim()) {
      toast({
        title: "রোল নম্বর পাওয়া যায়নি",
        description: "আপনার প্রোফাইলে রোল নম্বর নেই। দয়া করে প্রথমে প্রোফাইল আপডেট করুন।",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // চেক করি যে roll_no দিয়ে আগে কেউ ভেরিফিকেশন করেছে কিনা
      const { data: existingVerification, error: verificationCheckError } = await supabase
        .from('verification_data')
        .select('*')
        .eq('roll_no', formData.rollNo.trim())
        .neq('user_id', user.id);

      if (verificationCheckError) {
        console.error('Error checking existing verification:', verificationCheckError);
        throw new Error('ভেরিফিকেশন ডেটা চেক করতে সমস্যা হয়েছে।');
      }

      // যদি আগে থেকে একই রোল ও রেজিস্ট্রেশন নম্বর দিয়ে কেউ ভেরিফিকেশন করে থাকে
      if (existingVerification && existingVerification.length > 0) {
        // ডায়ালগ দেখাই
        showWarningDialog("এই এডমিট কার্ড দিয়ে এডমিট কার্ডের মালিক তার আইডি ভেরিফিকেশন করে ফেলেছে। দয়া করে আপনি আপনার নিজস্ব সঠিক এডমিট কার্ড দিয়ে ভেরিফিকেশন করুন।");
        setUploading(false);
        return;
      }

      let documentUrl = documentPreview;

      // যদি নতুন ফাইল আপলোড করা হয়
      if (documentFile) {
        const fileExt = documentFile.name.split('.').pop();
        const fileName = `${user.id}-document-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('verification_documents')
          .upload(fileName, documentFile);

        if (uploadError) {
          throw new Error(`ডকুমেন্ট আপলোড করতে সমস্যা: ${uploadError.message}`);
        }

        // পাবলিক URL পাই
        const { data: publicData } = supabase.storage
          .from('verification_documents')
          .getPublicUrl(fileName);

        documentUrl = publicData.publicUrl;
      }

      // আগে থেকে ডেটা আছে কিনা চেক করি
      if (hasExistingData) {
        // ডেটা আপডেট করি
        const { error: updateError } = await supabase
          .from('verification_data')
          .update({
            roll_no: formData.rollNo.trim(),
            reg_no: formData.regNo.trim(),
            department: formData.department.trim(),
            institute_name: formData.instituteName.trim(),
            document_url: documentUrl,
            is_verified: false, // অ্যাডমিন পরে ভেরিফাইড করবে
            status: 'pending', // পেন্ডিং স্ট্যাটাস সেট করি
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // নতুন ডেটা তৈরি করি
        const { error: insertError } = await supabase
          .from('verification_data')
          .insert({
            user_id: user.id,
            roll_no: formData.rollNo.trim(),
            reg_no: formData.regNo.trim(),
            department: formData.department.trim(),
            institute_name: formData.instituteName.trim(),
            document_url: documentUrl,
            is_verified: false, // অ্যাডমিন পরে ভেরিফাইড করবে
            status: 'pending', // পেন্ডিং স্ট্যাটাস সেট করি
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // সাফল্য মেসেজ দেখাই
      toast({
        title: "ভেরিফিকেশন রিকুয়েস্ট সফল",
        description: "আপনার তথ্য সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাই করে ভেরিফিকেশন অনুমোদন করবে।",
        variant: "default",
      });

      // হ্যাজএক্সিস্টিংডেটা আপডেট করি
      setHasExistingData(true);

      // ভেরিফিকেশন সাকসেস স্টেট আপডেট করি
      setVerificationSuccess(true);

      // ভেরিফিকেশন পেজে রিডাইরেক্ট করি (পেজ রিফ্রেশ করার জন্য)
      window.location.reload();

    } catch (error: any) {
      console.error('Error submitting verification data:', error);

      // ইউনিক কন্সট্রেইন্ট ভায়োলেশন চেক করি
      if (error.message && (
        error.message.includes('unique constraint') ||
        error.message.includes('duplicate key value') ||
        error.message.includes('verification_data_roll_no_key')
      )) {
        // ডায়ালগ দেখাই
        showWarningDialog("এই এডমিট কার্ড দিয়ে এডমিট কার্ডের মালিক তার আইডি ভেরিফিকেশন করে ফেলেছে। দয়া করে আপনি আপনার নিজস্ব সঠিক এডমিট কার্ড দিয়ে ভেরিফিকেশন করুন।");
      } else {
        toast({
          title: "সাবমিট করতে সমস্যা",
          description: error.message || "ভেরিফিকেশন ডেটা সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
          variant: "destructive",
        });
      }
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

      {/* ওয়ার্নিং ডায়ালগ */}
      <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
        <DialogContent className="sm:max-w-md border-red-300 shadow-lg animate-in fade-in-90 slide-in-from-bottom-10">
          <DialogHeader className="bg-red-50 py-4 rounded-t-lg border-b border-red-200">
            <div className="flex flex-col items-center justify-center">
              <div className="bg-red-100 p-3 rounded-full mb-2">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-red-700">
                ভেরিফিকেশন সম্ভব নয়
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="bg-white p-6">
            <DialogDescription className="text-lg font-medium text-center text-gray-800 leading-relaxed">
              {warningMessage}
            </DialogDescription>

            <div className="flex items-center justify-center mt-4 bg-red-50 p-3 rounded-lg border border-red-100">
              <div className="flex items-center text-sm text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>অন্য কেউ ইতিমধ্যে এই তথ্য ব্যবহার করেছেন</span>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 p-4 rounded-b-lg border-t border-gray-200 space-y-2">
            <Button
              variant="default"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2"
              onClick={() => setWarningDialogOpen(false)}
            >
              বুঝেছি
            </Button>
            <p className="text-xs text-center text-gray-500">
              সমস্যা থাকলে{" "}
              <a href="https://www.facebook.com/diplomabazar/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                সাহায্য নিন
              </a>
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-3xl mx-auto pt-14 px-4 sm:px-6 lg:px-8 pb-16">
        {/* ভেরিফিকেশন ধাপ */}
        <div className="mb-8">

        </div>

        {verificationSuccess ? (
          <div className="text-center">
            <div className="bg-green-50 p-8 rounded-lg border border-green-200 mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">ভেরিফিকেশন রিকুয়েস্ট সফল</h2>
              <p className="text-green-700 mb-6">
                আপনার তথ্য সফলভাবে সংরক্ষণ করা হয়েছে। অ্যাডমিন আপনার তথ্য যাচাই করে <span className="font-bold text-green-800">(সর্বোচ্চ ১২ ঘণ্টার মধ্যে)</span> অনুমোদন দেওয়ার পর আপনার অ্যাকাউন্ট ভেরিফাইড হবে।
                <p> </p>
                <p>অনুগ্রহ করে একটু অপেক্ষা করুন 😊</p>

              </p>
              <Button
                className="flex items-center gap-2"
                onClick={() => navigate('/')}
              >
                হোম পেইজে যান
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">রোল নম্বর</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{formData.rollNo}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">বিভাগ</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{formData.department}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">প্রতিষ্ঠান</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{formData.instituteName}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">আইডি ভেরিফিকেশন</h1>
              <p className="text-lg text-gray-600 mb-6">
                আপনার পরিচয় যাচাইয়ের জন্য স্টুডেন্ট আইডি, এডমিট কার্ড বা ভর্তি কনফার্মেশনের স্ক্রিনশট আপলোড করুন। এডমিন তা দেখে অনুমোদন দিলে সাইটের সব সুবিধা ব্যবহার করতে পারবেন।
              </p>

              {/* ভিডিও গাইড বাটন */}
              <Button
                type="button"
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-sm font-medium px-6 py-2.5 rounded-full shadow-md"
                onClick={() => setIsVideoDialogOpen(true)}
              >
                <Play className="h-4 w-4 mr-2" />
                কিভাবে ভেরিফিকেশন করবেন দেখুন ভিডিও
              </Button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* ম্যানুয়াল ইনপুট ফিল্ডস */}
              <div className="hidden">
                <div className="mb-8">
                  <Card className="shadow-sm border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        ভেরিফিকেশন তথ্য
                      </CardTitle>
                      <CardDescription>
                        আপনার তথ্যসমূহ (প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে পূরণ হবে)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="roll-no" className="text-sm font-medium">রোল নম্বর * (প্রোফাইল থেকে)</Label>
                            <Input
                              id="roll-no"
                              type="text"
                              value={formData.rollNo}
                              readOnly
                              className="h-10 bg-gray-100 cursor-not-allowed"
                              placeholder="প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে পূর্ণ হবে"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reg-no" className="text-sm font-medium">রেজিস্ট্রেশন নম্বর</Label>
                            <Input
                              id="reg-no"
                              type="text"
                              value={formData.regNo}
                              onChange={(e) => setFormData(prev => ({ ...prev, regNo: e.target.value }))}
                              placeholder="রেজিস্ট্রেশন নম্বর (অপশনাল)"
                              className="h-10"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="department" className="text-sm font-medium">বিভাগ * (প্রোফাইল থেকে)</Label>
                            <Input
                              id="department"
                              type="text"
                              value={formData.department}
                              readOnly
                              className="h-10 bg-gray-100 cursor-not-allowed"
                              placeholder="প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে পূর্ণ হবে"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="institute-name" className="text-sm font-medium">প্রতিষ্ঠানের নাম * (প্রোফাইল থেকে)</Label>
                            <Input
                              id="institute-name"
                              type="text"
                              value={formData.instituteName}
                              readOnly
                              className="h-10 bg-gray-100 cursor-not-allowed"
                              placeholder="প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে পূর্ণ হবে"
                            />
                          </div>
                        </div>

                        {profileData && (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <p className="text-xs text-green-700 flex items-center gap-2">
                              <Check className="h-4 w-4" />
                              প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে পূর্ণ: <span className="font-medium">{profileData.name}</span>
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-xs text-gray-600">
                        * রোল নম্বর, বিভাগ এবং প্রতিষ্ঠানের নাম আপনার প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে এনে দেওয়া হয়েছে। রেজিস্ট্রেশন নম্বর না থাকলে "অজানা" লিখে রাখুন।
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ডকুমেন্ট আপলোড কার্ড */}
              <Card className="shadow-sm border border-gray-200 mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5 text-primary" />
                    স্টুডেন্ট আইডি কার্ড / এডমিট কার্ড / ভর্তি নিশ্চিতকরণ পৃষ্ঠা
                  </CardTitle>
                  <CardDescription>
                    আপনার স্টুডেন্ট আইডি কার্ড, এডমিট কার্ড  অথবা প্রথম বর্ষের ছাত্র/ছাত্রীদের জন্য ভর্তি নিশ্চিতকরণ পৃষ্ঠার স্ক্রিনশট আপলোড করুন
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documentPreview ? (
                    <div className="relative">
                      <img
                        src={documentPreview}
                        alt="Document Preview"
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
                      onClick={() => document.getElementById('document-input')?.click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        ছবি আপলোড করতে ক্লিক করুন বা ছবি টেনে আনুন
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG (সর্বোচ্চ 15MB)
                      </p>
                    </div>
                  )}
                  <Input
                    id="document-input"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </CardContent>
              </Card>

              <div className="text-center">
                <Button
                  type="submit"
                  className="min-w-[200px]"
                  disabled={uploading || !documentPreview}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      আপলোড হচ্ছে...
                    </>
                  ) : hasExistingData ? (
                    'আপডেট করুন'
                  ) : (
                    'ভেরিফিকেশনের জন্য সাবমিট করুন'
                  )}
                </Button>
              </div>

              <div className="mt-8 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  ভেরিফিকেশন সম্পর্কে জানতে
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  ভেরিফিকেশন করলে আপনার অ্যাকাউন্ট নিশ্চিত হবে এবং আপনি সাইটের সকল সুবিধা ব্যবহার করতে পারবেন।
                </p>
              </div>

              {/* Accepted Documents Info */}
              <div className="mt-4 bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-800 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  গ্রহণযোগ্য ডকুমেন্ট
                </h3>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-indigo-700">
                    <Check className="h-4 w-4 mt-1 text-indigo-600 flex-shrink-0" />
                    <span>এডমিট কার্ড - পরীক্ষার এডমিট কার্ডে আপনার রোল নম্বর ও রেজিস্ট্রেশন নম্বর থাকতে হবে</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-indigo-700">
                    <Check className="h-4 w-4 mt-1 text-indigo-600 flex-shrink-0" />
                    <span>কলেজ বা বিশ্ববিদ্যালয় আইডি কার্ড - যেখানে আপনার রোল এবং রেজিস্ট্রেশন নম্বর থাকে</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-indigo-700">
                    <Check className="h-4 w-4 mt-1 text-indigo-600 flex-shrink-0" />
                    <span>প্রথম বর্ষের ছাত্র/ছাত্রীদের জন্য - ভর্তি নিশ্চিতকরণ পৃষ্ঠার স্ক্রিনশট (Admission Confirmation Page) যেখানে আপনার রোল, রেজিস্ট্রেশন নম্বর উল্লেখ থাকে</span>
                  </li>
                </ul>
              </div>
            </form>
          </>
        )}
      </div>

      {/* ভিডিও গাইড ডায়ালগ */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-3xl w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800">কিভাবে অ্যাকাউন্ট খুলবেন - ভিডিও গাইড</DialogTitle>
          </DialogHeader>
          <div className="relative pb-[56.25%] h-0 mt-4 rounded-lg overflow-hidden shadow-xl border border-slate-200">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/b2B09bzM9GE?si=FkX8sFhGf4pA63HH"
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

export default VerificationPage;

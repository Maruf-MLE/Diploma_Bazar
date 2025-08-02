import React, { useState, useEffect } from 'react';
import { Upload, Check, AlertCircle, Loader2, FileCheck, X, BookOpen, School, User, ScanLine, ArrowRight, CheckCircle2, AlertTriangle, GraduationCap } from 'lucide-react';
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
import { createWorker } from 'tesseract.js';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  // ওয়ার্নিং ডায়ালগ স্টেট
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  // সনাক্তকৃত তথ্য
  const [extractedData, setExtractedData] = useState<{
    name: string;
    rollNo: string;
    regNo: string;
  }>({
    name: '',
    rollNo: '',
    regNo: ''
  });
  
  // ইউজারের ডেটা লোডিং স্টেট
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
      checkExistingData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // আগে থেকে ডেটা আছে কিনা চেক করি
  const checkExistingData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('verification_data')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing data:', error);
        return;
      }

      if (data) {
        setHasExistingData(true);
        setExtractedData({
          name: '',
          rollNo: data.roll_no || '',
          regNo: data.reg_no || ''
        });
        
        if (data.document_url) {
          setDocumentPreview(data.document_url);
        }
        
        // যদি ইউজারের আগে থেকে ভেরিফিকেশন ডেটা থাকে তাহলে সাকসেস স্টেট true করি
        setVerificationSuccess(true);
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // OCR দিয়ে ছবি থেকে টেক্সট সনাক্ত করার ফাংশন
  const extractTextFromImage = async (imageUrl: string) => {
    try {
      setIsProcessing(true);

      // টেসারেক্ট ওয়ার্কার তৈরি করি
      const worker = await createWorker('ben+eng');
      
      // OCR অপশন সেট করি - উচ্চ গুণমান এবং ডকুমেন্ট মোড
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;[]()/ ',
        preserve_interword_spaces: '1',
      });
      
      // ছবি থেকে টেক্সট সনাক্ত করি
      const { data: { text } } = await worker.recognize(imageUrl);
      
      // টেক্সট সেট করি
      setExtractedText(text);
      
      // টেক্সট থেকে প্রয়োজনীয় তথ্য বের করি
      extractRequiredData(text);
      
      // ওয়ার্কার বন্ধ করি
      await worker.terminate();
      
      // সাফল্য মেসেজ দেখাই
      toast({
        title: "টেক্সট সনাক্ত করা হয়েছে",
        description: "ছবি থেকে টেক্সট সনাক্ত করা হয়েছে।",
      });
    } catch (error) {
      console.error('Error extracting text from image:', error);
      toast({
        title: "টেক্সট সনাক্ত করতে সমস্যা",
        description: "ছবি থেকে টেক্সট সনাক্ত করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // টেক্সট থেকে শুধু প্রয়োজনীয় তথ্য (রোল, রেজিস্ট্রেশন) বের করার ফাংশন
  const extractRequiredData = (text: string) => {
    console.log("Extracted raw text:", text);
    
    // রোল নম্বর খুঁজি - "Roll No : 818315" এই ফরম্যাটে
    const rollMatch = text.match(/Roll No\s*[:]\s*([0-9]+)/i) ||
                     text.match(/Roll\s*[:]\s*([0-9]+)/i);
    
    // রেজিস্ট্রেশন নম্বর খুঁজি - "Reg. No: [1502322924]" এই ফরম্যাটে
    const regMatch = text.match(/Reg\.\s*No\s*[:]\s*\[?([0-9]+)\]?/i) ||
                    text.match(/Registration No\s*[:]\s*\[?([0-9]+)\]?/i) ||
                    text.match(/Reg No\s*[:]\s*\[?([0-9]+)\]?/i);
    
    console.log("Roll match:", rollMatch);
    console.log("Reg match:", regMatch);
    
    let rollNo = '';
    if (rollMatch && rollMatch[1]) {
      // শুধুমাত্র সংখ্যা নেই
      rollNo = rollMatch[1].replace(/[^0-9]/g, '');
    }
    
    let regNo = '';
    if (regMatch && regMatch[1]) {
      // শুধুমাত্র সংখ্যা নেই
      regNo = regMatch[1].replace(/[^0-9]/g, '');
    }
    
    // যদি রেগুলার এক্সপ্রেশন দিয়ে খুঁজে না পাই, তাহলে সরাসরি টেক্সট থেকে খুঁজি
    if (!rollNo) {
      // সাধারণ সংখ্যা প্যাটার্ন খুঁজি যা 6-9 ডিজিট লম্বা (রোল নম্বর)
      const rollPattern = /\b[0-9]{6,9}\b/g;
      const rollMatches = [...text.matchAll(rollPattern)];
      if (rollMatches.length > 0) {
        // প্রথম ম্যাচ নেই
        rollNo = rollMatches[0][0];
      }
    }
    
    if (!regNo) {
      // সাধারণ সংখ্যা প্যাটার্ন খুঁজি যা 10 বা তার বেশি ডিজিট লম্বা (রেজিস্ট্রেশন নম্বর)
      const regPattern = /\b[0-9]{10,}\b/g;
      const regMatches = [...text.matchAll(regPattern)];
      if (regMatches.length > 0) {
        // প্রথম ম্যাচ নেই
        regNo = regMatches[0][0];
      }
    }
    
    // সনাক্তকৃত তথ্য আপডেট করি
    setExtractedData({
      name: '', // নাম ডিটেক্ট না করার জন্য খালি রাখি
      rollNo: rollNo,
      regNo: regNo
    });
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
    setDocumentFile(file);
    const previewUrl = URL.createObjectURL(file);
    setDocumentPreview(previewUrl);
    
    // OCR প্রসেসিং শুরু করি
    extractTextFromImage(previewUrl);
  };

  // ফাইল রিমুভ হ্যান্ডলার
  const removeFile = () => {
    setDocumentFile(null);
    if (documentPreview && !documentPreview.startsWith('http')) {
      URL.revokeObjectURL(documentPreview);
    }
    setDocumentPreview(null);
    setExtractedText('');
    setExtractedData({
      name: '',
      rollNo: '',
      regNo: ''
    });
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
    
    // রোল নম্বর এবং রেজিস্ট্রেশন নম্বর চেক করি
    if (!extractedData.rollNo || !extractedData.regNo) {
      toast({
        title: "তথ্য অসম্পূর্ণ",
        description: "রোল নম্বর এবং রেজিস্ট্রেশন নম্বর সনাক্ত করা যায়নি। দয়া করে আবার চেষ্টা করুন।",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // চেক করি যে roll_no এবং reg_no কম্বিনেশন দিয়ে আগে কেউ ভেরিফিকেশন করেছে কিনা
      const { data: existingVerification, error: verificationCheckError } = await supabase
        .from('verification_data')
        .select('*')
        .eq('roll_no', extractedData.rollNo)
        .eq('reg_no', extractedData.regNo)
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
            roll_no: extractedData.rollNo,
            reg_no: extractedData.regNo,
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
            roll_no: extractedData.rollNo,
            reg_no: extractedData.regNo,
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
      
      // হোম পেজে রিডাইরেক্ট করি
      navigate('/');
      
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
          
          <DialogFooter className="bg-gray-50 p-4 rounded-b-lg border-t border-gray-200">
            <Button 
              variant="default"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2"
              onClick={() => setWarningDialogOpen(false)}
            >
              বুঝেছি
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="max-w-3xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        {/* ভেরিফিকেশন ধাপ */}
        <div className="mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              অ্যাকাউন্ট ভেরিফিকেশন
            </h2>
                          <p className="text-blue-700 mt-1">
              আপনার পরিচয় নিশ্চিত করার জন্য এডমিট কার্ড, স্টুডেন্ট আইডি বা প্রথম বর্ষের ভর্তি নিশ্চিতকরণ পৃষ্ঠার স্ক্রিনশট আপলোড করুন। অ্যাডমিন আপনার তথ্য যাচাই করে অনুমোদন দেওয়ার পর আপনি সাইটের সকল সুবিধা পাবেন।
            </p>
          </div>
        </div>
        
        {verificationSuccess ? (
          <div className="text-center">
            <div className="bg-green-50 p-8 rounded-lg border border-green-200 mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">ভেরিফিকেশন রিকুয়েস্ট সফল</h2>
              <p className="text-green-700 mb-6">
                আপনার তথ্য সফলভাবে সংরক্ষণ করা হয়েছে। অ্যাডমিন আপনার তথ্য যাচাই করে অনুমোদন দেওয়ার পর আপনার অ্যাকাউন্ট ভেরিফাইড হবে।
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
              <Card className="bg-gray-50 border border-gray-200 md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">রোল নম্বর</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{extractedData.rollNo}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-50 border border-gray-200 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">রেজিস্ট্রেশন নম্বর</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">{extractedData.regNo}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">আইডি ভেরিফিকেশন</h1>
              <p className="text-lg text-gray-600">
                অ্যাকাউন্ট ভেরিফিকেশন করার জন্য আপনার এডমিট কার্ড, স্টুডেন্ট আইডি কার্ড বা প্রথম বর্ষের ভর্তি নিশ্চিতকরণ পৃষ্ঠার স্ক্রিনশট আপলোড করুন
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* সনাক্তকৃত তথ্য প্রদর্শন */}
              {(extractedData.name || extractedData.rollNo || extractedData.regNo) && (
                <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 flex items-center gap-2 mb-3">
                    <ScanLine className="h-5 w-5" />
                    সনাক্তকৃত তথ্য
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="extracted-roll" className="text-sm text-green-800">Roll No</Label>
                      <Input
                        id="extracted-roll"
                        value={extractedData.rollNo}
                        readOnly
                        className="h-8 text-sm bg-green-50 border-green-200"
                        placeholder="Roll No"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="extracted-reg" className="text-sm text-green-800">Reg. No</Label>
                      <Input
                        id="extracted-reg"
                        value={extractedData.regNo}
                        readOnly
                        className="h-8 text-sm bg-green-50 border-green-200"
                        placeholder="Reg. No"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-green-700">
                    * সনাক্তকৃত তথ্য স্বয়ংক্রিয়ভাবে সংগ্রহ করা হয়েছে। ভেরিফিকেশন সাবমিট করার সময় এই তথ্যগুলো সংরক্ষণ করা হবে।
                  </p>
                </div>
              )}
              
              {/* ডকুমেন্ট আপলোড কার্ড */}
              <Card className="shadow-sm border border-gray-200 mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5 text-primary" />
                    এডমিট কার্ড / স্টুডেন্ট আইডি / ভর্তি নিশ্চিতকরণ পৃষ্ঠা
                  </CardTitle>
                  <CardDescription>
                    আপনার এডমিট কার্ড, স্টুডেন্ট আইডি কার্ড অথবা প্রথম বর্ষের ছাত্র/ছাত্রীদের জন্য ভর্তি নিশ্চিতকরণ পৃষ্ঠার স্ক্রিনশট আপলোড করুন
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
                        disabled={uploading || isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      {/* OCR বাটন */}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => documentPreview && extractTextFromImage(documentPreview)}
                        disabled={isProcessing || !documentPreview}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            প্রসেসিং...
                          </>
                        ) : (
                          <>
                            <ScanLine className="h-4 w-4 mr-2" />
                            টেক্সট সনাক্ত করুন
                          </>
                        )}
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
                        JPG, PNG (সর্বোচ্চ 5MB)
                      </p>
                    </div>
                  )}
                  <Input
                    id="document-input"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading || isProcessing}
                  />
                  
                  {/* সনাক্তকৃত টেক্সট - হাইড করা */}
                  {/* {extractedText && (
                    <div className="mt-4">
                      <Label htmlFor="extracted-text" className="text-sm text-gray-600 mb-1 block">
                        সনাক্তকৃত টেক্সট:
                      </Label>
                      <Textarea
                        id="extracted-text"
                        value={extractedText}
                        readOnly
                        className="text-xs h-24 bg-gray-50"
                      />
                    </div>
                  )} */}
                </CardContent>
              </Card>
              
              <div className="text-center">
                <Button 
                  type="submit" 
                  className="min-w-[200px]"
                  disabled={uploading || isProcessing || !documentPreview}
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
    </div>
  );
};

export default VerificationPage;
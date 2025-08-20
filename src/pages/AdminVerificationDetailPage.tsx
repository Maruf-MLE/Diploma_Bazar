import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckIcon, 
  XIcon, 
  ArrowLeft,
  Loader2,
  UserCheck,
  AlertCircle,
  Copy,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface VerificationData {
  id: string;
  user_id: string;
  email: string;
  name: string;
  roll_no: string;
  reg_no: string;
  department: string | null;
  institute_name: string | null;
  document_url: string;
  created_at: string;
  updated_at: string;
  photo_url: string | null;
  status: string | null;
  is_verified: boolean;
}

const AdminVerificationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [feedback, setFeedback] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // লোকেশন স্টেট থেকে ডেটা নেওয়ার চেষ্টা করি
  useEffect(() => {
    if (location.state?.verificationData) {
      setVerificationData(location.state.verificationData);
      setLoading(false);
    } else {
      // যদি স্টেট থেকে ডেটা না পাওয়া যায়, তাহলে API থেকে ডেটা লোড করি
      fetchVerificationData();
    }
  }, [location.state, id]);

  // API থেকে ভেরিফিকেশন ডেটা লোড করি
  const fetchVerificationData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // প্রথমে verification_data টেবিল থেকে ডেটা নেই
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_data')
        .select('*')
        .eq('user_id', id)
        .single();
      
      if (verificationError) {
        throw verificationError;
      }
      
      // face_verification টেবিল থেকে ডেটা নেই
      const { data: faceData, error: faceError } = await supabase
        .from('face_verification')
        .select('*')
        .eq('user_id', id)
        .single();
      
      // profiles টেবিল থেকে ডেটা নেই
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      // সব ডেটা একত্রিত করি
      const combinedData: VerificationData = {
        ...verificationData,
        photo_url: faceData?.photo_url || null,
        status: faceData?.status || null,
        name: profileData?.name || null,
        department: profileData?.department || verificationData?.department || null,
        institute_name: profileData?.institute_name || verificationData?.institute_name || null,
        email: null // ইমেইল ফিল্ড খালি রাখি
      };
      
      setVerificationData(combinedData);
    } catch (error) {
      console.error('Error fetching verification data:', error);
      toast({
        title: 'ডেটা লোড করতে সমস্যা',
        description: 'ভেরিফিকেশন ডেটা লোড করতে সমস্যা হয়েছে।',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // ভেরিফিকেশন অনুমোদন করি
  const approveVerification = async () => {
    if (!verificationData?.user_id) return;
    
    try {
      setProcessingAction(true);
      
      console.log('Approving verification for user_id:', verificationData.user_id);
      console.log('Verification data before update:', verificationData);
      
      // RPC ফাংশন ব্যবহার করে আপডেট করি - এটি RLS বাইপাস করবে
      const { data: rpcResult, error: rpcError } = await supabase.rpc('approve_verification', {
        verification_id: verificationData.id
      });
      
      if (rpcError) {
        console.error('Error calling approve_verification RPC:', rpcError);
        
        // RPC না থাকলে সরাসরি আপডেট চেষ্টা করি
        console.log('Trying direct update as fallback...');
        
        // সরাসরি ডাটাবেস আপডেট চেষ্টা করি
        const { data: updateData, error: verificationError } = await supabase
          .from('verification_data')
          .update({ is_verified: true })
          .eq('id', verificationData.id)
          .select();
        
        if (verificationError) {
          console.error('Error updating verification_data:', verificationError);
          throw verificationError;
        }
        
        console.log('Verification data update result:', updateData);
        
        // face_verification টেবিলে status আর is_verified আপডেট করি
        const { data: faceData, error: faceVerificationError } = await supabase
          .from('face_verification')
          .update({ 
            status: 'approved',
            is_verified: true 
          })
          .eq('user_id', verificationData.user_id)
          .select();
        
        if (faceVerificationError) {
          console.error('Error updating face_verification:', faceVerificationError);
        }
      } else {
        console.log('RPC result:', rpcResult);
      }
      
      // সফল টোস্ট দেখাই
      toast({
        title: 'ভেরিফিকেশন অনুমোদিত',
        description: 'ব্যবহারকারীর ভেরিফিকেশন অনুমোদিত হয়েছে।',
      });
      
      // লোকাল স্টেট আপডেট করি যাতে UI তাৎক্ষণিকভাবে আপডেট হয়
      setVerificationData(prev => prev ? { ...prev, is_verified: true, status: 'approved' } : null);

      // Insert notification into the notifications table
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: verificationData.user_id,
            title: 'ভেরিফিকেশন অনুমোদিত',
            message: 'আপনার ভেরিফিকেশন সফলভাবে অনুমোদিত হয়েছে।',
            type: 'verification_approved',
          },
        ]);

      if (notificationError) {
        console.error('Error inserting notification:', notificationError);
        toast({
          title: 'নোটিফিকেশন সমস্যা',
          description: 'নোটিফিকেশন পাঠাতে সমস্যা হয়েছে।',
          variant: 'destructive',
        });
      } else {
        // সফল টোস্ট দেখাই
        toast({
          title: 'ভেরিফিকেশন অনুমোদিত',
          description: 'ব্যবহারকারীর ভেরিফিকেশন অনুমোদিত হয়েছে।',
        });
      }
      
      // আপডেটেড ডেটা লোড করি
      fetchVerificationData();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast({
        title: 'অনুমোদন সমস্যা',
        description: 'ভেরিফিকেশন অনুমোদন করতে সমস্যা হয়েছে।',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };
  
  // ভেরিফিকেশন বাতিল করি
  const rejectVerification = async () => {
    if (!verificationData?.user_id) return;
    
    try {
      setProcessingAction(true);
      
      console.log('Rejecting verification for user_id:', verificationData.user_id);
      console.log('Verification data before update:', verificationData);
      
      // RPC ফাংশন ব্যবহার করে বাতিল করি - এটি RLS বাইপাস করবে
      const { data: rpcResult, error: rpcError } = await supabase.rpc('reject_verification', {
        verification_id: verificationData.id,
        feedback_text: feedback || 'আপনার ভেরিফিকেশন তথ্য সঠিক নয়।'
      });
      
      if (rpcError) {
        console.error('Error calling reject_verification RPC:', rpcError);
        
        // RPC না থাকলে সরাসরি আপডেট চেষ্টা করি
        console.log('Trying direct update as fallback...');
        
        // সরাসরি ডাটাবেস আপডেট চেষ্টা করি
        const { data: updateData, error: verificationError } = await supabase
          .from('verification_data')
          .update({ is_verified: false })
          .eq('id', verificationData.id)
          .select();
        
        if (verificationError) {
          console.error('Error updating verification_data:', verificationError);
          throw verificationError;
        }
        
        console.log('Verification data update result:', updateData);
        
        // face_verification টেবিলে status, feedback এবং is_verified আপডেট করি
        const { data: faceData, error: faceVerificationError } = await supabase
          .from('face_verification')
          .update({ 
            status: 'rejected',
            is_verified: false,
            feedback: feedback || 'আপনার ভেরিফিকেশন তথ্য সঠিক নয়।'
          })
          .eq('user_id', verificationData.user_id)
          .select();
        
        if (faceVerificationError) {
          console.error('Error updating face_verification:', faceVerificationError);
        }
      } else {
        console.log('RPC result:', rpcResult);
      }
      
      // সফল টোস্ট দেখাই
      toast({
        title: 'ভেরিফিকেশন বাতিল',
        description: 'ব্যবহারকারীর ভেরিফিকেশন বাতিল করা হয়েছে।',
      });
      
      // লোকাল স্টেট আপডেট করি যাতে UI তাৎক্ষণিকভাবে আপডেট হয়
      setVerificationData(prev => prev ? { ...prev, is_verified: false, status: 'rejected' } : null);
      
      // আপডেটেড ডেটা লোড করি
      fetchVerificationData();

      // Send notification to the user
      toast({
        title: 'ভেরিফিকেশন বাতিল',
        description: `আপনার ভেরিফিকেশন বাতিল করা হয়েছে। কারণ: ${feedback || 'আপনার ভেরিফিকেশন তথ্য সঠিক নয়।'}`
      });

  } catch (error) {
    console.error('Error rejecting verification:', error);
    toast({
      title: 'বাতিল সমস্যা',
      description: 'ভেরিফিকেশন বাতিল করতে সমস্যা হয়েছে।',
      variant: 'destructive',
    });
  } finally {
    setProcessingAction(false);
  }
};

  // ভেরিফিকেশন ডেটা ডিলিট করি
  const deleteVerification = async () => {
    if (!verificationData?.id) return;

    try {
      setProcessingAction(true);

      // ডাটাবেস থেকে ভেরিফিকেশন ডেটা ডিলিট করি
      const { error } = await supabase
        .from('verification_data')
        .delete()
        .eq('id', verificationData.id);

      if (error) {
        throw error;
      }

      // সফল টোস্ট দেখাই
      toast({
        title: 'ভেরিফিকেশন বাতিল',
        description: 'ব্যবহারকারীর ভেরিফিকেশন ডেটা বাতিল করা হয়েছে।',
      });

      // UI আপডেট করি এবং অ্যাডমিন প্যানেলে ফিরে যাই
      navigate('/admin/verification');

      // Insert notification into the notifications table
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: verificationData.user_id,
            title: 'ভেরিফিকেশন বাতিল',
            message: 'আপনার ভেরিফিকেশন ডেটা বাতিল করা হয়েছে।',
            type: 'verification_deleted',
          },
        ]);

      if (notificationError) {
        console.error('Error inserting notification:', notificationError);
        toast({
          title: 'নোটিফিকেশন সমস্যা',
          description: 'নোটিফিকেশন পাঠাতে সমস্যা হয়েছে।',
          variant: 'destructive',
        });
      } else {
        // Show success toast
        toast({
          title: 'ভেরিফিকেশন বাতিল',
          description: 'ব্যবহারকারীর ভেরিফিকেশন ডেটা বাতিল করা হয়েছে।',
        });
      }
  } catch (error) {
    console.error('Error deleting verification:', error);
    toast({
      title: 'বাতিল সমস্যা',
      description: 'ভেরিফিকেশন ডেটা বাতিল করতে সমস্যা হয়েছে।',
      variant: 'destructive',
    });
  } finally {
    setProcessingAction(false);
  }
};
  
  // রোল নম্বর কপি করার ফাংশন
  const copyRollNumber = async () => {
    if (!verificationData?.roll_no) return;
    
    try {
      // রোল নম্বর কপি করি
      await navigator.clipboard.writeText(verificationData.roll_no);
      
      // কপি সফল হয়েছে দেখাই
      setCopied(true);
      toast({
        title: "কপি করা হয়েছে",
        description: "রোল নম্বর কপি করা হয়েছে।",
      });
      
      // 2 সেকেন্ড পরে কপি আইকন রিসেট করি
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      // iframe এ রোল নম্বর পেস্ট করার চেষ্টা করি
      try {
        if (iframeRef.current) {
          // iframe লোড হওয়ার পরে পেস্ট করার জন্য একটু সময় দেই
          setTimeout(() => {
            tryToPasteInIframe(verificationData.roll_no);
          }, 500);
        }
      } catch (error) {
        console.error("iframe এ পেস্ট করতে সমস্যা:", error);
      }
    } catch (error) {
      console.error("কপি করতে সমস্যা:", error);
      toast({
        title: "কপি করতে সমস্যা",
        description: "রোল নম্বর কপি করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    }
  };
  
  // iframe এ রোল নম্বর পেস্ট করার চেষ্টা
  const tryToPasteInIframe = (rollNumber: string) => {
    try {
      if (!iframeRef.current) return;
      
      // iframe এর contentWindow অ্যাক্সেস করার চেষ্টা করি
      const iframeWindow = iframeRef.current.contentWindow;
      if (!iframeWindow) return;
      
      // postMessage API ব্যবহার করে iframe এ মেসেজ পাঠাই
      iframeWindow.postMessage({
        type: 'PASTE_ROLL_NUMBER',
        rollNumber: rollNumber
      }, 'https://btebresultszone.com');
      
      console.log('iframe এ মেসেজ পাঠানো হয়েছে:', rollNumber);
    } catch (error) {
      console.error('iframe এ পেস্ট করতে সমস্যা:', error);
    }
  };
  
  // iframe লোড হওয়ার পর এই ফাংশন কল হবে
  const handleIframeLoad = () => {
    if (!iframeRef.current || !verificationData?.roll_no) return;
    
    // iframe লোড হওয়ার পর স্ক্রিপ্ট ইনজেকশন চেষ্টা করি
    try {
      // iframe এর ভিতরে 20% স্ক্রল করি - লোড হওয়ার পরে কয়েকবার চেষ্টা করি
      setTimeout(() => scrollIframeContent(), 1000);
      setTimeout(() => scrollIframeContent(), 1500);
      setTimeout(() => scrollIframeContent(), 2000);
      
      const iframeDocument = iframeRef.current.contentDocument || 
                            (iframeRef.current.contentWindow?.document);
      
      if (!iframeDocument) {
        console.log('iframe document অ্যাক্সেস করা যায়নি (CORS সীমাবদ্ধতা)');
        return;
      }
      
      // iframe এর ভিতরে স্ক্রিপ্ট ইনজেক্ট করি
      try {
        const scriptElement = iframeDocument.createElement('script');
        scriptElement.textContent = `
          // পেইজ লোড হওয়ার পর স্বয়ংক্রিয়ভাবে স্ক্রল করি
          setTimeout(function() {
            const totalHeight = document.body.scrollHeight;
            const scrollAmount = totalHeight * 0.2; // 20% স্ক্রল
            window.scrollTo({
              top: scrollAmount,
              behavior: 'smooth'
            });
            console.log('iframe স্বয়ংক্রিয়ভাবে স্ক্রল করা হয়েছে:', scrollAmount, 'px');
          }, 500);
        `;
        iframeDocument.body.appendChild(scriptElement);
      } catch (error) {
        console.error('iframe এ স্ক্রিপ্ট ইনজেক্ট করতে সমস্যা:', error);
      }
      
      // রোল নম্বর ইনপুট ফিল্ড খুঁজি
      const rollInputs = iframeDocument.querySelectorAll('input[type="text"], input[type="number"]');
      
      // সম্ভাব্য রোল ইনপুট ফিল্ডে রোল নম্বর সেট করি
      for (const input of rollInputs) {
        const inputElement = input as HTMLInputElement;
        const inputId = inputElement.id?.toLowerCase() || '';
        const inputName = inputElement.name?.toLowerCase() || '';
        const inputPlaceholder = inputElement.placeholder?.toLowerCase() || '';
        
        // রোল সম্পর্কিত ইনপুট ফিল্ড খুঁজি
        if (
          inputId.includes('roll') || 
          inputName.includes('roll') || 
          inputPlaceholder.includes('roll') ||
          inputId.includes('id') || 
          inputName.includes('id')
        ) {
          inputElement.value = verificationData.roll_no;
          console.log('রোল নম্বর সেট করা হয়েছে:', inputElement);
          
          // ইনপুট ইভেন্ট ট্রিগার করি যাতে ফর্ম আপডেট হয়
          const event = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(event);
          break;
        }
      }
    } catch (error) {
      console.error('iframe অ্যাক্সেস করতে সমস্যা:', error);
    }
  };
  
  // iframe এর কন্টেন্ট স্ক্রল করার ফাংশন
  const scrollIframeContent = () => {
    try {
      if (!iframeRef.current) return;
      
      const iframeWindow = iframeRef.current.contentWindow;
      if (!iframeWindow) return;
      
      // postMessage API ব্যবহার করে iframe এ স্ক্রল করার মেসেজ পাঠাই
      iframeWindow.postMessage({
        type: 'SCROLL_CONTENT',
        scrollPercentage: 20
      }, '*');
      
      // সরাসরি স্ক্রল করার চেষ্টা করি
      try {
        const iframeDocument = iframeRef.current.contentDocument || 
                              (iframeRef.current.contentWindow?.document);
        
        if (iframeDocument && iframeDocument.body) {
          const totalHeight = iframeDocument.body.scrollHeight;
          const scrollAmount = totalHeight * 0.2; // 20% স্ক্রল
          
          // পদ্ধতি 1: contentWindow.scrollTo ব্যবহার
          iframeWindow.scrollTo({
            top: scrollAmount,
            behavior: 'smooth'
          });
          
          // পদ্ধতি 2: body.scrollTop সেট করা
          iframeDocument.body.scrollTop = scrollAmount;
          
          // পদ্ধতি 3: documentElement.scrollTop সেট করা
          iframeDocument.documentElement.scrollTop = scrollAmount;
          
          console.log('iframe স্ক্রল করার চেষ্টা করা হয়েছে:', scrollAmount, 'px');
        }
      } catch (error) {
        console.error('iframe স্ক্রল করতে সমস্যা:', error);
      }
    } catch (error) {
      console.error('iframe স্ক্রল করতে সমস্যা:', error);
    }
  };
  
  // window message ইভেন্ট লিসেনার যোগ করি
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // iframe থেকে আসা মেসেজ প্রসেস করি
      if (event.origin === 'https://btebresultszone.com') {
        console.log('iframe থেকে মেসেজ পাওয়া গেছে:', event.data);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // লোডিং স্পিনার দেখাই
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }
  
  // ডেটা না পাওয়া গেলে এরর মেসেজ দেখাই
  if (!verificationData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ভেরিফিকেশন ডেটা পাওয়া যায়নি</h2>
            <p className="text-gray-600 mb-6">অনুগ্রহ করে আবার চেষ্টা করুন বা অ্যাডমিন প্যানেলে ফিরে যান।</p>
            <Button onClick={() => navigate('/admin/verification')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              ভেরিফিকেশন লিস্টে ফিরে যান
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        {/* হেডার সেকশন */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/verification')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              ফিরে যান
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">ভেরিফিকেশন বিবরণ</h1>
          </div>
          
          <Badge className={
            verificationData.is_verified 
              ? "bg-green-100 text-green-800 text-base px-3 py-1" 
              : "bg-yellow-100 text-yellow-800 text-base px-3 py-1"
          }>
            {verificationData.is_verified ? 'ভেরিফাইড' : 'পেন্ডিং'}
          </Badge>
        </div>
        
        {/* মূল কন্টেন্ট - দুই কলাম */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* বাম কলাম - বর্তমান কন্টেন্ট (60%) */}
          <div className="w-full lg:w-[60%]">
            {/* ব্যবহারকারী তথ্য কার্ড */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  ব্যবহারকারী তথ্য
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">বিভাগ</h3>
                    <p className="font-medium text-lg">{verificationData.department || 'বিভাগ উপলব্ধ নয়'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">প্রতিষ্ঠান</h3>
                    <p className="font-medium text-lg">{verificationData.institute_name || 'প্রতিষ্ঠানের নাম উপলব্ধ নয়'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">রোল নম্বর</h3>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{verificationData.roll_no}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                        onClick={copyRollNumber}
                        title="রোল নম্বর কপি করুন"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="ml-1 text-xs">কপি</span>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">রেজিস্ট্রেশন নম্বর</h3>
                    <p className="font-medium">{verificationData.reg_no}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* ডকুমেন্ট এবং ফটো কার্ড */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* এডমিট কার্ড/আইডি কার্ড */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">এডমিট কার্ড/আইডি</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <img 
                      src={verificationData.document_url} 
                      alt="Admit Card" 
                      className="w-full h-64 object-contain bg-gray-100"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* ব্যবহারকারীর ছবি */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">সেলফি ভেরিফিকেশন</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    {verificationData.photo_url ? (
                      <img 
                        src={verificationData.photo_url} 
                        alt="User Photo" 
                        className="w-full h-64 object-contain bg-gray-100"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-500">সেলফি আপলোড করা হয়নি</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* ফিডব্যাক এবং অ্যাকশন কার্ড */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">অ্যাকশন</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">ফিডব্যাক (বাতিল করার ক্ষেত্রে)</h3>
                  <Textarea
                    placeholder="বাতিল করার কারণ লিখুন..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="resize-none"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-4">
                <Button
                  variant="destructive"
                  onClick={rejectVerification}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XIcon className="mr-2 h-4 w-4" />
                  )}
                  বাতিল করুন (Reject)
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteVerification}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XIcon className="mr-2 h-4 w-4" />
                  )}
                  বাতিল করুন (Delete)
                </Button>
                <Button
                  onClick={approveVerification}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckIcon className="mr-2 h-4 w-4" />
                  )}
                  অনুমোদন করুন
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* ডান কলাম - iframe (40%) */}
          <div className="w-full lg:w-[40%]">
            <Card className="h-full">
              <CardContent className="p-0">
                <div className="w-full h-[900px] overflow-hidden">
                  <iframe 
                    ref={iframeRef}
                    src="https://btebresultszone.com/results" 
                    title="BTEB Results Zone" 
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    onLoad={handleIframeLoad}
                    scrolling="yes"
                  ></iframe>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* iframe এর জন্য স্ক্রিপ্ট ইনজেকশন */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // iframe লোড হওয়ার পর স্ক্রিপ্ট চালানো
            document.addEventListener('DOMContentLoaded', function() {
              // iframe এর রেফারেন্স নেই
              const iframes = document.querySelectorAll('iframe');
              
              iframes.forEach(function(iframe) {
                iframe.addEventListener('load', function() {
                  try {
                    // iframe এর কন্টেন্ট উইন্ডো অ্যাক্সেস করার চেষ্টা করি
                    const iframeWindow = iframe.contentWindow;
                    if (!iframeWindow) return;
                    
                    // স্ক্রল করার জন্য 1 সেকেন্ড অপেক্ষা করি
                    setTimeout(function() {
                      try {
                        const iframeDoc = iframeWindow.document;
                        if (!iframeDoc) return;
                        
                        const totalHeight = iframeDoc.body.scrollHeight;
                        const scrollAmount = totalHeight * 0.2; // 20% স্ক্রল
                        
                        iframeWindow.scrollTo({
                          top: scrollAmount,
                          behavior: 'smooth'
                        });
                        
                        console.log('iframe স্ক্রল করা হয়েছে (global script):', scrollAmount, 'px');
                      } catch (error) {
                        console.error('iframe স্ক্রল করতে সমস্যা (global script):', error);
                      }
                    }, 1000);
                  } catch (error) {
                    console.error('iframe অ্যাক্সেস করতে সমস্যা (global script):', error);
                  }
                });
              });
            });
            
            // iframe এর জন্য স্ক্রিপ্ট
            window.addEventListener('message', function(event) {
              // রোল নম্বর পেস্ট করার লজিক
              if (event.data && event.data.type === 'PASTE_ROLL_NUMBER') {
                const rollNumber = event.data.rollNumber;
                
                // রোল নম্বর ইনপুট ফিল্ড খুঁজি
                const rollInputs = document.querySelectorAll('input[type="text"], input[type="number"]');
                
                // সম্ভাব্য রোল ইনপুট ফিল্ডে রোল নম্বর সেট করি
                for (const input of rollInputs) {
                  const inputElement = input;
                  const inputId = inputElement.id?.toLowerCase() || '';
                  const inputName = inputElement.name?.toLowerCase() || '';
                  const inputPlaceholder = inputElement.placeholder?.toLowerCase() || '';
                  
                  // রোল সম্পর্কিত ইনপুট ফিল্ড খুঁজি
                  if (
                    inputId.includes('roll') || 
                    inputName.includes('roll') || 
                    inputPlaceholder.includes('roll') ||
                    inputId.includes('id') || 
                    inputName.includes('id')
                  ) {
                    inputElement.value = rollNumber;
                    console.log('রোল নম্বর সেট করা হয়েছে:', inputElement);
                    
                    // ইনপুট ইভেন্ট ট্রিগার করি যাতে ফর্ম আপডেট হয়
                    const event = new Event('input', { bubbles: true });
                    inputElement.dispatchEvent(event);
                    break;
                  }
                }
              }
              
              // স্ক্রল করার লজিক
              if (event.data && event.data.type === 'SCROLL_CONTENT') {
                const scrollPercentage = event.data.scrollPercentage || 0;
                const totalHeight = document.body.scrollHeight;
                const scrollAmount = totalHeight * (scrollPercentage / 100);
                
                window.scrollTo({
                  top: scrollAmount,
                  behavior: 'smooth'
                });
                
                console.log('iframe স্ক্রল করা হয়েছে (message):', scrollAmount, 'px');
              }
            });
            
            // পেইজ লোড হওয়ার পর স্বয়ংক্রিয়ভাবে স্ক্রল করি
            window.addEventListener('load', function() {
              setTimeout(function() {
                const totalHeight = document.body.scrollHeight;
                const scrollAmount = totalHeight * 0.2; // 20% স্ক্রল
                
                window.scrollTo({
                  top: scrollAmount,
                  behavior: 'smooth'
                });
                
                console.log('iframe স্বয়ংক্রিয়ভাবে স্ক্রল করা হয়েছে (load event):', scrollAmount, 'px');
              }, 1000);
            });
          `
        }}
      />
    </div>
  );
};

export default AdminVerificationDetailPage; 
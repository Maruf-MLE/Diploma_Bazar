import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  UserCheck, 
  AlertCircle, 
  CheckCircle,
  Award,
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VerificationData {
  id: string;
  user_id: string;
  name: string;
  roll_no: string;
  reg_no: string;
  document_url: string;
  created_at: string;
  updated_at: string;
  photo_url: string | null;
  status: string | null;
  is_verified: boolean;
  institute_name: string | null;
  feedback: string | null;
}

const VerificationApprovedPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  
  // ভেরিফিকেশন ডেটা লোড করি
  useEffect(() => {
    const fetchVerificationData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // verification_data টেবিল থেকে ডেটা নেই
        const { data: verificationData, error: verificationError } = await supabase
          .from('verification_data')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (verificationError) {
          throw verificationError;
        }
        
        // face_verification টেবিল থেকে ডেটা নেই
        const { data: faceData, error: faceError } = await supabase
          .from('face_verification')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        // profiles টেবিল থেকে ডেটা নেই
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        // সব ডেটা একত্রিত করি
        const combinedData: VerificationData = {
          ...verificationData,
          photo_url: faceData?.photo_url || null,
          status: faceData?.status || null,
          name: profileData?.name || verificationData?.name || null,
          institute_name: profileData?.institute_name || null,
          feedback: faceData?.feedback || null
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
    
    fetchVerificationData();
  }, [id, user, toast]);

  // Show welcome toast when page loads
  useEffect(() => {
    toast({
      title: 'অভিনন্দন!',
      description: 'আপনার ভেরিফিকেশন সফলভাবে অনুমোদিত হয়েছে!',
      variant: 'default',
    });
  }, [toast]);
  
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
            <p className="text-gray-600 mb-6">অনুগ্রহ করে আবার চেষ্টা করুন বা প্রোফাইল পেজে ফিরে যান।</p>
            <Button onClick={() => navigate('/profile')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              প্রোফাইলে ফিরে যান
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        {/* হেডার সেকশন */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/profile')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              ফিরে যান
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">ভেরিফিকেশন অনুমোদিত</h1>
          </div>
          
          <Badge className="bg-green-100 text-green-800 text-base px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-1" />
            ভেরিফাইড
          </Badge>
        </div>
        
        {/* অভিনন্দন কার্ড */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <Award className="w-full h-full text-green-500" />
          </div>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-green-800 mb-2">অভিনন্দন! আপনার অ্যাকাউন্ট ভেরিফাইড</h2>
                <p className="text-green-700">
                  আপনার ভেরিফিকেশন সফলভাবে অনুমোদিত হয়েছে। এখন আপনি সাইটের সমস্ত ফিচার ব্যবহার করতে পারবেন।
                  আপনার প্রোফাইলে এখন ভেরিফাইড ব্যাজ প্রদর্শিত হবে।
                </p>
                <div className="mt-4 flex gap-3">
                  <Button 
                    variant="default" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => navigate('/books')}
                  >
                    বই ব্রাউজ করুন
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => navigate('/profile')}
                  >
                    প্রোফাইল দেখুন
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* ব্যবহারকারী তথ্য কার্ড */}
        <Card className="mb-6 border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              ব্যবহারকারী তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">নাম</h3>
                <p className="font-medium text-lg">{verificationData.name || 'অজানা'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">প্রতিষ্ঠান</h3>
                <p className="font-medium text-lg">{verificationData.institute_name || 'প্রতিষ্ঠানের নাম উপলব্ধ নয়'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">রোল নম্বর</h3>
                <p className="font-medium">{verificationData.roll_no}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">রেজিস্ট্রেশন নম্বর</h3>
                <p className="font-medium">{verificationData.reg_no}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* ডকুমেন্ট এবং ফটো কার্ড */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* এডমিট কার্ড/আইডি কার্ড */}
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-base">এডমিট কার্ড/আইডি</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-green-200 rounded-md overflow-hidden">
                <img 
                  src={verificationData.document_url} 
                  alt="Admit Card" 
                  className="w-full h-64 object-contain bg-gray-100"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* ব্যবহারকারীর ছবি */}
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-base">সেলফি ভেরিফিকেশন</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-green-200 rounded-md overflow-hidden">
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
      </div>
    </div>
  );
};

export default VerificationApprovedPage; 
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BookOpen, ArrowLeft, HelpCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';

const NotAllowedPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="container max-w-4xl mx-auto px-4 py-12 mt-8 flex-grow">
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-500 h-10 w-10" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-700">
              অনুমতি নেই
            </CardTitle>
            <CardDescription className="text-red-600 text-base">
              আপনি এই বইটি দেখতে বা কিনতে পারবেন না
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4 pt-4">
            <p className="text-lg font-medium">
              এই বইটি আপনার প্রতিষ্ঠানের কোনো বিক্রেতার বই নয়
            </p>
            <p className="text-gray-600 max-w-lg mx-auto">
              আমাদের সাইটে, আপনি শুধুমাত্র আপনার নিজের প্রতিষ্ঠানের বিক্রেতাদের থেকে বই কিনতে পারবেন। 
              দয়া করে আপনার প্রতিষ্ঠানের বিক্রেতাদের বই খুঁজুন বই পেজে গিয়ে ফিল্টার এ ক্লিক করে ফিল্টারিং করে আপনার প্রতিষ্ঠান এর বিক্রেতার বই খুঁজুন।
            </p>
            
            <div className="flex items-center justify-center gap-2 bg-red-100 p-4 rounded-lg text-red-800 my-6">
              <BookOpen className="h-5 w-5" />
              <p className="font-medium">
                নিরাপত্তা এবং সুবিধার জন্য শুধুমাত্র একই প্রতিষ্ঠানের ছাত্র-ছাত্রীদের মধ্যে লেনদেন সীমিত রাখা হয়েছে
              </p>
            </div>
            
            <div className="flex items-center justify-center mt-4">
              <Link 
                to="/help" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                প্রয়োজনে সাহায্য কেন্দ্রে যান
              </Link>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center gap-4 pt-2 pb-6">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate('/browse')}
            >
              <ArrowLeft className="h-4 w-4" />
              বই খুঁজুন
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              হোম পেজে ফিরুন
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default NotAllowedPage; 
import React from 'react';
import { BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const SmartPosting = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16 pb-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-6">
              <Link to="/" className="flex items-center text-primary hover:text-primary/80 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span>হোম পেজে ফিরুন</span>
              </Link>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-blue-50 p-6 rounded-full">
                <BookOpen className="h-16 w-16 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">স্মার্ট বুক পোস্টিং</h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  আমাদের অত্যাধুনিক বুক পোস্টিং সিস্টেম ব্যবহার করে সহজেই আপনার বই বিক্রি করুন। 
                  সম্পূর্ণ বিনামূল্যে, মাত্র কয়েক মিনিটে।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* How It Works Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">কিভাবে কাজ করে?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-blue-600">১</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">বইয়ের তথ্য দিন</h3>
                <p className="text-gray-600">
                  বইয়ের নাম, লেখক, অবস্থা, মূল্য সহ প্রয়োজনীয় তথ্য দিন। বইয়ের ছবি আপলোড করুন।
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-blue-600">২</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">অপেক্ষা করুন</h3>
                <p className="text-gray-600">
                  আমাদের সিস্টেম আপনার বইয়ের বিবরণ যাচাই করবে এবং অনুমোদন দিবে (সাধারণত ১-২ ঘন্টার মধ্যে)।
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-blue-600">৩</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">ক্রেতাদের সাথে যোগাযোগ</h3>
                <p className="text-gray-600">
                  আগ্রহী ক্রেতারা আপনার সাথে যোগাযোগ করবে। আপনি তাদের সাথে চ্যাট করে বিক্রয়ের শর্তাবলী নির্ধারণ করুন।
                </p>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">বিশেষ সুবিধাসমূহ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-50 p-2 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">স্মার্ট প্রাইসিং</h3>
                  <p className="text-gray-600">
                    আমাদের AI সিস্টেম আপনার বইয়ের জন্য সঠিক মূল্য সুপারিশ করবে, যাতে আপনি দ্রুত বিক্রি করতে পারেন।
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-green-50 p-2 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">অটো-ফিলিং</h3>
                  <p className="text-gray-600">
                    বইয়ের ISBN নম্বর দিলে সিস্টেম স্বয়ংক্রিয়ভাবে বইয়ের তথ্য পূরণ করবে।
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-green-50 p-2 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">ফ্রি লিস্টিং</h3>
                  <p className="text-gray-600">
                    আমাদের প্ল্যাটফর্মে বই পোস্ট করা সম্পূর্ণ বিনামূল্যে। কোন প্রকার ফি নেই।
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-green-50 p-2 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">ট্র্যাকিং সিস্টেম</h3>
                  <p className="text-gray-600">
                    আপনার বইয়ের লিস্টিং কতজন দেখেছে, কতজন আগ্রহী, সবকিছু ট্র্যাক করুন।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">সাধারণ জিজ্ঞাসা</h2>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-2">কি ধরনের বই বিক্রি করা যাবে?</h3>
                <p className="text-gray-600">
                  যেকোনো ধরনের একাডেমিক বই, উপন্যাস, গল্প, ধর্মীয় বই, সাহিত্য ইত্যাদি বিক্রি করতে পারবেন। তবে অশ্লীল বা আইন বিরোধী কোন বই গ্রহণযোগ্য নয়।
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-2">কতগুলো বই পোস্ট করা যাবে?</h3>
                <p className="text-gray-600">
                  একজন ব্যবহারকারী একসাথে সর্বোচ্চ ২০টি বই পোস্ট করতে পারবেন। বিক্রি হয়ে গেলে নতুন পোস্ট করা যাবে।
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-2">কত দিন পর্যন্ত বইয়ের পোস্ট থাকবে?</h3>
                <p className="text-gray-600">
                  বইয়ের পোস্ট ৬০ দিন পর্যন্ত সক্রিয় থাকবে। এরপর আপনি চাইলে পুনরায় পোস্ট করতে পারবেন।
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">আজই আপনার বই পোস্ট করুন</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              হাজারো ছাত্র-ছাত্রী আপনার বইয়ের জন্য অপেক্ষা করছে। দ্রুত বিক্রি করতে এখনই শুরু করুন।
            </p>
            <Link to="/sell">
              <Button className="primary-button px-8 py-6 rounded-full shadow-lg hover:shadow-xl">
                বই পোস্ট করুন
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SmartPosting; 
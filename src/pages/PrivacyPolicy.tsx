import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  // Reset scroll position to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow container max-w-4xl mx-auto px-4 py-12 mt-16">
        <div className="mb-6">
          <Link 
            to="/" 
            className="flex items-center text-primary hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            মূল পেজে ফিরে যান
          </Link>
          <h1 className="text-3xl font-bold mb-2 gradient-text">গোপনীয়তা নীতি</h1>
          <p className="text-gray-600 mb-8">সর্বশেষ আপডেট: ১২ জুলাই, ২০২৪</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">ভূমিকা</h2>
            <p className="mb-4">
              বই-চাপা-বাজার-এ আমরা আপনার গোপনীয়তার প্রতি প্রতিশ্রুতিবদ্ধ। এই গোপনীয়তা নীতি ব্যাখ্যা করে যে আমরা কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি।
            </p>
            <p className="mb-4">
              আমাদের সেবা ব্যবহার করে, আপনি এই গোপনীয়তা নীতিতে বর্ণিত তথ্য সংগ্রহ এবং ব্যবহারে সম্মত হচ্ছেন।
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">আমরা যে তথ্য সংগ্রহ করি</h2>
            <p className="mb-3">আমরা নিম্নলিখিত ধরনের তথ্য সংগ্রহ করি:</p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">১. ব্যক্তিগত তথ্য</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>নাম, ইমেইল ঠিকানা, ফোন নম্বর</li>
              <li>শিক্ষা প্রতিষ্ঠানের নাম, রোল নাম্বার, সেমিস্টার</li>
              <li>প্রোফাইল ফটো এবং ভেরিফিকেশনের জন্য দেওয়া ডকুমেন্ট</li>
              <li>ব্যবহারকারীর পছন্দ এবং সেটিংস</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-2 mt-4">২. বই সংক্রান্ত তথ্য</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>বইয়ের তালিকা, ছবি, বিবরণ এবং মূল্য</li>
              <li>বিক্রয়/ক্রয় সংক্রান্ত তথ্য</li>
              <li>বই বিনিময়ের ইতিহাস</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-2 mt-4">৩. যোগাযোগ তথ্য</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>প্ল্যাটফর্মে পাঠানো বার্তা এবং কমিউনিকেশন</li>
              <li>কাস্টমার সাপোর্টের সাথে যোগাযোগের তথ্য</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-2 mt-4">৪. প্রযুক্তিগত তথ্য</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>আইপি ঠিকানা, ব্রাউজার ধরন, অপারেটিং সিস্টেম</li>
              <li>ডিভাইস আইডেন্টিফায়ার এবং অ্যাক্সেস লগ</li>
              <li>ওয়েবসাইট ব্যবহারের পরিসংখ্যান</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">তথ্য ব্যবহারের উদ্দেশ্য</h2>
            <p className="mb-3">আমরা সংগৃহীত তথ্য নিম্নলিখিত উদ্দেশ্যে ব্যবহার করি:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>অ্যাকাউন্ট তৈরি এবং পরিচালনা করতে</li>
              <li>বই কেনা-বেচার প্ল্যাটফর্ম প্রদান করতে</li>
              <li>ব্যবহারকারী যাচাইকরণ এবং নিরাপত্তা নিশ্চিত করতে</li>
              <li>কাস্টমার সাপোর্ট প্রদান করতে</li>
              <li>ওয়েবসাইট এবং সেবা উন্নত করতে</li>
              <li>আইনি বাধ্যবাধকতা মেনে চলতে</li>
              <li>নতুন পণ্য ও সেবা সম্পর্কে জানাতে (শুধুমাত্র আপনার সম্মতিতে)</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">তথ্য শেয়ারিং এবং প্রকাশ</h2>
            <p className="mb-4">
              আমরা আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি করি না। তবে নিম্নলিখিত পরিস্থিতিতে তথ্য শেয়ার করতে পারি:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>আপনার স্পষ্ট সম্মতির সাথে</li>
              <li>আইনি প্রয়োজনে বা আদালতের আদেশে</li>
              <li>জনসুরক্ষা বা জরুরি অবস্থায়</li>
              <li>আমাদের সেবা প্রদানকারী (যেমন Supabase, ক্লাউড স্টোরেজ) এর সাথে</li>
              <li>ব্যবসায়িক স্থানান্তর বা একীভূতকরণের সময়</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">ডেটা নিরাপত্তা</h2>
            <p className="mb-4">
              আপনার ব্যক্তিগত তথ্যের নিরাপত্তা আমাদের অগ্রাধিকার। আমরা বিভিন্ন নিরাপত্তা ব্যবস্থা গ্রহণ করি:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>SSL/TLS এনক্রিপশন ব্যবহার করি</li>
              <li>নিয়মিত নিরাপত্তা অডিট পরিচালনা করি</li>
              <li>অ্যাক্সেস নিয়ন্ত্রণ এবং প্রমাণীকরণ সিস্টেম ব্যবহার করি</li>
              <li>ডেটা ব্যাকআপ এবং রিকভারি সিস্টেম বজায় রাখি</li>
              <li>কর্মচারীদের গোপনীয়তা প্রশিক্ষণ প্রদান করি</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">ডেটা সংরক্ষণ</h2>
            <p className="mb-4">
              আমরা আপনার ব্যক্তিগত তথ্য যতদিন প্রয়োজন ততদিন সংরক্ষণ করি। সাধারণত:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>সক্রিয় অ্যাকাউন্টের তথ্য অ্যাকাউন্ট বন্ধ না করা পর্যন্ত</li>
              <li>লেনদেন সংক্রান্ত তথ্য ৭ বছর</li>
              <li>যোগাযোগ এবং বার্তা ৩ বছর</li>
              <li>আইনি প্রয়োজনে আরও বেশি সময়</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">আপনার অধিকার</h2>
            <p className="mb-3">আপনার নিম্নলিখিত অধিকার রয়েছে:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>আপনার ব্যক্তিগত তথ্য দেখার এবং কপি পাওয়ার অধিকার</li>
              <li>ভুল তথ্য সংশোধন করার অধিকার</li>
              <li>আপনার ব্যক্তিগত তথ্য মুছে ফেলার অধিকার</li>
              <li>তথ্য প্রক্রিয়াকরণে আপত্তি জানানোর অধিকার</li>
              <li>তথ্য বহনযোগ্যতার অধিকার</li>
              <li>সম্মতি প্রত্যাহারের অধিকার</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">শিশুদের গোপনীয়তা</h2>
            <p className="mb-4">
              আমাদের সেবা ১৮ বছরের কম বয়সী ব্যবহারকারীদের জন্য ডিজাইন করা নয়। আমরা জেনেশুনে ১৮ বছরের কম বয়সী কারও কাছ থেকে ব্যক্তিগত তথ্য সংগ্রহ করি না। যদি আমরা জানতে পারি যে একটি শিশু আমাদের কাছে ব্যক্তিগত তথ্য প্রদান করেছে, তবে আমরা সেই তথ্য অবিলম্বে মুছে ফেলব।
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">নীতি পরিবর্তন</h2>
            <p className="mb-4">
              আমরা সময়ে সময়ে এই গোপনীয়তা নীতি আপডেট করতে পারি। কোনো উল্লেখযোগ্য পরিবর্তন হলে আমরা আপনাকে ইমেইল বা ওয়েবসাইটে নোটিশের মাধ্যমে জানাব।
            </p>
            <p className="mb-4">
              নীতি পরিবর্তনের পর আমাদের সেবা ব্যবহার অব্যাহত রাখলে আপনি নতুন নীতি মেনে নিয়েছেন বলে ধরে নেওয়া হবে।
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-2xl font-semibold mb-4">যোগাযোগ</h2>
            <p className="mb-4">
              এই গোপনীয়তা নীতি বা আপনার ব্যক্তিগত তথ্য সম্পর্কে কোনো প্রশ্ন বা উদ্বেগ থাকলে, অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন:
            </p>
            <div className="mb-1"><strong>ইমেইল:</strong> support@bookexchange.bd</div>
            <div className="mb-1"><strong>ফোন:</strong> +৮৮০ ১৩-২৪০৬৯৫৮৩</div>
            <div><strong>ঠিকানা:</strong> চাঁপাইনবাবগঞ্জ, বাংলাদেশ</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

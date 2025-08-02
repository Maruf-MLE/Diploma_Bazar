import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold mb-2 gradient-text">ব্যবহারের শর্তাবলী</h1>
          <p className="text-gray-600 mb-8">সর্বশেষ আপডেট: ১২ জুলাই, ২০২৪</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">ভূমিকা</h2>
            <p className="mb-4">
              বই-চাপা-বাজার ওয়েবসাইট বা অ্যাপ্লিকেশন ব্যবহার করে আপনি এই শর্তাবলী মেনে চলতে সম্মত হন। আমরা যে কোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখি এবং পরিবর্তন করা হলে সেটি এই পৃষ্ঠায় প্রকাশ করা হবে।
            </p>
            <p className="mb-4">
              আমাদের প্ল্যাটফর্ম ব্যবহার করার আগে অনুগ্রহ করে এই শর্তাবলী মনোযোগ সহকারে পড়ুন। আপনি যদি এই শর্তাবলীতে সম্মত না হন, তাহলে আমাদের প্ল্যাটফর্ম ব্যবহার থেকে বিরত থাকুন।
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">অ্যাকাউন্ট এবং নিবন্ধন</h2>
            <p className="mb-3">আমাদের প্ল্যাটফর্মে নিবন্ধন এবং অ্যাকাউন্ট ব্যবহারের জন্য নিম্নলিখিত শর্তাবলী প্রযোজ্য:</p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">১. নিবন্ধন তথ্য</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>নিবন্ধন করার সময় সঠিক, সম্পূর্ণ এবং বর্তমান তথ্য প্রদান করতে হবে।</li>
              <li>আপনার পাসওয়ার্ড গোপন রাখা আপনার দায়িত্ব।</li>
              <li>অন্য ব্যক্তির পরিচয় নিয়ে বা মিথ্যা তথ্য দিয়ে নিবন্ধন করা নিষিদ্ধ।</li>
              <li>১৮ বছরের কম বয়সীদের অভিভাবকের সম্মতি নিয়ে নিবন্ধন করতে হবে।</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-2 mt-4">২. অ্যাকাউন্ট সুরক্ষা</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>আপনার অ্যাকাউন্টে যে কোন ধরনের কার্যকলাপের জন্য আপনি দায়বদ্ধ।</li>
              <li>অনুমতি ছাড়া অন্য কারো অ্যাকাউন্ট ব্যবহার করা নিষিদ্ধ।</li>
              <li>অননুমোদিত প্রবেশের সন্দেহ হলে অবিলম্বে আমাদের জানান।</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">বই লেনদেন সম্পর্কিত নিয়মাবলী</h2>
            <p className="mb-3">আমাদের প্ল্যাটফর্মে বই কেনা-বেচা করার সময় নিম্নলিখিত নিয়মাবলী অনুসরণ করতে হবে:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>কেবল আপনার নিজের অধিকারে থাকা বই বিক্রি করতে পারবেন।</li>
              <li>বইয়ের সঠিক অবস্থা, মূল্য এবং বিবরণ দিতে হবে।</li>
              <li>নিষিদ্ধ সাহিত্য, অবৈধ কপিরাইট লঙ্ঘনকারী বা পাইরেটেড বই বিক্রি করা যাবে না।</li>
              <li>ক্রেতা ও বিক্রেতার মধ্যে লেনদেনের সব দায়িত্ব তাদের নিজেদের।</li>
              <li>বই হস্তান্তরের সময় পারস্পরিক সম্মতিক্রমে নিরাপদ স্থান নির্বাচন করুন।</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">নিষিদ্ধ কার্যকলাপ</h2>
            <p className="mb-3">নিম্নলিখিত কার্যকলাপ সম্পূর্ণরূপে নিষিদ্ধ:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>অশ্লীল, অবমাননাকর, হুমকিপূর্ণ বা হয়রানিমূলক আচরণ।</li>
              <li>অন্যের ব্যক্তিগত তথ্য প্রকাশ করা।</li>
              <li>ভাইরাস বা ক্ষতিকারক কোড আপলোড করা।</li>
              <li>আমাদের সিস্টেমে হ্যাকিং বা অননুমোদিত প্রবেশের চেষ্টা করা।</li>
              <li>প্ল্যাটফর্মের কার্যক্রমে বাধা সৃষ্টি করা বা ওভারলোড করা।</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">বিবাদ নিষ্পত্তি</h2>
            <p className="mb-4">
              ব্যবহারকারীদের মধ্যে বিবাদ দেখা দিলে, আমরা প্রথমে উভয় পক্ষকে নিজেদের মধ্যে সমাধানের পরামর্শ দিই। যদি তা সম্ভব না হয়, তবে আমরা মধ্যস্থতাকারী হিসেবে কাজ করতে পারি, তবে সিদ্ধান্ত বাধ্যতামূলক নয়।
            </p>
            <p className="mb-4">
              বিবাদ নিষ্পত্তির ক্ষেত্রে, বাংলাদেশের আইন প্রযোজ্য হবে এবং আদালতের এখতিয়ার ঢাকার আদালতগুলির মধ্যে সীমাবদ্ধ থাকবে।
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">দায়িত্ব সীমাবদ্ধতা</h2>
            <p className="mb-4">
              বই-চাপা-বাজার কোনো ব্যবহারকারীর আচরণের জন্য দায়ী নয়। আমরা লেনদেনের মধ্যস্থতাকারী হিসেবে কাজ করি না এবং বই বা অর্থের সঠিকতা, গুণমান বা নিরাপত্তার গ্যারান্টি দিই না।
            </p>
            <p className="mb-4">
              আমাদের প্ল্যাটফর্ম ব্যবহার করে যে কোনো ক্ষতির জন্য আমরা দায়ী থাকব না, যদি না তা আমাদের চরম অবহেলার কারণে হয়।
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">ভেরিফিকেশন সিস্টেম</h2>
            <p className="mb-4">
              আমাদের ভেরিফিকেশন সিস্টেম নিরাপদ লেনদেন নিশ্চিত করতে ডিজাইন করা হয়েছে। ভেরিফিকেশনের জন্য আপনাকে বৈধ শিক্ষা প্রতিষ্ঠানের আইডি কার্ড বা সম্পর্কিত ডকুমেন্ট প্রদান করতে হবে।
            </p>
            <p className="mb-4">
              অনুগ্রহ করে মনে রাখবেন যে ভেরিফিকেশন প্রসেস অতিক্রম করতে জাল বা অন্য কারো পরিচয়পত্র ব্যবহার করা আইনত শাস্তিযোগ্য অপরাধ।
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-2xl font-semibold mb-4">যোগাযোগ</h2>
            <p className="mb-4">
              এই শর্তাবলী সম্পর্কে কোনো প্রশ্ন থাকলে, অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন:
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

export default TermsOfService; 
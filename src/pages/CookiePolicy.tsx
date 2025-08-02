import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookiePolicy = () => {
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
          <h1 className="text-3xl font-bold mb-2 gradient-text">কুকি পলিসি</h1>
          <p className="text-gray-600 mb-8">সর্বশেষ আপডেট: ১২ জুলাই, ২০২৪</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">ভূমিকা</h2>
            <p className="mb-4">
              বই-চাপা-বাজার ওয়েবসাইটে আপনার ব্যবহারকারী অভিজ্ঞতা উন্নত করতে আমরা কুকি এবং অনুরূপ প্রযুক্তি ব্যবহার করি। এই কুকি পলিসি ব্যাখ্যা করে কিভাবে আমরা এই প্রযুক্তি ব্যবহার করি এবং আপনি কীভাবে সেগুলি নিয়ন্ত্রণ করতে পারেন।
            </p>
            <p className="mb-4">
              আমাদের ওয়েবসাইট ব্যবহার করে, আপনি এই কুকি পলিসি অনুসারে আপনার ডিভাইসে কুকি সংরক্ষণ করতে সম্মতি দেন।
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">কুকি কী?</h2>
            <p className="mb-4">
              কুকি হল ছোট টেক্সট ফাইল যা আপনার ব্রাউজার আপনার কম্পিউটার বা মোবাইল ডিভাইসে সংরক্ষণ করে যখন আপনি ওয়েবসাইট দেখেন। কুকি আমাদের সাহায্য করে:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>আপনার লগইন সেশন সংরক্ষণ করতে</li>
              <li>ওয়েবসাইটের বিভিন্ন পৃষ্ঠাগুলি মধ্যে আপনার পছন্দ মনে রাখতে</li>
              <li>আপনার অভিজ্ঞতা ব্যক্তিগতকৃত করতে</li>
              <li>ওয়েবসাইটের ব্যবহার পরিসংখ্যান সংগ্রহ করতে</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">আমরা যে কুকি ব্যবহার করি</h2>
            <p className="mb-3">আমাদের ওয়েবসাইটে নিম্নলিখিত ধরনের কুকি ব্যবহার করা হয়:</p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">১. অপরিহার্য কুকি</h3>
            <p className="mb-4">
              এই কুকিগুলি ওয়েবসাইট কার্যকরভাবে চালানোর জন্য অপরিহার্য। এর মধ্যে রয়েছে লগইন সেশন পরিচালনা এবং সুরক্ষিত এলাকায় অ্যাক্সেসের জন্য কুকি। আপনি আপনার ব্রাউজারে এই কুকিগুলি নিষ্ক্রিয় করতে পারেন, তবে তাহলে ওয়েবসাইটের কিছু অংশ কাজ করবে না।
            </p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">২. পারফরম্যান্স কুকি</h3>
            <p className="mb-4">
              এই কুকিগুলি আমাদের কীভাবে ব্যবহারকারীরা ওয়েবসাইট ব্যবহার করে তা বুঝতে সাহায্য করে, যেমন কোন পৃষ্ঠাগুলি সবচেয়ে বেশি দেখা হয়, ত্রুটি বার্তা পাওয়া যায় কিনা ইত্যাদি। এই তথ্য আমাদের ওয়েবসাইট উন্নত করতে সাহায্য করে।
            </p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">৩. ফাংশনাল কুকি</h3>
            <p className="mb-4">
              এই কুকিগুলি আপনার পছন্দ মনে রাখে, যেমন ভাষা নির্বাচন, লগইন তথ্য, এবং ব্যবহারকারী ইন্টারফেস কাস্টমাইজেশন। এগুলি আপনার ব্যবহারের অভিজ্ঞতা উন্নত করতে সাহায্য করে।
            </p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">৪. টার্গেটিং কুকি</h3>
            <p className="mb-4">
              এই কুকিগুলি আপনার ব্রাউজিং অভ্যাস ট্র্যাক করে এবং আপনার আগ্রহের সাথে প্রাসঙ্গিক বিজ্ঞাপন প্রদর্শন করতে ব্যবহৃত হতে পারে। আমরা তৃতীয় পক্ষের বিজ্ঞাপনদাতাদের সাথে এই তথ্য ভাগ করতে পারি।
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">আমরা কিভাবে কুকি ব্যবহার করি</h2>
            <p className="mb-3">আমরা কুকি ব্যবহার করি:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>আপনার লগইন অবস্থা মনে রাখতে, যাতে আপনাকে প্রতিবার পৃষ্ঠায় ফিরে আসার সময় লগইন করতে না হয়</li>
              <li>আপনার পছন্দ এবং সেটিংস মনে রাখতে (যেমন ভাষা, সার্চ ফিল্টার)</li>
              <li>ওয়েবসাইট ব্যবহার পরিসংখ্যান সংগ্রহ করতে</li>
              <li>আপনার জন্য প্রাসঙ্গিক বিজ্ঞাপন প্রদর্শন করতে (যদি প্রযোজ্য হয়)</li>
              <li>আমাদের ওয়েবসাইট উন্নত করতে</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">তৃতীয় পক্ষের কুকি</h2>
            <p className="mb-4">
              আমরা নিম্নলিখিত তৃতীয় পক্ষের সেবা ব্যবহার করি যা আমাদের ওয়েবসাইটে কুকি সেট করতে পারে:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Google Analytics - ওয়েবসাইট ট্রাফিক এবং ব্যবহার পরিসংখ্যান সংগ্রহের জন্য</li>
              <li>Supabase - ব্যবহারকারী অথেন্টিকেশন এবং ডেটা পরিচালনার জন্য</li>
              <li>সোশ্যাল মিডিয়া প্লাটফর্ম - কন্টেন্ট শেয়ার করার সুবিধার জন্য</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">কুকি নিয়ন্ত্রণ</h2>
            <p className="mb-4">
              বেশিরভাগ ওয়েব ব্রাউজার স্বয়ংক্রিয়ভাবে কুকি গ্রহণ করে, তবে আপনি ব্রাউজার সেটিংস সামঞ্জস্য করে কুকি নিয়ন্ত্রণ করতে পারেন। আপনি সমস্ত কুকি ব্লক করতে, আগে থেকে অনুমতি চাইতে, বা পুরানো কুকি মুছতে পারেন।
            </p>
            <p className="mb-4">
              প্রধান ব্রাউজারগুলিতে কুকি সেটিংস পরিবর্তন করার নির্দেশাবলী:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li><strong>Google Chrome:</strong> সেটিংস &gt; প্রাইভেসি এবং সিকিউরিটি &gt; কুকিজ এবং অন্যান্য সাইট ডেটা</li>
              <li><strong>Mozilla Firefox:</strong> মেনু &gt; অপশনস &gt; প্রাইভেসি এবং সিকিউরিটি &gt; কুকি এবং সাইট ডেটা</li>
              <li><strong>Safari:</strong> প্রিফারেন্সেস &gt; প্রাইভেসি &gt; কুকি এবং সাইট ডেটা</li>
              <li><strong>Microsoft Edge:</strong> সেটিংস &gt; সাইট পারমিশনস &gt; কুকি এবং সাইট ডেটা</li>
            </ul>
            <p className="mb-4">
              অনুগ্রহ করে মনে রাখবেন যে কুকি নিষ্ক্রিয় করলে আমাদের ওয়েবসাইটের কিছু বৈশিষ্ট্য সঠিকভাবে কাজ নাও করতে পারে।
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-2xl font-semibold mb-4">যোগাযোগ</h2>
            <p className="mb-4">
              এই কুকি পলিসি সম্পর্কে কোনো প্রশ্ন থাকলে, অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন:
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

export default CookiePolicy; 
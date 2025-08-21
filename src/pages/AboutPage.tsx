import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { BookOpen, Shield, Users, Zap, CheckCircle, Star } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">ডিপ্লোমা বাজার</span> সম্পর্কে
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              ডিপ্লোমা বাজার (Diploma Bazar) হলো বাংলাদেশের প্রথম এবং সবচেয়ে নিরাপদ 
              পলিটেকনিক বুক এক্সচেঞ্জ প্ল্যাটফর্ম। আমাদের লক্ষ্য হলো পলিটেকনিক শিক্ষার্থীদের 
              জন্য বই কেনাবেচা সহজ, নিরাপদ এবং সাশ্রয়ী করা।
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">আমাদের মিশন</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                ডিপ্লোমা বাজারের মূল উদ্দেশ্য হলো বাংলাদেশের সকল পলিটেকনিক শিক্ষার্থীদের 
                একটি নিরাপদ এবং বিশ্বস্ত প্ল্যাটফর্ম প্রদান করা যেখানে তারা সহজেই বই 
                কিনতে এবং বিক্রি করতে পারবেন।
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg bg-blue-50">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">নিরাপত্তা</h3>
                <p className="text-gray-600">
                  ডিপ্লোমা বাজারে AI প্রযুক্তি ব্যবহার করে সকল ব্যবহারকারীর পরিচয় যাচাই করা হয়।
                </p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-green-50">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">কমিউনিটি</h3>
                <p className="text-gray-600">
                  ডিপ্লোমা বাজার একটি বিশাল পলিটেকনিক শিক্ষার্থী কমিউনিটি গড়ে তুলেছে।
                </p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-purple-50">
                <Zap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">দ্রুততা</h3>
                <p className="text-gray-600">
                  ডিপ্লোমা বাজারে মাত্র কয়েক মিনিটেই আপনার প্রয়োজনীয় বই খুঁজে পাবেন।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">কেন ডিপ্লোমা বাজার?</h2>
              <p className="text-lg text-gray-600">
                ডিপ্লোমা বাজার অন্যান্য প্ল্যাটফর্ম থেকে আলাদা কেন?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI যাচাইকরণ</h3>
                  <p className="text-gray-600">
                    ডিপ্লোমা বাজারে প্রতিটি ব্যবহারকারীর পরিচয় AI প্রযুক্তি দিয়ে যাচাই করা হয়।
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">নিরাপদ পেমেন্ট</h3>
                  <p className="text-gray-600">
                    ডিপ্লোমা বাজারে সকল লেনদেন সম্পূর্ণ নিরাপদ এবং সুরক্ষিত।
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">সাশ্রয়ী দাম</h3>
                  <p className="text-gray-600">
                    ডিপ্লোমা বাজারে বই পাবেন বাজারের সবচেয়ে কম দামে।
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">২৪/৭ সাপোর্ট</h3>
                  <p className="text-gray-600">
                    ডিপ্লোমা বাজারের কাস্টমার সাপোর্ট টিম সর্বদা আপনার সেবায় নিয়োজিত।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-12">ডিপ্লোমা বাজারের পরিসংখ্যান</h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">১০০০+</div>
                <div className="text-gray-600">নিবন্ধিত ব্যবহারকারী</div>
              </div>
              
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">৫০০০+</div>
                <div className="text-gray-600">বই বিক্রি হয়েছে</div>
              </div>
              
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">৫০+</div>
                <div className="text-gray-600">পলিটেকনিক ইনস্টিটিউট</div>
              </div>
              
              <div>
                <div className="text-4xl font-bold text-orange-600 mb-2">৯৮%</div>
                <div className="text-gray-600">সন্তুষ্ট গ্রাহক</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
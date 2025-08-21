import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Shield, Zap, Play, CheckCircle, Star, Clock, ArrowRight, Sparkles, TrendingUp, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from 'react-router-dom';

const HeroSection = () => {
  // Use a state variable to store the hero image URL
  const [heroImage, setHeroImage] = useState("https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1287&q=80");
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  
  // In a real app, you would fetch this from your server or API
  // For now, we'll directly use the image that was uploaded
  useEffect(() => {
    // Use the children's book sharing image that was uploaded
    // This would normally be replaced with code to fetch the image from your server
    const childrenBooksImage = "/images/children-books.jpg";
    setHeroImage(childrenBooksImage);
  }, []);

  return (
    <div className="relative border-t-0 min-h-screen" style={{backgroundColor: '#EFF2FF'}}>
      {/* Subtle Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="mt-0" style={{backgroundColor: '#EFF2FF'}}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 pb-4 mb-0">
          {/* Hero Section with Image */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-8 md:pt-16 pb-6 items-center">
            <div className="md:col-span-6 text-left space-y-5 px-3 md:px-5">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                  <span className="gradient-text">ডিপ্লোমা বাজারে</span>
                  <br />
                  <span className="text-foreground">বই কিনুন বিক্রি করুন</span>
                  <br />
                  <span className="text-foreground">সহজেই এবং নিরাপদে</span>
                </h1>
                
                <p className="text-lg text-foreground/80 leading-relaxed max-w-lg font-medium">
                ডিপ্লোমা বাজার (Diploma Bazar) - বই খোঁজার ঝামেলা শেষ! পলিটেকনিক শিক্ষার্থীদের জন্য দেশের প্রথম প্রিমিয়াম বুক এক্সচেঞ্জ প্ল্যাটফর্ম।
                বই খুঁজুন, কিনুন, বিক্রি করুন — সব নিরাপদে।
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/browse">
                  <Button className="primary-button text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                    <BookOpen className="mr-2 h-5 w-5" />
                    বই দেখুন
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  className="glass-button text-base px-8 py-6 rounded-full border border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                  onClick={() => {
                    // Button is clickable but does nothing
                    console.log('Demo video button clicked - but no action taken');
                  }}
                >
                  <Play className="mr-2 h-5 w-5" />
                  ডেমো ভিডিও দেখুন
                </Button>
              </div>
              
              {/* Modern Feature Highlights - Better Positioned */}
              <div className="pt-6 md:pt-8">
                {/* Feature Badges - Single Row with Perfect Fit */}
                <div className="flex justify-center md:justify-start gap-1.5 md:gap-2 w-full max-w-full overflow-visible">
                  <div className="flex items-center gap-1 md:gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1.5 md:px-3 md:py-2 shadow-md md:shadow-lg border border-primary/20 hover:shadow-lg md:hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-white group flex-shrink-0">
                    <div className="relative">
                      <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500 group-hover:scale-110 transition-transform" />
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-gray-800 whitespace-nowrap">AI যাচাইকরণ</span>
                  </div>
                  
                  <div className="flex items-center gap-1 md:gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1.5 md:px-3 md:py-2 shadow-md md:shadow-lg border border-primary/20 hover:shadow-lg md:hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-white group flex-shrink-0">
                    <div className="relative">
                      <Shield className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-gray-800 whitespace-nowrap">নিরাপদ পেমেন্ট</span>
                  </div>
                  
                  {/* Instant message badge - Desktop only */}
                  <div className="hidden md:flex items-center gap-1 md:gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1.5 md:px-3 md:py-2 shadow-md md:shadow-lg border border-primary/20 hover:shadow-lg md:hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-white group flex-shrink-0">
                    <div className="relative">
                      <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-gray-800 whitespace-nowrap">Instant Message</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hero Image with Floating Cards */}
            <div className="md:col-span-6 relative mt-4 md:mt-0 px-3 md:px-5">
              {/* Top Floating Card - Positioned 50% inside, 50% outside */}
              <div className="absolute -top-10 right-16 p-3 bg-white/95 rounded-lg shadow-lg backdrop-blur-sm max-w-[160px] transform -rotate-2 glass-card border border-accent/20 z-20">
                <div className="flex items-start gap-2">
                  <Zap className="h-7 w-7 text-accent mt-1" />
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">সাশ্রয়ী দাম</h3>
                    <p className="text-xs text-foreground/80">সাশ্রয়ী দামে বই কিনুন ও বিক্রি করুন</p>
                  </div>
                </div>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden shadow-2xl glass-card p-2 z-10">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10"></div>
                <img 
                  src={heroImage}
                  alt="বই শেয়ারিং" 
                  className="w-full h-64 md:h-[380px] object-cover rounded-xl"
                />
              </div>
              
              {/* Bottom Floating Card - Positioned 50% inside, 50% outside */}
              <div className="absolute -bottom-10 -left-2 p-3 bg-white/95 rounded-lg shadow-lg backdrop-blur-sm max-w-[160px] transform rotate-3 glass-card border border-primary/20 z-20">
                <div className="flex items-start gap-2">
                  <Shield className="h-7 w-7 text-primary mt-1" />
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">নিরাপদ লেনদেন</h3>
                    <p className="text-xs text-foreground/80">যাচাইকৃত ব্যবহারকারী, ১০০% নিরাপদ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Shield, Zap, Play, CheckCircle, Star, Clock, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
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
                  <span className="gradient-text">বই কিনুন বিক্রি করুন</span>
                  <br />
                  <span className="text-foreground">সাশ্রয়ী দামে</span>
                  <br />
                  <span className="text-foreground">সহজেই এবং নিরাপদে</span>
                </h1>
                
                <p className="text-lg text-foreground/80 leading-relaxed max-w-lg font-medium">
                বই খোঁজার ঝামেলা শেষ,পলিটেকনিক শিক্ষার্থীদের জন্য দেশের প্রথম প্রিমিয়াম বুক এক্সচেঞ্জ।
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
                
                <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="glass-button text-base px-8 py-6 rounded-full border border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                      <Play className="mr-2 h-5 w-5" />
                      <span className="hidden sm:inline">ডেমো ভিডিও দেখুন</span>
                      <span className="sm:hidden">ডেমো ভিডিও</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-full p-0">
                    <DialogHeader className="p-6 pb-0">
                      <DialogTitle className="text-xl font-semibold text-center">
                        বই চাপা বাজার - Demo Video
                      </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 pt-4">
                      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                        {/* আপনি এখানে আপনার video URL দিতে পারেন */}
                        <iframe
                          src="https://www.youtube.com/embed/dQw4w9WgXcQ" // এই URL আপনার actual video URL দিয়ে replace করুন
                          title="বই চাপা বাজার Demo Video"
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          এই ভিডিওতে দেখুন কিভাবে আমাদের প্ল্যাটফর্মে সহজেই বই কিনতে ও বিক্রি করতে পারবেন
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                  
                  {/* Rating system badge - Desktop only */}
                  <div className="hidden md:flex items-center gap-1 md:gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1.5 md:px-3 md:py-2 shadow-md md:shadow-lg border border-primary/20 hover:shadow-lg md:hover:shadow-xl hover:scale-105 transition-all duration-300 hover:bg-white group flex-shrink-0">
                    <div className="relative">
                      <Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                      <Sparkles className="h-1.5 w-1.5 md:h-2 md:w-2 text-yellow-400 absolute -top-0.5 -right-0.5 animate-pulse" />
                    </div>
                    <span className="text-xs md:text-sm font-semibold text-gray-800 whitespace-nowrap">রেটিং সিস্টেম</span>
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
          
          {/* Enhanced CTA Card - Mobile Optimized */}
          <div className="mb-8 md:mb-12 mt-12 md:mt-16 px-3 md:px-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative group">
                {/* Subtle background glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 md:p-10 border border-gray-100 hover:border-primary/20 group-hover:translate-y-[-2px]">
                  <div className="flex flex-col items-center text-center space-y-4 md:space-y-0 md:flex-row md:text-left md:gap-8">
                    {/* Left side - Icon and main content */}
                    <div className="flex-1 w-full">
                      {/* Mobile Layout - Vertical */}
                      <div className="block md:hidden space-y-4">
                        {/* Icon */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-primary/15 group-hover:to-accent/15 transition-all duration-300">
                              <BookOpen className="h-6 w-6 text-primary group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5">
                              <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center opacity-90">
                                <TrendingUp className="h-2 w-2 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Title and subtitle */}
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors duration-300 flex items-center justify-center gap-2">
                            আপনার বইও বিক্রি করুন
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                          </h3>
                          <p className="text-sm text-gray-600 font-medium leading-relaxed">৩ মিনিটেই লিস্ট করুন, দ্রুত বিক্রি করুন</p>
                        </div>
                        
                        {/* Feature highlights - Mobile */}
                        <div className="flex flex-wrap justify-center gap-2">
                          <div className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full border border-green-200 transition-colors duration-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-700 font-semibold">সর্বোচ্চ দাম পান</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200 transition-colors duration-200">
                            <Shield className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-700 font-semibold">নিরাপদ পেমেন্ট</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Desktop Layout - Horizontal */}
                      <div className="hidden md:block">
                        <div className="flex items-center justify-start gap-4 mb-4">
                          <div className="relative">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-primary/15 group-hover:to-accent/15 transition-all duration-300">
                              <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-primary group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <div className="absolute -top-1 -right-1">
                              <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center opacity-90">
                                <TrendingUp className="h-2.5 w-2.5 text-white" />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3 group-hover:text-primary transition-colors duration-300">
                              আপনার বইও বিক্রি করুন
                              <Sparkles className="h-6 w-6 text-yellow-500" />
                            </h3>
                            <p className="text-lg md:text-xl text-gray-600 font-medium">৩ মিনিটেই লিস্ট করুন, দ্রুত বিক্রি করুন</p>
                          </div>
                        </div>
                        
                        {/* Feature highlights - Desktop */}
                        <div className="flex flex-wrap justify-start gap-4 md:gap-6 mb-6">
                          <div className="flex items-center gap-2 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-full border border-green-200 transition-colors duration-200">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                            <span className="text-sm md:text-base text-green-700 font-semibold">সর্বোচ্চ দাম পান</span>
                          </div>
                          <div className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full border border-blue-200 transition-colors duration-200">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span className="text-sm md:text-base text-blue-700 font-semibold">নিরাপদ পেমেন্ট</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* CTA Button - Responsive */}
                    <div className="w-full md:w-auto md:flex-shrink-0">
                      <Link to="/sell-book" className="block w-full">
                        <Button className="w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 md:px-10 md:py-5 text-base md:text-xl rounded-lg md:rounded-xl group font-bold hover:scale-105">
                          <span className="mr-2 md:mr-3">শুরু করুন</span>
                          <ArrowRight className="h-4 w-4 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform duration-300" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Clean bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-b-xl md:rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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

import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Shield, Zap, Play } from 'lucide-react';
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
              
              {/* Trust Badges */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-bold gradient-text">১০K+</p>
                  <p className="text-sm text-foreground/60">ব্যবহারকারী</p>
                </div>
                <div className="h-10 border-r border-gray-200"></div>
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-bold gradient-text">৫০K+</p>
                  <p className="text-sm text-foreground/60">বই বিক্রি</p>
                </div>
                <div className="h-10 border-r border-gray-200"></div>
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-bold gradient-text">৯৮%</p>
                  <p className="text-sm text-foreground/60">সন্তুষ্টি</p>
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
          
          {/* Feature Cards - Modern Design */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-8 mb-12 mt-16">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-8 relative overflow-hidden group">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-bl-full opacity-50"></div>
              
              {/* Icon with glow effect */}
              <div className="relative mb-3 md:mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg scale-150 group-hover:scale-175 transition-transform duration-500"></div>
                <div className="relative p-2 md:p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full w-fit">
                  <Shield className="h-6 w-6 md:h-10 md:w-10 text-primary" />
                </div>
              </div>
              
              <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-2 md:mb-3 group-hover:text-primary transition-colors text-center md:text-left">ID যাচাইকরণ</h3>
              <p className="text-xs md:text-base text-gray-600 leading-relaxed text-center md:text-left">
                স্টুডেন্ট আইডি স্বয়ংক্রিয় যাচাই করে নিরাপত্তা নিশ্চিত করি
              </p>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </div>
            
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-8 relative overflow-hidden group">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-bl-full opacity-50"></div>
              
              {/* Icon with glow effect */}
              <div className="relative mb-3 md:mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg scale-150 group-hover:scale-175 transition-transform duration-500"></div>
                <div className="relative p-2 md:p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-full w-fit">
                  <Users className="h-6 w-6 md:h-10 md:w-10 text-primary" />
                </div>
              </div>
              
              <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-2 md:mb-3 group-hover:text-primary transition-colors text-center md:text-left">নিরাপদ কমিউনিটি</h3>
              <p className="text-xs md:text-base text-gray-600 leading-relaxed text-center md:text-left">
                শুধুমাত্র যাচাইকৃত ছাত্রছাত্রীদের মধ্যে বই লেনদেন
              </p>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;

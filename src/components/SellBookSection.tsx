import React from 'react';
import { BookOpen, Shield, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const SellBookSection = () => {
  return (
    <div className="py-16 md:py-20" style={{backgroundColor: '#f5f5ffff'}}>
      {/* Subtle Background Elements */}
      <div className="relative">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          {/* Enhanced CTA Card - Mobile Optimized */}
          <div className="max-w-4xl mx-auto px-3 md:px-0">
            <div className="relative group">
              {/* Subtle background glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 md:p-10 border border-gray-100 hover:border-blue-500/20 group-hover:translate-y-[-2px]">
                <div className="flex flex-col items-center text-center space-y-4 md:space-y-0 md:flex-row md:text-left md:gap-8">
                  {/* Left side - Icon and main content */}
                  <div className="flex-1 w-full">
                    {/* Mobile Layout - Vertical */}
                    <div className="block md:hidden space-y-4">
                      {/* Icon */}
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-blue-500/15 group-hover:to-purple-500/15 transition-all duration-300">
                            <BookOpen className="h-6 w-6 text-blue-600 group-hover:scale-105 transition-transform duration-300" />
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
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 flex items-center justify-center gap-2">
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
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-blue-500/15 group-hover:to-purple-500/15 transition-all duration-300">
                            <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-blue-600 group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="absolute -top-1 -right-1">
                            <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center opacity-90">
                              <TrendingUp className="h-2.5 w-2.5 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3 group-hover:text-blue-600 transition-colors duration-300">
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
                      <Button className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 md:px-10 md:py-5 text-base md:text-xl rounded-lg md:rounded-xl group font-bold hover:scale-105">
                        <span className="mr-2 md:mr-3">শুরু করুন</span>
                        <ArrowRight className="h-4 w-4 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Clean bottom accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-b-xl md:rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellBookSection;

import React from 'react';
import { UserPlus, BookOpen, MessageCircle, ShoppingBag } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      icon: UserPlus,
      title: 'অ্যাকাউন্ট তৈরি করুন',
      description: 'রেজিস্ট্রেশন করুন এবং আপনার স্টুডেন্ট আইডি দিয়ে যাচাইকরণ সম্পন্ন করুন',
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-600',
      number: '১'
    },
    {
      icon: BookOpen,
      title: 'বই পোস্ট করুন',
      description: 'আপনার বইয়ের বিবরণ, ছবি এবং দাম সহ পোস্ট করুন বা অন্যের পোস্ট করা বই ব্রাউজ করুন',
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-600',
      number: '২'
    },
    {
      icon: MessageCircle,
      title: 'যোগাযোগ করুন',
      description: 'আগ্রহী ক্রেতা বা বিক্রেতার সাথে চ্যাট করুন এবং দাম নিয়ে আলোচনা করুন',
      color: 'from-green-500/20 to-green-600/20',
      iconColor: 'text-green-600',
      number: '৩'
    },
    {
      icon: ShoppingBag,
      title: 'লেনদেন সম্পন্ন করুন',
      description: 'দেখা করে বই হস্তান্তর করুন এবং লেনদেন সম্পন্ন করুন',
      color: 'from-amber-500/20 to-amber-600/20',
      iconColor: 'text-amber-600',
      number: '৪'
    }
  ];

  return (
    <section className="py-16 relative overflow-hidden bg-gray-50">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">কিভাবে কাজ করে</span>
          </h2>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            আমাদের প্ল্যাটফর্মে বই কেনা-বেচা করা অত্যন্ত সহজ। নিচের ধাপগুলো অনুসরণ করুন।
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative group"
            >
              {/* Connecting line between cards */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -translate-y-1/2 z-0" />
              )}
              
              {/* Card */}
              <div className="glass-card-modern backdrop-blur-sm bg-white/80 rounded-xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 h-full flex flex-col relative z-10 group-hover:border-primary/30 overflow-hidden">
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>
                
                {/* Step number */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity duration-500">
                  <span className="text-4xl font-bold text-primary/40 translate-x-[-8px] translate-y-[8px]">
                    {step.number}
                  </span>
                </div>
                
                {/* Icon */}
                <div className={`p-3 rounded-full bg-gradient-to-br ${step.color} mb-5 w-14 h-14 flex items-center justify-center`}>
                  <step.icon className={`h-7 w-7 ${step.iconColor}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 text-sm flex-grow">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection; 
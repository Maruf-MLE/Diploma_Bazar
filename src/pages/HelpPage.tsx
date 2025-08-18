import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Search, BookOpen, ShoppingCart, MessageCircle, User, HelpCircle, AlertCircle, ShieldCheck, SendHorizontal, Facebook } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

export default function HelpPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("faq");
  
  // Form states for contact form
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !subject || !message) {
      toast({
        title: "সকল ফিল্ড পূরণ করুন",
        description: "অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য দিন",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate form submission with setTimeout
    setTimeout(() => {
      toast({
        title: "মেসেজ পাঠানো হয়েছে",
        description: "আমরা আপনার সাথে শীঘ্রই যোগাযোগ করব",
      });
      
      // Reset form
      setSubject("");
      setMessage("");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <HelpCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">সাহায্য ও সহযোগিতা কেন্দ্র</h1>
          <p className="text-gray-500 mt-2 max-w-lg">
            আপনার যেকোনো প্রশ্নের উত্তর এবং ডিপ্লোমা বাজার প্ল্যাটফর্ম সম্পর্কে সহায়তা পেতে এখানে আছে
          </p>
          
          {/* Search bar */}
          <div className="relative w-full max-w-md mt-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="সাহায্য খুঁজুন..." 
              className="pl-10 pr-4 py-6 rounded-full border-2 border-gray-200 focus:border-primary" 
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="border border-gray-200 rounded-lg p-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">সাধারণ প্রশ্নোত্তর</TabsTrigger>
            <TabsTrigger value="guides">ব্যবহার নির্দেশিকা</TabsTrigger>
            <TabsTrigger value="contact">যোগাযোগ করুন</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq" className="p-4">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">সাধারণ জিজ্ঞাসা</h2>
              
              <Accordion type="single" collapsible className="w-full border rounded-lg">
                <AccordionItem value="item-1" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">বই ডিপ্লোমা বাজার কিভাবে কাজ করে?</AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <p className="text-gray-600">
                      আমাদের ডিপ্লোমা বাজার শিক্ষার্থীদের মধ্যে বই কেনাবেচা সহজ করে। বিক্রেতারা তাদের ব্যবহৃত বই তালিকাভুক্ত করতে পারেন, 
                      এবং ক্রেতারা সহজেই সেগুলি খুঁজে পেতে পারেন। আপনি বই বিক্রি করার জন্য 'বই বিক্রি করুন' বাটনে ক্লিক করুন, 
                      অথবা বই খুঁজতে 'বই খুঁজুন' বিভাগে যান।
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">কিভাবে রেজিস্ট্রেশন করব?</AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <p className="text-gray-600">
                      রেজিস্ট্রেশন করতে, হোমপেজে 'রেজিস্টার করুন' বাটনে ক্লিক করুন। আপনার ইমেইল, পাসওয়ার্ড এবং 
                      প্রয়োজনীয় ব্যক্তিগত তথ্য দিন। নিশ্চিতকরণ ইমেইলে ক্লিক করে আপনার অ্যাকাউন্ট সক্রিয় করুন।
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">ভেরিফিকেশন কেন প্রয়োজন?</AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <p className="text-gray-600">
                      আমরা শিক্ষার্থীদের মধ্যে নিরাপদ লেনদেন নিশ্চিত করতে ভেরিফিকেশন ব্যবহার করি। এটি আমাদের 
                      প্ল্যাটফর্মে প্রতারণা এবং ভুয়া অ্যাকাউন্ট প্রতিরোধ করতে সাহায্য করে। ভেরিফিকেশন প্রক্রিয়া 
                      সম্পন্ন করতে আপনার শিক্ষাপ্রতিষ্ঠানের তথ্য এবং একটি ছবি প্রয়োজন।
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">আমি কিভাবে বই বিক্রি করব?</AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <p className="text-gray-600">
                      বই বিক্রি করতে, প্রথমে লগইন করুন এবং 'বই বিক্রি করুন' বিভাগে যান। বইয়ের বিবরণ, মূল্য, ছবি এবং 
                      অবস্থা সম্পর্কে তথ্য দিন। আপনার তালিকা সম্পূর্ণ করার পর, আগ্রহী ক্রেতারা আপনার সাথে যোগাযোগ করতে পারবেন।
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5" className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">আমি কিভাবে অন্য ব্যবহারকারীদের সাথে যোগাযোগ করব?</AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <p className="text-gray-600">
                      যেকোনো বইয়ের পাতায় 'বিক্রেতার সাথে যোগাযোগ করুন' বাটনে ক্লিক করে আপনি বিক্রেতার সাথে যোগাযোগ করতে পারেন। 
                      আপনি আপনার মেসেজিং ইনবক্সে সমস্ত কথোপকথন পরিচালনা করতে পারেন, যা আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখে।
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">আমার অ্যাকাউন্টের তথ্য কিভাবে পরিবর্তন করব?</AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <p className="text-gray-600">
                      আপনার প্রোফাইল তথ্য পরিবর্তন করতে, 'প্রোফাইল' পেজে যান এবং 'প্রোফাইল সম্পাদনা' বিকল্পে ক্লিক করুন। 
                      আপনার পাসওয়ার্ড বা ইমেইল পরিবর্তন করতে, 'সেটিংস' পেজে যান এবং প্রয়োজনীয় তথ্য আপডেট করুন।
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
          
          <TabsContent value="guides" className="p-4">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">ব্যবহার নির্দেশিকা</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <Card className="border-2 border-gray-200">
                  <CardHeader className="pb-3 border-b border-gray-100">
                    <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>অ্যাকাউন্ট পরিচালনা</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">১</span>
                        <span>প্রোফাইল পেজে আপনার তথ্য আপডেট করুন</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">২</span>
                        <span>সেটিংসে গিয়ে ইমেইল বা পাসওয়ার্ড পরিবর্তন করুন</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">৩</span>
                        <span>ভেরিফিকেশন পেজে প্রয়োজনীয় তথ্য দিয়ে আপনার অ্যাকাউন্ট যাচাই করুন</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-gray-200">
                  <CardHeader className="pb-3 border-b border-gray-100">
                    <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>বই বিক্রি করা</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">১</span>
                        <span>'বই বিক্রি করুন' বাটনে ক্লিক করুন</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">২</span>
                        <span>বইয়ের বিবরণ, মূল্য ও অবস্থা সম্পর্কে তথ্য দিন</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">৩</span>
                        <span>বইয়ের ভালো মানের ছবি আপলোড করুন</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">৪</span>
                        <span>'সাবমিট' বাটনে ক্লিক করে আপনার বই তালিকাভুক্ত করুন</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-gray-200">
                  <CardHeader className="pb-3 border-b border-gray-100">
                    <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>বই কেনা</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">১</span>
                        <span>বই ব্রাউজ পেজে যান</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">২</span>
                        <span>সার্চ বা ফিল্টার ব্যবহার করে বই খুঁজুন</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">৩</span>
                        <span>বিক্রেতার সাথে যোগাযোগ করুন বাটনে ক্লিক করুন</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">৪</span>
                        <span>বইয়ের জন্য কেনার অনুরোধ পাঠান</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-gray-200">
                  <CardHeader className="pb-3 border-b border-gray-100">
                    <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>মেসেজিং ব্যবহার</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">১</span>
                        <span>'মেসেজ' বাটনে ক্লিক করে মেসেজিং পেজে যান</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">২</span>
                        <span>আপনার আলোচনা তালিকা থেকে একটি নির্বাচন করুন</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">৩</span>
                        <span>মেসেজ লিখে 'প্রেরণ' বাটনে ক্লিক করুন</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">৪</span>
                        <span>বই ক্রয়/বিক্রয়ের বিষয়ে আলোচনা করুন</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-gray-200 md:col-span-2">
                  <CardHeader className="pb-3 border-b border-gray-100">
                    <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>নিরাপদ লেনদেন</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        আমরা ব্যবহারকারীদের মধ্যে নিরাপদ লেনদেন নিশ্চিত করতে সর্বদা সতর্কতা অবলম্বন করার পরামর্শ দিই:
                      </p>
                      
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start">
                          <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">১</span>
                          <span>সর্বদা জনসমাগমপূর্ণ স্থানে সাক্ষাৎ করে লেনদেন করুন</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">২</span>
                          <span>বই দেখে তারপর টাকা প্রদান করুন</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">৩</span>
                          <span>কখনোই আগে থেকে অর্থ প্রেরণ করবেন না</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">৪</span>
                          <span>সন্দেহজনক লেনদেন অবিলম্বে রিপোর্ট করুন</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">৫</span>
                          <span>শুধুমাত্র আমাদের প্ল্যাটফর্মের মেসেজিং সিস্টেম ব্যবহার করে যোগাযোগ করুন</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="contact" className="p-4">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">যোগাযোগ করুন</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-4">
                <div className="space-y-4">
                  <Card className="border-2 border-gray-200">
                    <CardHeader className="pb-3 border-b border-gray-100">
                      <CardTitle>আমাদের ফেসবুক পেজে যোগাযোগ করুন</CardTitle>
                      <CardDescription>দ্রুত উত্তর পেতে আমাদের ফেসবুক পেজে মেসেজ দিন</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="text-center space-y-4">
                        <div className="bg-[#1877F2]/10 p-6 rounded-lg">
                          <Facebook className="h-12 w-12 text-[#1877F2] mx-auto mb-3" />
                          <p className="text-gray-700 mb-4">
                            আমাদের ফেসবুক পেজে মেসেজ দিয়ে আপনার প্রশ্ন বা সমস্যা জানান। আমরা দ্রুততম সময়ে উত্তর দেব।
                          </p>
                          <a 
                            href="https://www.facebook.com/boichapabazar" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center justify-center gap-2 bg-[#1877F2] text-white px-6 py-3 rounded-md hover:bg-[#166FE5] transition-colors w-full"
                          >
                            <Facebook className="h-5 w-5" />
                            <span>ফেসবুক পেজে যান</span>
                          </a>
                        </div>
                        
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-gray-600 mb-2">অথবা সরাসরি আমাদের পেজে মেসেজ করুন</p>
                          <a 
                            href="https://m.me/boichapabazar" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-[#1877F2] text-[#1877F2] px-6 py-2 rounded-md hover:bg-[#1877F2]/5 transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>মেসেঞ্জারে মেসেজ দিন</span>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">দ্রুত প্রশ্নোত্তরের জন্য</h3>
                    <p className="text-gray-600">
                      আমাদের সাধারণ প্রশ্নোত্তর বিভাগে দেখুন, আপনার প্রশ্নের উত্তর সেখানে থাকতে পারে
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-2 border-gray-200 hover:border-primary hover:bg-primary/5 mt-2"
                      onClick={() => setActiveTab("faq")}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      সাধারণ প্রশ্নোত্তর দেখুন
                    </Button>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-medium">জরুরি সহায়তা</h3>
                    <p className="text-gray-600">
                      সাইবার নিরাপত্তা সমস্যা, অনুপযুক্ত আচরণ, বা জরুরি বিষয়ে অবিলম্বে আমাদের সাথে যোগাযোগ করুন
                    </p>
                    <div className="mt-2 p-4 bg-red-50 border border-red-100 rounded-md">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <h4 className="font-medium text-red-600">জরুরি সহায়তা লাইন</h4>
                      </div>
                      <p className="text-red-600 text-sm mt-1">ফেসবুক পেজ: <a href="https://www.facebook.com/boichapabazar" target="_blank" rel="noopener noreferrer" className="underline">facebook.com/boichapabazar</a></p>
                      
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-medium">আমাদের সম্পর্কে</h3>
                    <p className="text-gray-600">
                      বই ডিপ্লোমা বাজার হল বাংলাদেশের শিক্ষার্থীদের মধ্যে বই আদান-প্রদান সহজ করার একটি প্ল্যাটফর্ম। 
                      আমরা শিক্ষার্থীদের মধ্যে নিরাপদ ও সহজ উপায়ে ব্যবহৃত বই কেনাবেচা করার সুযোগ তৈরি করি।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
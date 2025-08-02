import React from 'react';
import { BookOpen, Facebook, Twitter, Instagram, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-6 py-12 lg:px-8">
          {/* Brand Section */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-7 w-7 text-primary" />
              <span className="text-2xl font-bold gradient-text">
                বুক এক্সচেঞ্জ
              </span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              বাংলাদেশের সবচেয়ে নিরাপদ এবং জনপ্রিয় স্টুডেন্ট বুক এক্সচেঞ্জ প্ল্যাটফর্ম। 
              AI প্রযুক্তির সাহায্যে নিশ্চিত করি সম্পূর্ণ নিরাপত্তা এবং সেরা অভিজ্ঞতা।
            </p>
            
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center hover:bg-primary/10 transition-colors shadow-sm">
                <Facebook className="h-5 w-5 text-gray-600" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center hover:bg-primary/10 transition-colors shadow-sm">
                <Twitter className="h-5 w-5 text-gray-600" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center hover:bg-primary/10 transition-colors shadow-sm">
                <Instagram className="h-5 w-5 text-gray-600" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-foreground">দ্রুত লিংক</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/browse" className="text-gray-600 hover:text-primary transition-colors flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>বই খুঁজুন</span>
                </Link>
              </li>
              <li>
                <Link to="/sell" className="text-gray-600 hover:text-primary transition-colors flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>বই বিক্রি করুন</span>
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-600 hover:text-primary transition-colors flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>আমার অ্যাকাউন্ট</span>
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>সাহায্য কেন্দ্র</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Departments (Previously Categories) */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-foreground">বিভাগ</h3>
            <ul className="space-y-3">
              <li>
                <Link to="http://localhost:8080/browse?department=%E0%A6%95%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%BF%E0%A6%89%E0%A6%9F%E0%A6%BE%E0%A6%B0+%E0%A6%87%E0%A6%9E%E0%A7%8D%E0%A6%9C%E0%A6%BF%E0%A6%A8%E0%A6%BF%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%B0%E0%A6%BF%E0%A6%82" className="text-gray-600 hover:text-primary transition-colors flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>কম্পিউটার</span>
                </Link>
              </li>
              <li>
                <Link to="http://localhost:8080/browse?department=%E0%A6%B8%E0%A6%BF%E0%A6%AD%E0%A6%BF%E0%A6%B2+%E0%A6%87%E0%A6%9E%E0%A7%8D%E0%A6%9C%E0%A6%BF%E0%A6%A8%E0%A6%BF%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%B0%E0%A6%BF%E0%A6%82" className="text-gray-600 hover:text-primary transition-colors flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>সিভিল</span>
                </Link>
              </li>
              <li>
                <Link to="http://localhost:8080/browse?department=%E0%A6%87%E0%A6%B2%E0%A7%87%E0%A6%95%E0%A6%9F%E0%A7%8D%E0%A6%B0%E0%A6%BF%E0%A6%95%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%B2+%E0%A6%87%E0%A6%9E%E0%A7%8D%E0%A6%9C%E0%A6%BF%E0%A6%A8%E0%A6%BF%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%B0%E0%A6%BF%E0%A6%82" className="text-gray-600 hover:text-primary transition-colors flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>ইলেকট্রিক্যাল</span>
                </Link>
              </li>
              <li>
                <Link to="/all-departments" className="text-gray-600 hover:text-primary transition-colors flex items-center">
                  <ChevronRight className="h-3 w-3 mr-1" />
                  <span>সকল বিভাগ</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-3">
            <h3 className="text-lg font-semibold mb-4 text-foreground">যোগাযোগ</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-gray-600">
                <div className="h-8 w-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm">
                  <Mail className="h-4 w-4 text-gray-600" />
                </div>
                <span>support@bookexchange.bd</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-600">
                <div className="h-8 w-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm">
                  <Phone className="h-4 w-4 text-gray-600" />
                </div>
                <span>+৮৮০ ১৩-২৪০৬৯৫৮৩</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-600">
                <div className="h-8 w-8 rounded-full bg-white/70 flex items-center justify-center shadow-sm">
                  <MapPin className="h-4 w-4 text-gray-600" />
                </div>
                <span>চাঁপাইনবাবগঞ্জ, বাংলাদেশ</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Subscription - Changed to Facebook Follow */}
        <div className="border-t border-gray-100 px-6 py-8 lg:px-8 bg-white/50 backdrop-blur-sm">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-lg font-semibold mb-2">আমাদের ফেসবুক পেজ ফলো করুন</h3>
            <p className="text-gray-600 mb-4">নতুন বইয়ের আপডেট এবং বিশেষ অফার পেতে</p>
            <div className="flex justify-center">
              <a 
                href="https://www.facebook.com/boichapabazar" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center bg-[#1877F2] text-white px-6 py-2 rounded-md hover:bg-[#166FE5] transition-colors"
              >
                <Facebook className="h-5 w-5 mr-2" />
                পেজ ফলো করুন
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 px-6 py-5 lg:px-8 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm mb-4 md:mb-0">
              © ২০২৪ বুক এক্সচেঞ্জ। সমস্ত অধিকার সংরক্ষিত।
            </div>
            <div className="flex space-x-6 text-sm">
              <Link to="/privacy-policy" className="text-gray-600 hover:text-primary transition-colors">
                গোপনীয়তা নীতি
              </Link>
              <Link to="/terms-of-service" className="text-gray-600 hover:text-primary transition-colors">
                ব্যবহারের শর্তাবলী
              </Link>
              <Link to="/cookie-policy" className="text-gray-600 hover:text-primary transition-colors">
                কুকি পলিসি
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

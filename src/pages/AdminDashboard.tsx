import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, ClipboardCheck, LayoutDashboard, AlertTriangle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            এডমিন ড্যাশবোর্ড
          </h1>
          <p className="text-gray-600 mt-1">সাইট ম্যানেজমেন্ট ও এডমিনিস্ট্রেশন</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ভেরিফিকেশন ম্যানেজমেন্ট */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                ভেরিফিকেশন ম্যানেজমেন্ট
              </CardTitle>
              <CardDescription>
                ব্যবহারকারীদের ভেরিফিকেশন ডেটা দেখুন এবং অনুমোদন করুন
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                এখান থেকে আপনি ব্যবহারকারীদের এডমিট কার্ড এবং ফেইস ভেরিফিকেশন যাচাই করতে পারবেন।
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/admin/verification">
                  দেখুন
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* ইউজার ম্যানেজমেন্ট */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                ইউজার ম্যানেজমেন্ট
              </CardTitle>
              <CardDescription>
                ব্যবহারকারীদের অ্যাকাউন্ট পরিচালনা করুন
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                ব্যবহারকারীদের লিস্ট দেখুন, অ্যাকাউন্ট স্ট্যাটাস আপডেট করুন এবং পারমিশন পরিবর্তন করুন।
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link to="/admin/users">
                  দেখুন
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* রিপোর্ট ম্যানেজমেন্ট - New Card */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                রিপোর্ট ম্যানেজমেন্ট
              </CardTitle>
              <CardDescription>
                ইউজার রিপোর্ট দেখুন এবং পরিচালনা করুন
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                ব্যবহারকারীদের রিপোর্ট দেখুন, পর্যালোচনা করুন এবং প্রয়োজনে ব্যবহারকারীদের ব্যান করুন।
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link to="/admin/reports">
                  দেখুন
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* ড্যাশবোর্ড ও অ্যানালিটিক্স */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                ড্যাশবোর্ড ও অ্যানালিটিক্স
              </CardTitle>
              <CardDescription>
                সাইটের পারফরম্যান্স ও স্ট্যাটিসটিক্স দেখুন
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                ট্র্যাফিক, রেজিস্ট্রেশন, ভেরিফিকেশন এবং অন্যান্য মেট্রিক্সের অ্যানালিটিক্স দেখুন।
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link to="/admin/analytics">
                  দেখুন
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 
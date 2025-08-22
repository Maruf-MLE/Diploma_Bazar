import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('email');
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Handle email change
  const handleEmailChange = async (e) => {
    e.preventDefault();
    
    // Reset states
    setEmailError('');
    setEmailSuccess('');
    
    // Validation
    if (!newEmail) {
      setEmailError('নতুন ইমেইল দিন');
      return;
    }
    
    if (!currentPasswordForEmail) {
      setEmailError('বর্তমান পাসওয়ার্ড দিন');
      return;
    }
    
    try {
      setIsUpdatingEmail(true);
      
      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPasswordForEmail,
      });
      
      if (signInError) {
        setEmailError('বর্তমান পাসওয়ার্ড সঠিক নয়');
        setIsUpdatingEmail(false);
        return;
      }
      
      // Update email
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });
      
      if (error) {
        throw error;
      }
      
      setEmailSuccess('ইমেইল পরিবর্তন করার জন্য একটি নিশ্চিতকরণ লিঙ্ক পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইমেইল চেক করুন।');
      setNewEmail('');
      setCurrentPasswordForEmail('');
      
      toast({
        title: "ইমেইল পরিবর্তনের অনুরোধ পাঠানো হয়েছে",
        description: "নতুন ইমেইল নিশ্চিত করতে আপনার ইমেইল চেক করুন",
      });
    } catch (error) {
      console.error('Error updating email:', error);
      setEmailError(error.message || 'ইমেইল পরিবর্তন করতে সমস্যা হয়েছে');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Reset states
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validation
    if (!currentPassword) {
      setPasswordError('বর্তমান পাসওয়ার্ড দিন');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('নতুন পাসওয়ার্ড দিন');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না');
      return;
    }
    
    try {
      setIsUpdatingPassword(true);
      
      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (signInError) {
        setPasswordError('বর্তমান পাসওয়ার্ড সঠিক নয়');
        setIsUpdatingPassword(false);
        return;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        throw error;
      }
      
      setPasswordSuccess('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: "পাসওয়ার্ড পরিবর্তন সফল",
        description: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে",
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError(error.message || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow pt-24 pb-16 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">সেটিংস</h1>
            <p>সেটিংস দেখতে লগইন করুন</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">সেটিংস</h1>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="email" className="text-base py-3">
                  <Mail className="mr-2 h-4 w-4" />
                  ইমেইল পরিবর্তন
                </TabsTrigger>
                <TabsTrigger value="password" className="text-base py-3">
                  <Lock className="mr-2 h-4 w-4" />
                  পাসওয়ার্ড পরিবর্তন
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="email">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle>ইমেইল পরিবর্তন করুন</CardTitle>
                    <CardDescription>
                      আপনার অ্যাকাউন্টের ইমেইল ঠিকানা পরিবর্তন করতে এই ফর্মটি ব্যবহার করুন
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {emailError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>ত্রুটি</AlertTitle>
                        <AlertDescription>
                          {emailError}
                          <div className="mt-2 text-xs">
                            সমস্যা থাকলে{" "}
                            <a href="https://www.facebook.com/diplomabazar/" target="_blank" rel="noopener noreferrer" className="underline">
                              সাহায্য নিন
                            </a>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {emailSuccess && (
                      <Alert className="mb-4 bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-600">সফল</AlertTitle>
                        <AlertDescription className="text-green-600">{emailSuccess}</AlertDescription>
                      </Alert>
                    )}
                    
                    <form onSubmit={handleEmailChange} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="current-email" className="block text-sm font-medium">
                          বর্তমান ইমেইল
                        </label>
                        <Input
                          id="current-email"
                          value={user?.email || ''}
                          disabled
                          className="w-full bg-gray-50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="new-email" className="block text-sm font-medium">
                          নতুন ইমেইল
                        </label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="আপনার নতুন ইমেইল দিন"
                          className="w-full"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="current-password-email" className="block text-sm font-medium">
                          বর্তমান পাসওয়ার্ড
                        </label>
                        <Input
                          id="current-password-email"
                          type="password"
                          value={currentPasswordForEmail}
                          onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                          placeholder="নিরাপত্তার জন্য আপনার বর্তমান পাসওয়ার্ড দিন"
                          className="w-full"
                          required
                        />
                      </div>
                    
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isUpdatingEmail}
                      >
                        {isUpdatingEmail ? 'অপেক্ষা করুন...' : 'ইমেইল পরিবর্তন করুন'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="password">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle>পাসওয়ার্ড পরিবর্তন করুন</CardTitle>
                    <CardDescription>
                      আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করতে এই ফর্মটি ব্যবহার করুন
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {passwordError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>ত্রুটি</AlertTitle>
                        <AlertDescription>
                          {passwordError}
                          <div className="mt-2 text-xs">
                            সমস্যা থাকলে{" "}
                            <a href="https://www.facebook.com/diplomabazar/" target="_blank" rel="noopener noreferrer" className="underline">
                              সাহায্য নিন
                            </a>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {passwordSuccess && (
                      <Alert className="mb-4 bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-600">সফল</AlertTitle>
                        <AlertDescription className="text-green-600">{passwordSuccess}</AlertDescription>
                      </Alert>
                    )}
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="current-password" className="block text-sm font-medium">
                          বর্তমান পাসওয়ার্ড
                        </label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="আপনার বর্তমান পাসওয়ার্ড দিন"
                          className="w-full"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="new-password" className="block text-sm font-medium">
                          নতুন পাসওয়ার্ড
                        </label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="আপনার নতুন পাসওয়ার্ড দিন"
                          className="w-full"
                          required
                          minLength={6}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="confirm-password" className="block text-sm font-medium">
                          নতুন পাসওয়ার্ড নিশ্চিত করুন
                        </label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="নতুন পাসওয়ার্ড আবার দিন"
                          className="w-full"
                          required
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isUpdatingPassword}
                      >
                        {isUpdatingPassword ? 'অপেক্ষা করুন...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage; 
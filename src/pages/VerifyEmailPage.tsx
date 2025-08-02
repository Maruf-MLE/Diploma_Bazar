import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Mail, RefreshCw, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const [searchParams] = useSearchParams();
  const { user, emailVerified, checkEmailVerified, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  // কাউন্টডাউন টাইমার ফাংশন
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ইউজার ইমেইল ভেরিফিকেশন স্ট্যাটাস চেক করা
  const checkVerificationStatus = async () => {
    setLoading(true);
    try {
      // URL থেকে পারামিটার চেক করি
      const error = searchParams.get("error");
      const status = searchParams.get("status");
      
      // ডিবাগিং লগ
      console.log("URL search params:", Object.fromEntries([...searchParams.entries()]));
      
      // EmailConfirmationPage থেকে আসা প্যারামিটার চেক করি
      if (status === "success") {
        console.log("Email verification successful from redirect");
        setVerificationStatus("success");
        toast({
          title: "ইমেইল ভেরিফাই সম্পন্ন হয়েছে",
          description: "আপনার ইমেইল সফলভাবে ভেরিফাই করা হয়েছে।",
        });
        
        // ২ সেকেন্ড পর হোম পেজে রিডাইরেক্ট করি
        setTimeout(() => {
          navigate("/");
        }, 2000);
        
        return;
      } else if (status === "pending") {
        console.log("Email verification pending from redirect");
        setVerificationStatus("pending");
        toast({
          title: "ভেরিফিকেশন প্রক্রিয়া চলছে",
          description: "আপনার ইমেইল ভেরিফিকেশন প্রক্রিয়া শুরু হয়েছে। কিছুক্ষণের মধ্যে সম্পন্ন হবে।",
        });
        return;
      } else if (error) {
        console.error("Verification error from redirect:", error);
        setVerificationStatus("error");
        
        // এরর কোড অনুযায়ী মেসেজ দেখাই
        let errorMessage = "ইমেইল ভেরিফিকেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।";
        
        switch(error) {
          case "invalid_link":
            errorMessage = "ভেরিফিকেশন লিংকটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।";
            break;
          case "session_error":
          case "session_retry_error":
            errorMessage = "সেশন সেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
            break;
          case "user_error":
          case "user_retry_error":
            errorMessage = "ইউজার ডাটা পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।";
            break;
          case "unexpected_error":
            errorMessage = "ইমেইল ভেরিফিকেশন প্রক্রিয়ায় একটি অপ্রত্যাশিত সমস্যা হয়েছে।";
            break;
        }
        
        toast({
          title: "ভেরিফিকেশন ত্রুটি",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      // ইউজার লগইন আছে কিনা চেক করি
      if (!user) {
        console.log("No user logged in, checking for tokens in URL");
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");
        const type = searchParams.get("type");
        
        console.log("Auth tokens from URL:", { accessToken, refreshToken, type });
        
        // ইমেইল ভেরিফিকেশন লিঙ্ক থেকে এসেছে কিনা চেক করি
        if (accessToken && refreshToken && type === "email_confirmation") {
          try {
            console.log("Setting session with tokens");
            // সেশন সেট করি টোকেন দিয়ে
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              console.error("Session error:", sessionError);
              throw sessionError;
            }
            
            console.log("Session set successfully:", sessionData);
            
            // ইউজার ডাটা চেক করি
            const { data: userData, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
              console.error("Error getting user after setting session:", userError);
            } else {
              console.log("User data after setting session:", userData);
              console.log("Email confirmation status:", userData.user?.email_confirmed_at);
              
              // Check if email is actually confirmed
              if (userData.user?.email_confirmed_at) {
                setVerificationStatus("success");
                toast({
                  title: "ইমেইল ভেরিফাই সম্পন্ন হয়েছে",
                  description: "আপনার ইমেইল সফলভাবে ভেরিফাই করা হয়েছে।",
                });
                
                // ৫ সেকেন্ড পর হোম পেজে রিডাইরেক্ট করি
                setTimeout(() => {
                  navigate("/");
                }, 5000);
                
                return;
              } else {
                // Email is still not confirmed
                console.error("Email still not confirmed after verification");
                setVerificationStatus("error");
                toast({
                  title: "ভেরিফিকেশন সম্পন্ন হয়নি",
                  description: "ইমেইল ভেরিফিকেশন সম্পন্ন হয়নি। দয়া করে আবার চেষ্টা করুন।",
                  variant: "destructive",
                });
              }
            }
          } catch (error) {
            console.error("Error setting session:", error);
            setVerificationStatus("error");
            toast({
              title: "সেশন সেট করতে সমস্যা",
              description: "ইমেইল ভেরিফিকেশন প্রক্রিয়ায় সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।",
              variant: "destructive",
            });
          }
        } else {
          console.log("No verification tokens found in URL");
          // Keep status as pending
        }
      } else {
        // ইউজার লগইন থাকলে ইমেইল ভেরিফাইড কিনা চেক করি
        console.log("User is logged in:", user);
        console.log("Checking email verification status for user:", user.email);
        
        const isVerified = await checkEmailVerified();
        console.log("Email verified status:", isVerified);
        
        if (isVerified) {
          setVerificationStatus("success");
        } else {
          // Double check with direct method
          const directlyVerified = await checkEmailVerificationDirectly();
          if (directlyVerified) {
            setVerificationStatus("success");
          } else {
            // Still pending
            setVerificationStatus("pending");
          }
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setVerificationStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // ভেরিফিকেশন ইমেইল পুনরায় পাঠানোর ফাংশন
  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      // ইউজার লগইন আছে কিনা চেক করি
      if (!user) {
        toast({
          title: "লগইন প্রয়োজন",
          description: "ভেরিফিকেশন ইমেইল পাঠাতে আগে লগইন করুন।",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // ভেরিফিকেশন ইমেইল পাঠাই
      const { success, error } = await resendVerificationEmail();
      
      if (!success) {
        if (error?.message === "ইমেইল ইতিমধ্যে ভেরিফাইড") {
          toast({
            title: "ইমেইল ইতিমধ্যে ভেরিফাইড",
            description: "আপনার ইমেইল ইতিমধ্যে ভেরিফাইড হয়েছে। আপনি লগইন করতে পারেন।",
          });
          // ৩ সেকেন্ড পর হোম পেজে রিডাইরেক্ট করি
          setTimeout(() => {
            navigate("/");
          }, 3000);
          return;
        }
        throw error;
      }
      
      // ইমেইল সফলভাবে পাঠানো হয়েছে
      setEmailSent(true);
      // ৬০ সেকেন্ড কাউন্টডাউন সেট করি
      setCountdown(60);
      
      toast({
        title: "ইমেইল পাঠানো হয়েছে",
        description: "ভেরিফিকেশন ইমেইল আবার পাঠানো হয়েছে। আপনার ইনবক্স চেক করুন।",
      });
      
      // ইমেইল পাঠানোর পর ইউজারকে জানাই কতক্ষণ পর আবার চেষ্টা করতে পারবেন
      toast({
        title: "অপেক্ষা করুন",
        description: "ইমেইল পৌঁছাতে কয়েক মিনিট সময় লাগতে পারে। স্প্যাম ফোল্ডারও চেক করুন।",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      
      // বিভিন্ন ধরনের এরর হ্যান্ডল করি
      if (error?.message?.includes("For security reasons")) {
        toast({
          title: "নিরাপত্তা সীমাবদ্ধতা",
          description: "নিরাপত্তার কারণে আপনি কিছুক্ষণের মধ্যে একাধিকবার ইমেইল পাঠাতে পারবেন না। কিছুক্ষণ পর আবার চেষ্টা করুন।",
          variant: "destructive",
        });
        setCountdown(60); // সিকিউরিটি লিমিট হিট করলেও কাউন্টডাউন সেট করি
      } else {
        toast({
          title: "ইমেইল পাঠানো যায়নি",
          description: error.message || "ভেরিফিকেশন ইমেইল পাঠানো যায়নি। আবার চেষ্টা করুন।",
          variant: "destructive",
        });
      }
    } finally {
      setResendLoading(false);
    }
  };

  // কম্পোনেন্ট লোড হওয়ার সময় ভেরিফিকেশন স্ট্যাটাস চেক করি
  useEffect(() => {
    console.log("VerifyEmailPage mounted or URL params changed");
    
    // সার্ভার কানেকশন চেক করি
    fetch('http://localhost:8080/health')
      .then(response => {
        console.log("Server health check response:", response.ok);
      })
      .catch(error => {
        console.error("Server health check failed:", error);
        // এরর হলেও ভেরিফিকেশন চেক করতে হবে
      });
    
    // সরাসরি Supabase কানেকশন চেক করি
    supabase.from('profiles').select('count', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) {
          console.error("Supabase connection check failed:", error);
        } else {
          console.log("Supabase connection OK, profiles count:", count);
        }
      });
    
    // ইউজার ভেরিফিকেশন স্ট্যাটাস চেক করি
    checkVerificationStatus();
  }, [searchParams]);
  
  // সরাসরি ইউজার ইমেইল ভেরিফিকেশন স্ট্যাটাস চেক করার ফাংশন
  const checkEmailVerificationDirectly = async () => {
    try {
      if (!user) {
        console.log("No user logged in to check email verification directly");
        return false;
      }
      
      // সরাসরি Supabase API কল করি
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Direct email verification check error:", error);
        return false;
      }
      
      console.log("Direct user data check:", data);
      console.log("Email confirmation direct check:", {
        email: data?.user?.email,
        confirmed_at: data?.user?.email_confirmed_at,
        is_confirmed: data?.user?.email_confirmed_at != null
      });
      
      return data?.user?.email_confirmed_at != null;
    } catch (error) {
      console.error("Exception in direct email verification check:", error);
      return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">ইমেইল ভেরিফিকেশন</CardTitle>
          <CardDescription className="text-blue-100">
            আপনার অ্যাকাউন্ট সক্রিয় করতে ইমেইল ভেরিফাই করুন
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="mt-4 text-lg text-gray-600">স্ট্যাটাস চেক করা হচ্ছে...</p>
            </div>
          ) : verificationStatus === "success" ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800">সফল!</AlertTitle>
              <AlertDescription className="text-green-700">
                আপনার ইমেইল সফলভাবে ভেরিফাই করা হয়েছে। আপনি কয়েক সেকেন্ডের মধ্যে হোম পেজে রিডাইরেক্ট হবেন।
              </AlertDescription>
            </Alert>
          ) : verificationStatus === "error" ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-800">ত্রুটি!</AlertTitle>
              <AlertDescription className="text-red-700">
                ইমেইল ভেরিফিকেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন বা নতুন ভেরিফিকেশন ইমেইল পাঠান।
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-4">
                <Mail className="h-16 w-16 text-blue-600" />
                <h3 className="mt-4 text-xl font-medium text-gray-900">আপনার ইমেইল চেক করুন</h3>
                <p className="mt-2 text-center text-gray-600">
                  আমরা {user?.email} এই ঠিকানায় একটি ভেরিফিকেশন লিঙ্ক পাঠিয়েছি। অনুগ্রহ করে আপনার ইনবক্স চেক করুন এবং লিঙ্কে ক্লিক করুন।
                </p>
                
                {emailSent && (
                  <div className="mt-4 p-2 bg-blue-50 rounded-md text-blue-700 text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    ভেরিফিকেশন ইমেইল পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।
                  </div>
                )}
              </div>
              
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-800">মনে রাখবেন!</AlertTitle>
                <AlertDescription className="text-amber-700">
                  ইমেইল ভেরিফাই না করা পর্যন্ত আপনি সাইটের সকল ফিচার ব্যবহার করতে পারবেন না।
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          {verificationStatus === "pending" && (
            <>
              <Button
                onClick={handleResendEmail}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center"
                disabled={resendLoading || countdown > 0}
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    পাঠানো হচ্ছে...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    {countdown} সেকেন্ড পর আবার চেষ্টা করুন
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    ভেরিফিকেশন ইমেইল আবার পাঠান
                  </>
                )}
              </Button>
              
              {countdown > 0 && (
                <p className="text-xs text-center text-gray-500">
                  নিরাপত্তার কারণে আপনি {countdown} সেকেন্ড পর আবার ইমেইল পাঠাতে পারবেন
                </p>
              )}
            </>
          )}
          
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            হোম পেজে ফিরে যান
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
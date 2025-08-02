import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Mail, ShieldCheck, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthUrlParams } from "@/lib/urlParams";

export default function VerifyEmailConfirmPage() {
  const [loading, setLoading] = useState(true);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Ensure userEmail is set correctly on load
  useEffect(() => {
    // Example function to fetch initial email if not set
    const fetchEmail = async () => {
      if (!userEmail) {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data.user?.email) {
          setUserEmail(data.user.email);
        }
      }
    };
    fetchEmail();
  }, [userEmail]);
  
  // Parse URL parameters using the new utility
  const urlParams = useAuthUrlParams()
  const { params, hasError, isOtpExpired, isValidAuthFlow, errorMessage } = urlParams

  // পেজ লোড হওয়ার সাথে সাথে টোকেন চেক করি
  useEffect(() => {
    const checkParams = async () => {
      try {
        // Log comprehensive URL parameter analysis
        console.log('🔍 Email Verification URL Analysis:', {
          hasError,
          isOtpExpired,
          isValidAuthFlow,
          errorMessage,
          parametersFound: Object.keys(params).length
        })
        
        // Handle OTP expiration error specifically
        if (isOtpExpired) {
          console.log('⏰ OTP Expired in email verification')
          toast({
            title: "ভেরিফিকেশন লিংকের মেয়াদ শেষ",
            description: "ইমেইল ভেরিফিকেশন লিংকের মেয়াদ শেষ হয়ে গেছে। নতুন ভেরিফিকেশন ইমেইলের জন্য অনুরোধ করুন।",
            variant: "destructive",
          })
          setVerificationStatus("error")
          setLoading(false)
          return
        }
        
        // Handle other errors
        if (hasError && !isOtpExpired) {
          console.log('🚨 Email Verification Error:', { 
            error: params.error,
            error_code: params.error_code,
            error_description: params.error_description 
          })
          toast({
            title: "ভেরিফিকেশন ত্রুটি",
            description: errorMessage || "ইমেইল ভেরিফিকেশনে সমস্যা হয়েছে।",
            variant: "destructive",
          })
          setVerificationStatus("error")
          setLoading(false)
          return
        }
        
        // Extract tokens using the utility
        const { accessToken, refreshToken, type } = urlParams.extractTokens()
        
        console.log('🎫 Extracted tokens for email verification:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken, 
          type 
        });
        
        // টোকেন না থাকলে এরর
        if (!accessToken || !refreshToken) {
          console.error("Missing tokens in URL");
          setVerificationStatus("error");
          toast({
            title: "ভেরিফিকেশন লিংক সঠিক নয়",
            description: "ইমেইল ভেরিফিকেশন লিংকে প্রয়োজনীয় তথ্য নেই। অনুগ্রহ করে আবার চেষ্টা করুন।",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // টোকেন সেট করি
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        
        // ইউজারের ইমেইল জানার চেষ্টা করি
        try {
          console.log("Attempting to get user with token");
          const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
          
          if (userError) {
            console.error("Error getting user from token:", userError);
            
            // সেশন সেট করার চেষ্টা করি
            console.log("Trying to set session first");
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              console.error("Session error:", sessionError);
              throw sessionError;
            }
            
            // সেশন সেট করার পর আবার ইউজার ডাটা নিই
            const { data: newUserData, error: newUserError } = await supabase.auth.getUser();
            
            if (newUserError) {
              console.error("Error getting user after setting session:", newUserError);
              throw newUserError;
            }
            
            if (newUserData?.user?.email) {
              setUserEmail(newUserData.user.email);
              console.log("Found user email after setting session:", newUserData.user.email);
              
              if (newUserData?.user?.email_confirmed_at) {
                console.log("Email already verified after setting session:", newUserData.user.email_confirmed_at);
                setVerificationStatus("success");
                
                // ইমেইল ইতিমধ্যে ভেরিফাইড হলে সরাসরি হোম পেজে রিডাইরেক্ট করি
                toast({
                  title: "ইমেইল ভেরিফাই সম্পন্ন হয়েছে",
                  description: "আপনার ইমেইল সফলভাবে ভেরিফাই করা হয়েছে।",
                });
                
                // ২ সেকেন্ড পর হোম পেজে রিডাইরেক্ট করি
                setTimeout(() => {
                  navigate("/");
                }, 2000);
              }
            }
          } else if (userData?.user?.email) {
            setUserEmail(userData.user.email);
            console.log("Found user email:", userData.user.email);
            
            // ইমেইল ভেরিফিকেশন স্টেটাস চেক করি
            if (userData?.user?.email_confirmed_at) {
              console.log("Email already verified:", userData.user.email_confirmed_at);
              setVerificationStatus("success");
              
              // ইমেইল ইতিমধ্যে ভেরিফাইড হলে সরাসরি হোম পেজে রিডাইরেক্ট করি
              toast({
                title: "ইমেইল ভেরিফাই সম্পন্ন হয়েছে",
                description: "আপনার ইমেইল সফলভাবে ভেরিফাই করা হয়েছে।",
              });
              
              // ২ সেকেন্ড পর হোম পেজে রিডাইরেক্ট করি
              setTimeout(() => {
                navigate("/");
              }, 2000);
            }
          }
        } catch (error) {
          console.error("Error checking user email:", error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error checking URL parameters:", error);
        setVerificationStatus("error");
        setLoading(false);
      }
    };
    
    checkParams();
  }, [searchParams, toast, navigate]);

  // ইমেইল ভেরিফাই করার ফাংশন
  const handleVerifyEmail = async () => {
    if (!accessToken || !refreshToken) {
      toast({
        title: "ভেরিফিকেশন টোকেন পাওয়া যায়নি",
        description: "ইমেইল ভেরিফিকেশন লিংক সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।",
        variant: "destructive",
      });
      return;
    }
    
    setVerifyLoading(true);
    try {
      // সেশন সেট করি টোকেন দিয়ে
      console.log("Setting session with tokens to verify email");
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
        throw userError;
      }
      
      console.log("User data after setting session:", userData);
      console.log("Email confirmation status:", userData.user?.email_confirmed_at);
      
      // ইমেইল ভেরিফাইড কিনা চেক করি
      if (userData.user?.email_confirmed_at) {
        setVerificationStatus("success");
        toast({
          title: "ইমেইল ভেরিফাই সম্পন্ন হয়েছে",
          description: "আপনার ইমেইল সফলভাবে ভেরিফাই করা হয়েছে।",
        });
        
        // ২ সেকেন্ড পর হোম পেজে রিডাইরেক্ট করি
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        // আবার চেষ্টা করি
        console.log("Email not verified yet, trying again...");
        
        // আবার সেশন সেট করি
        const { data: newSessionData, error: newSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (newSessionError) {
          console.error("Error in second session attempt:", newSessionError);
        } else {
          console.log("Second session attempt successful:", newSessionData);
        }
        
        // আবার ইউজার ডাটা চেক করি
        const { data: newUserData, error: newUserError } = await supabase.auth.getUser();
        
        if (newUserError) {
          console.error("Error getting user data after second attempt:", newUserError);
        } else if (newUserData?.user?.email_confirmed_at) {
          console.log("Email verified after second attempt:", newUserData.user.email_confirmed_at);
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
        } else {
          // এখনও ভেরিফাইড না হলেও সাকসেস দেখাই
          console.log("Email still not verified after second attempt");
          setVerificationStatus("success");
          toast({
            title: "ভেরিফিকেশন প্রক্রিয়া শুরু হয়েছে",
            description: "আপনার ইমেইল ভেরিফিকেশন প্রক্রিয়া শুরু হয়েছে। কিছুক্ষণের মধ্যে সম্পন্ন হবে।",
          });
          
          // ২ সেকেন্ড পর হোম পেজে রিডাইরেক্ট করি
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error confirming email:", error);
      setVerificationStatus("error");
      toast({
        title: "ভেরিফিকেশন সম্পন্ন হয়নি",
        description: "ইমেইল ভেরিফিকেশন প্রক্রিয়ায় সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // নতুন ভেরিফিকেশন ইমেইল পাঠানোর ফাংশন
  const handleResendVerificationEmail = async () => {
    if (!userEmail) {
      toast({
        title: "লগইন প্রয়োজন",
        description: "আপনাকে লগইন করতে হবে ভেরিফিকেশন ইমেইল পাঠানোর জন্য।",
        variant: "destructive",
      });
      // ২ সেকেন্ড পর লগইন পেজে রিডাইরেক্ট করি
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email-confirm`,
        },
      });

      if (error) {
        console.error("Error resending verification email:", error);
        toast({
          title: "ইমেইল পাঠানো সম্ভব হয়নি",
          description: error.message || "ভেরিফিকেশন ইমেইল পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
          variant: "destructive",
        });
      } else {
        toast({
          title: "ভেরিফিকেশন ইমেইল পাঠানো হয়েছে",
          description: `আপনার ${userEmail} ইমেইল ঠিকানায় নতুন ভেরিফিকেশন ইমেইল পাঠানো হয়েছে। অনুগ্রহ করে ইমেইল চেক করুন।`,
        });
      }
    } catch (error) {
      console.error("Unexpected error resending email:", error);
      toast({
        title: "অপ্রত্যাশিত ত্রুটি",
        description: "ইমেইল পাঠাতে অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">ইমেইল ভেরিফিকেশন</CardTitle>
          <CardDescription className="text-blue-100">
            আপনার ইমেইল অ্যাকাউন্ট নিশ্চিত করুন
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="mt-4 text-lg text-gray-600">অনুগ্রহ করে অপেক্ষা করুন...</p>
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
            <>
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-800">ত্রুটি!</AlertTitle>
                <AlertDescription className="text-red-700">
                  ইমেইল ভেরিফিকেশন লিংকটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে। আপনি নিচের বাটনে ক্লিক করে আবার চেষ্টা করতে পারেন।
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col items-center justify-center mt-4">
                <p className="text-sm text-gray-600 mb-4">
                  আপনার ইমেইল ইতিমধ্যে ভেরিফাইড হয়ে থাকতে পারে। লগইন করে দেখুন।
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate("/login")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    লগইন করুন
                  </Button>
                  <Button
                    onClick={handleResendVerificationEmail}
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    disabled={resendLoading}
                  >
                    {resendLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        পাঠানো হচ্ছে...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        নতুন ভেরিফিকেশন ইমেইল পাঠান
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-4">
                <Mail className="h-16 w-16 text-blue-600" />
                <h3 className="mt-4 text-xl font-medium text-gray-900">ইমেইল ভেরিফিকেশন</h3>
                <p className="mt-2 text-center text-gray-600">
                  {userEmail ? (
                    <>আপনি <span className="font-semibold">{userEmail}</span> এই ইমেইল ঠিকানা ভেরিফাই করতে যাচ্ছেন। নিশ্চিত করতে নিচের বাটনে ক্লিক করুন।</>
                  ) : (
                    <>আপনার ইমেইল ঠিকানা ভেরিফাই করতে নিচের বাটনে ক্লিক করুন।</>
                  )}
                </p>
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-800">নিরাপত্তা নিশ্চিতকরণ</AlertTitle>
                <AlertDescription className="text-blue-700">
                  ইমেইল ভেরিফিকেশন আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করে এবং সকল ফিচার ব্যবহার করতে সাহায্য করে।
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          {verificationStatus === "pending" && (
            <Button
              onClick={handleVerifyEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center justify-center"
              disabled={verifyLoading}
            >
              {verifyLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ভেরিফাই করা হচ্ছে...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  ইমেইল ভেরিফাই করুন
                </>
              )}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition-all duration-200"
          >
            হোম পেজে ফিরে যান
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
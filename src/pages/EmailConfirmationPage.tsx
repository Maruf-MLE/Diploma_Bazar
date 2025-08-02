import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export default function EmailConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // পেজ লোড হওয়ার সাথে সাথে টোকেন পার্স করি
  useEffect(() => {
    const parseTokensAndRedirect = async () => {
      try {
        // সুপাবেস সেশন চেক করি
        const { data: sessionData } = await supabase.auth.getSession();
        console.log("Current session data:", sessionData);
        
        // URL থেকে টোকেন পার্স করার বিভিন্ন উপায় চেষ্টা করি
        
        // 1. সরাসরি URL প্যারামিটার থেকে
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");
        const type = searchParams.get("type");
        
        // 2. URL হ্যাশ থেকে (#)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get("access_token");
        const hashRefreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");
        
        // 3. URL হ্যাশ থেকে (#) - সরাসরি স্ট্রিং পার্সিং
        const hashString = window.location.hash.substring(1);
        const accessTokenMatch = hashString.match(/access_token=([^&]*)/);
        const refreshTokenMatch = hashString.match(/refresh_token=([^&]*)/);
        const typeMatch = hashString.match(/type=([^&]*)/);
        
        const accessTokenFromRegex = accessTokenMatch ? accessTokenMatch[1] : null;
        const refreshTokenFromRegex = refreshTokenMatch ? refreshTokenMatch[1] : null;
        const typeFromRegex = typeMatch ? typeMatch[1] : null;
        
        // সব উৎস থেকে টোকেন নিই
        const finalAccessToken = accessToken || hashAccessToken || accessTokenFromRegex;
        const finalRefreshToken = refreshToken || hashRefreshToken || refreshTokenFromRegex;
        const finalType = type || hashType || typeFromRegex;
        
        console.log("Parsed tokens:", { 
          hasAccessToken: !!finalAccessToken, 
          hasRefreshToken: !!finalRefreshToken, 
          type: finalType,
          accessTokenLength: finalAccessToken?.length,
          refreshTokenLength: finalRefreshToken?.length,
          url: window.location.href,
          hash: window.location.hash,
          searchParams: Object.fromEntries([...searchParams.entries()]),
        });
        
        // যদি টোকেন না পাই, তাহলে সুপাবেস থেকে সরাসরি সেশন নিই
        if (!finalAccessToken || !finalRefreshToken) {
          console.log("No tokens found in URL, checking if Supabase already processed them");
          
          // সুপাবেস সেশন থেকে চেক করি
          const { data } = await supabase.auth.getSession();
          console.log("Session after URL check:", data?.session);
          
          if (data?.session?.access_token) {
            console.log("Found tokens in Supabase session");
            
            // সরাসরি ভেরিফিকেশন পেজে যাই
            navigate("/verify-email?status=success", { replace: true });
            return;
          } else {
            console.error("Missing tokens in email-confirmation URL and no active session");
            setError("টোকেন পাওয়া যায়নি। ভেরিফিকেশন লিংক সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।");
            navigate("/verify-email?error=invalid_link", { replace: true });
            return;
          }
        }
        
        // যদি টোকেন পেয়ে থাকি, তাহলে সেশন সেট করি
        try {
          console.log("Setting session with tokens");
          const { data, error } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken
          });
          
          if (error) {
            console.error("Error setting session:", error);
            setError("সেশন সেট করতে সমস্যা হয়েছে। ভেরিফিকেশন লিংক সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।");
            navigate("/verify-email?error=session_error", { replace: true });
            return;
          }
          
          console.log("Session set successfully:", data);
          
          // ইউজার ডাটা চেক করি
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error("Error getting user after setting session:", userError);
            setError("ইউজার ডাটা পাওয়া যায়নি। ভেরিফিকেশন লিংক সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।");
            navigate("/verify-email?error=user_error", { replace: true });
            return;
          }
          
          console.log("User data after setting session:", userData);
          console.log("Email confirmation status:", userData.user?.email_confirmed_at);
          
          // ইমেইল ভেরিফাইড কিনা চেক করি
          if (userData.user?.email_confirmed_at) {
            console.log("Email is verified, redirecting to success page");
            toast({
              title: "ইমেইল ভেরিফাই সম্পন্ন হয়েছে",
              description: "আপনার ইমেইল সফলভাবে ভেরিফাই করা হয়েছে।",
            });
            
            // সরাসরি হোম পেজে রিডাইরেক্ট করি
            setTimeout(() => {
              navigate("/", { replace: true });
            }, 1000);
          } else {
            // নতুন ভেরিফিকেশন পেজে রিডাইরেক্ট করি
            console.log("Email not yet verified, redirecting to verification page");
            
            // নতুন URL তৈরি করি - টোকেনগুলি এনকোড করি
            let newUrl = `/verify-email-confirm?access_token=${encodeURIComponent(finalAccessToken)}&refresh_token=${encodeURIComponent(finalRefreshToken)}`;
            if (finalType) {
              newUrl += `&type=${encodeURIComponent(finalType)}`;
            }
            
            // রিডাইরেক্ট করি
            console.log("Redirecting to:", newUrl);
            navigate(newUrl, { replace: true });
          }
        } catch (error) {
          console.error("Error in token processing:", error);
          setError("ভেরিফিকেশন প্রক্রিয়ায় সমস্যা হয়েছে। আবার চেষ্টা করুন।");
          navigate("/verify-email?error=unexpected_error", { replace: true });
        }
      } catch (error) {
        console.error("Unexpected error in token parsing:", error);
        setError("অপ্রত্যাশিত সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        navigate("/verify-email?error=unexpected_error", { replace: true });
      }
    };
    
    // অল্প সময় পর টোকেন পার্স করি যাতে সুপাবেস নিজে প্রসেস করার সময় পায়
    setTimeout(parseTokensAndRedirect, 500);
  }, [searchParams, navigate]);

  // লোডিং স্পিনার দেখাই
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-gray-600">ভেরিফিকেশন পেজে যাওয়া হচ্ছে...</p>
        <p className="mt-2 text-sm text-gray-500">অনুগ্রহ করে অপেক্ষা করুন, আপনাকে স্বয়ংক্রিয়ভাবে রিডাইরেক্ট করা হবে</p>
        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
} 
import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { supabase, checkUserBanStatus } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { AlertCircle, Mail, Eye, EyeOff, ArrowLeft, CheckCircle, RefreshCw, Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { checkBanStatus } = useAuth()
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [showVerifyAlert, setShowVerifyAlert] = useState(false)
  const [currentEmail, setCurrentEmail] = useState("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Check for saved email from AuthCallback page and success messages
  useEffect(() => {
    const savedEmail = localStorage.getItem('lastLoginEmail')
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }))
      // Clear it after using it
      localStorage.removeItem('lastLoginEmail')
    }
    
    // Check for success message from password reset
    if (location.state?.message) {
      toast({
        title: "সফল! ✅",
        description: location.state.message,
        duration: 5000,
      })
      // Clear the message from location state
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, navigate, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ভেরিফিকেশন ইমেইল আবার পাঠানোর ফাংশন
  const handleResendVerification = async () => {
    if (!currentEmail) return;
    
    setResendLoading(true);
    try {
      // সুপাবেস দিয়ে সরাসরি ভেরিফিকেশন ইমেইল পাঠাই
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: currentEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmation`
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "ভেরিফিকেশন ইমেইল পাঠানো হয়েছে",
        description: "আপনার ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।",
      });
      
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      toast({
        title: "ভেরিফিকেশন ইমেইল পাঠাতে সমস্যা",
        description: error.message || "ভেরিফিকেশন ইমেইল পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // পাসওয়ার্ড রিসেট ইমেইল পাঠানোর ফাংশন
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast({
        title: "ইমেইল প্রয়োজন",
        description: "অনুগ্রহ করে আপনার ইমেইল ঠিকানা দিন।",
        variant: "destructive",
      });
      return;
    }

    setForgotPasswordLoading(true);
    try {
      // Get the correct redirect URL based on current environment
      let redirectUrl;
      // For all environments, use the current origin
      redirectUrl = `${window.location.origin}/reset-password`;
      
      console.log('Sending password reset email with redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        forgotPasswordEmail,
        {
          redirectTo: redirectUrl,
        }
      );

      if (error) {
        throw error;
      }

      toast({
        title: "পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে",
        description: "আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।",
      });

      // ডায়ালগ বন্ধ করি এবং ইমেইল ফিল্ড রিসেট করি
      setShowForgotPasswordDialog(false);
      setForgotPasswordEmail("");
      
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      toast({
        title: "পাসওয়ার্ড রিসেট ইমেইল পাঠাতে সমস্যা",
        description: error.message || "পাসওয়ার্ড রিসেট ইমেইল পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // ফরগেট পাসওয়ার্ড ডায়ালগ খোলার সময় current email দিয়ে prefill করি
  const openForgotPasswordDialog = () => {
    if (formData.email) {
      setForgotPasswordEmail(formData.email);
    }
    setShowForgotPasswordDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // সুপাবেস দিয়ে লগইন করি
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      // লগইন এরর চেক করি
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "ভুল তথ্য",
            description: "ইমেইল অথবা পাসওয়ার্ড ভুল",
            variant: "destructive",
          })
        } else if (error.message.includes("Email not confirmed")) {
          // ইমেইল ভেরিফাই না করা এরর হ্যান্ডল করি
          console.log("Email not confirmed error:", error);
          
          // ভেরিফিকেশন অ্যালার্ট দেখাই
          setCurrentEmail(formData.email);
          setShowVerifyAlert(true);
        } else {
          toast({
            title: "ত্রুটি",
            description: error.message,
            variant: "destructive",
          })
        }
        setLoading(false)
        return
      }

      // লগইন সফল হলে
      if (data.user) {
        // ইমেইল ভেরিফিকেশন চেক করি
        if (!data.user.email_confirmed_at) {
          console.log("User email not verified:", data.user.email);
          
          // লগআউট করি
          await supabase.auth.signOut();
          
          // ভেরিফিকেশন অ্যালার্ট দেখাই
          setCurrentEmail(formData.email);
          setShowVerifyAlert(true);
          setLoading(false);
          return;
        }
        
        // Check if user is banned
        const { isBanned, banInfo, error: banError } = await checkUserBanStatus(data.user.id)
        
        if (banError) {
          console.error("Error checking ban status:", banError)
        }
        
        // Update ban status in context
        await checkBanStatus()
        
        if (isBanned) {
          // If banned, redirect to banned page
          toast({
            title: "অ্যাকাউন্ট ব্যান করা হয়েছে",
            description: "আপনার অ্যাকাউন্ট ব্যান করা হয়েছে। বিস্তারিত জানতে দেখুন।",
            variant: "destructive",
          })
          navigate("/banned")
        } else {
          // If not banned, proceed normally
          toast({
            title: "সফল",
            description: "আপনি সফলভাবে লগইন করেছেন",
          })
          navigate("/")
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "ত্রুটি",
        description: error.message || "লগইন করা যায়নি। আবার চেষ্টা করুন।",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">লগইন করুন</CardTitle>
          <CardDescription>
            আপনার অ্যাকাউন্টে লগইন করতে ইমেইল এবং পাসওয়ার্ড দিন
          </CardDescription>
        </CardHeader>
        
        {showVerifyAlert && (
          <div className="px-6 pb-2">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-800">ইমেইল ভেরিফাই করুন</AlertTitle>
              <AlertDescription className="text-amber-700 flex flex-col">
                <span>আপনার ইমেইল এখনও ভেরিফাই করা হয়নি। লগইন করতে আগে ইমেইল ভেরিফাই করুন।</span>
                <Button 
                  onClick={handleResendVerification}
                  variant="link" 
                  className="p-0 h-auto text-amber-800 font-semibold hover:text-amber-900 mt-2 w-fit"
                  disabled={resendLoading}
                >
                  {resendLoading ? "পাঠানো হচ্ছে..." : "ভেরিফিকেশন ইমেইল আবার পাঠান →"}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="আপনার ইমেইল"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="আপনার পাসওয়ার্ড"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "প্রক্রিয়াকরণ হচ্ছে..." : "লগইন করুন"}
            </Button>
            <div className="text-sm text-center space-y-2">
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800 hover:underline"
                onClick={openForgotPasswordDialog}
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Button>
              <p className="text-gray-600">
                অ্যাকাউন্ট নেই?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  রেজিস্টার করুন
                </Link>
              </p>
              <p className="text-gray-500">
                সমস্যা হচ্ছে?{" "}
                <a href="https://www.facebook.com/diplomabazar/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  সাহায্য নিন
                </a>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              পাসওয়ার্ড রিসেট করুন
            </DialogTitle>
            <DialogDescription>
              আপনার ইমেইল ঠিকানা দিন। আমরা আপনাকে পাসওয়ার্ড রিসেট করার জন্য একটি লিংক পাঠাব।
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">ইমেইল ঠিকানা</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="username"
                placeholder="আপনার ইমেইল ঠিকানা"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForgotPasswordDialog(false);
                setForgotPasswordEmail("");
              }}
            >
              বাতিল
            </Button>
            <Button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotPasswordLoading || !forgotPasswordEmail}
            >
              {forgotPasswordLoading ? "পাঠানো হচ্ছে..." : "রিসেট লিংক পাঠান"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

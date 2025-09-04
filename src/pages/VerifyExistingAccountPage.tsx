import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VerifyExistingAccountPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  
  const email = searchParams.get('email') || ''

  useEffect(() => {
    if (!email) {
      toast({
        title: "ত্রুটি",
        description: "ইমেইল পাওয়া যায়নি। আবার চেষ্টা করুন।",
        variant: "destructive",
      })
      navigate('/login')
    }
  }, [email, navigate, toast])

  const handlePasswordVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("🔐 Verifying password for email:", email)

      // Try to sign in with email and password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (signInError) {
        console.error('❌ Password verification failed:', signInError)
        
        // Handle different error types
        if (signInError.message.includes('Invalid login credentials')) {
          toast({
            title: "ভুল পাসওয়ার্ড",
            description: "আপনার পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।",
            variant: "destructive",
          })
        } else if (signInError.message.includes('Email not confirmed')) {
          toast({
            title: "ইমেইল যাচাই করুন",
            description: "প্রথমে আপনার ইমেইল verify করুন।",
            variant: "destructive",
          })
        } else {
          toast({
            title: "লগইন ত্রুটি",
            description: signInError.message || "লগইন করতে সমস্যা হয়েছে।",
            variant: "destructive",
          })
        }
        setLoading(false)
        return
      }

      if (!signInData.user) {
        toast({
          title: "ত্রুটি",
          description: "ব্যবহারকারী পাওয়া যায়নি।",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      console.log("✅ Password verification successful for:", signInData.user.email)

      // Success message
      toast({
        title: "সফল!",
        description: "পাসওয়ার্ড যাচাই সফল হয়েছে। আপনি এখন লগইন করেছেন।",
      })

      // Redirect to home page (user is now logged in)
      navigate("/")

    } catch (error: any) {
      console.error("Password verification error:", error)
      toast({
        title: "ত্রুটি",
        description: error.message || "পাসওয়ার্ড যাচাই করতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) return

    try {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast({
          title: "ত্রুটি",
          description: "পাসওয়ার্ড রিসেট ইমেইল পাঠাতে সমস্যা হয়েছে।",
          variant: "destructive",
        })
      } else {
        toast({
          title: "ইমেইল পাঠানো হয়েছে",
          description: "পাসওয়ার্ড রিসেট করার জন্য আপনার ইমেইল চেক করুন।",
        })
      }
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        title: "ত্রুটি",
        description: "পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUseGoogleInstead = async () => {
    // Sign out current session and redirect to Google login
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-100 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center bg-gradient-to-r from-orange-600 to-red-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <AlertTriangle className="mr-2 h-6 w-6" />
            অ্যাকাউন্ট পাওয়া গেছে
          </CardTitle>
          <CardDescription className="text-orange-100 text-sm">
            এই ইমেইল দিয়ে আগে থেকেই একটি অ্যাকাউন্ট আছে
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6 pb-6">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>ইমেইল:</strong> {email}
              <br />
              <span className="text-sm text-gray-600 mt-1 block">
                এই ইমেইল দিয়ে আগে থেকেই একটি অ্যাকাউন্ট তৈরি করা হয়েছে। 
                পাসওয়ার্ড দিয়ে লগইন করুন।
              </span>
            </AlertDescription>
          </Alert>

          <form onSubmit={handlePasswordVerification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center">
                <Lock className="mr-2 h-4 w-4" />
                পাসওয়ার্ড
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="focus:ring-2 focus:ring-orange-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white shadow-md" 
              disabled={loading}
            >
              {loading ? "যাচাই করা হচ্ছে..." : "পাসওয়ার্ড দিয়ে লগইন করুন"}
            </Button>
          </form>

          <div className="space-y-3">
            <div className="text-center">
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">অথবা</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleUseGoogleInstead}
              disabled={loading}
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              Google দিয়ে লগইন করুন
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>
              সমস্যা হচ্ছে?{" "}
              <a 
                href="https://www.facebook.com/diplomabazar/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-orange-600 hover:underline"
              >
                সাহায্য নিন
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

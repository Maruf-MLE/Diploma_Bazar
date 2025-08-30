import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, Shield, AlertTriangle, Clock, Mail, Loader2, CheckCircle, ArrowLeft, KeyRound } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<'checking' | 'valid' | 'invalid' | 'expired'>('checking')
  const [newLinkEmail, setNewLinkEmail] = useState("")
  const [newLinkLoading, setNewLinkLoading] = useState(false)
  const [showNewLinkSuccess, setShowNewLinkSuccess] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  // Simple URL parameter extraction
  const extractUrlParams = () => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    return { accessToken, refreshToken, token, type, error, errorDescription }
  }

  // Check if the reset session is valid
  useEffect(() => {
    const checkResetSession = async () => {
      try {
        const { accessToken, refreshToken, token, type, error, errorDescription } = extractUrlParams()
        
        console.log('🔍 Reset Password URL Parameters:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken, 
          hasToken: !!token, 
          type,
          hasError: !!error 
        })

        // Handle errors from URL
        if (error) {
          console.log('🚨 Authentication Error:', error)
          
          if (error.includes('expired') || error.includes('invalid_token')) {
            setSessionStatus('expired')
            toast({
              title: "লিংকের মেয়াদ শেষ",
              description: "পাসওয়ার্ড রিসেট লিংকের মেয়াদ শেষ হয়ে গেছে। নতুন লিংকের জন্য অনুরোধ করুন।",
              variant: "destructive",
            })
          } else {
            setSessionStatus('invalid')
            toast({
              title: "অথেনটিকেশন ত্রুটি",
              description: errorDescription || "একটি অথেনটিকেশন ত্রুটি ঘটেছে।",
              variant: "destructive",
            })
          }
          return
        }

        // Method 1: Try with access_token and refresh_token
        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('🔄 Attempting session with access and refresh tokens')
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('❌ Token session failed:', error)
          } else if (data.session) {
            console.log('✅ Session established with tokens')
            setSessionStatus('valid')
            toast({
              title: "সেশন বৈধ",
              description: "আপনি এখন নতুন পাসওয়ার্ড সেট করতে পারেন।",
            })
            return
          }
        }

        // Method 2: Try with token (PKCE flow)
        if (type === 'recovery' && token) {
          console.log('🔄 Attempting PKCE token verification')
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          })

          if (error) {
            console.error('❌ PKCE verification failed:', error)
          } else if (data.session) {
            console.log('✅ Session established with PKCE token')
            setSessionStatus('valid')
            toast({
              title: "সেশন বৈধ",
              description: "আপনি এখন নতুন পাসওয়ার্ড সেট করতে পারেন।",
            })
            return
          }
        }

        // Method 3: Check existing session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('✅ Using existing session')
          setSessionStatus('valid')
          toast({
            title: "সেশন বৈধ",
            description: "আপনি এখন নতুন পাসওয়ার্ড সেট করতে পারেন।",
          })
          return
        }

        // If none of the methods work
        console.log('❌ No valid session found')
        setSessionStatus('invalid')
        toast({
          title: "অবৈধ লিংক",
          description: "পাসওয়ার্ড রিসেট লিংকটি অবৈধ বা মেয়াদ শেষ হয়ে গেছে।",
          variant: "destructive",
        })
        
      } catch (error: any) {
        console.error('❌ Session check error:', error)
        setSessionStatus('invalid')
        toast({
          title: "ত্রুটি",
          description: "সেশন যাচাই করতে সমস্যা হয়েছে।",
          variant: "destructive",
        })
      }
    }

    checkResetSession()
  }, [searchParams, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"
    }
    // Simple validation - just check minimum length
    // Allow any combination of characters, numbers, or symbols
    return null
  }

  // Handle requesting a new reset link
  const handleRequestNewLink = async () => {
    if (!newLinkEmail.trim()) {
      toast({
        title: "ইমেইল প্রয়োজন",
        description: "অনুগ্রহ করে আপনার ইমেইল ঠিকানা দিন।",
        variant: "destructive",
      })
      return
    }

    setNewLinkLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        newLinkEmail.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      )

      if (error) throw error

      setShowNewLinkSuccess(true)
      toast({
        title: "নতুন রিসেট লিংক পাঠানো হয়েছে",
        description: "আপনার ইমেইলে নতুন পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।",
      })

    } catch (error: any) {
      console.error('❌ Error requesting new reset link:', error)
      toast({
        title: "নতুন লিংক পাঠাতে সমস্যা",
        description: error.message || "নতুন পাসওয়ার্ড রিসেট লিংক পাঠাতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
    } finally {
      setNewLinkLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate passwords
      if (!formData.password || !formData.confirmPassword) {
        toast({
          title: "সব ফিল্ড পূরণ করুন",
          description: "অনুগ্রহ করে সব ফিল্ড পূরণ করুন।",
          variant: "destructive",
        })
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "পাসওয়ার্ড মিলছে না",
          description: "নতুন পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড একই হতে হবে।",
          variant: "destructive",
        })
        return
      }

      const passwordError = validatePassword(formData.password)
      if (passwordError) {
        toast({
          title: "দুর্বল পাসওয়ার্ড",
          description: passwordError,
          variant: "destructive",
        })
        return
      }

      // Get current session before updating password
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        // If no session, try to establish one using URL parameters
        const { accessToken, refreshToken, token, type } = extractUrlParams()
        
        if (type === 'recovery') {
          if (accessToken && refreshToken) {
            // Try to set session using tokens
            const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (setSessionError || !sessionData.session) {
              throw new Error('পাসওয়ার্ড পরিবর্তনের জন্য session তৈরি করতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
            }
          } else if (token) {
            // Try PKCE token verification
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery'
            })
            
            if (verifyError || !verifyData.session) {
              throw new Error('পাসওয়ার্ড রিসেট টোকেন যাচাই করতে সমস্যা হচ্ছে। অনুগ্রহ করে নতুন রিসেট লিংক নিন।')
            }
          } else {
            throw new Error('পাসওয়ার্ড পরিবর্তনের জন্য প্রয়োজনীয় authentication token পাওয়া যায়নি।')
          }
        } else {
          throw new Error('অবৈধ authentication session। অনুগ্রহ করে আবার লগইন করুন।')
        }
      }
      
      console.log('🔐 Updating password with valid session...')
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) {
        console.error('❌ Password update error:', error)
        throw error
      }

      toast({
        title: "পাসওয়ার্ড পরিবর্তন সফল! ✅",
        description: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। আপনাকে লগইন পেজে নিয়ে যাওয়া হচ্ছে...",
        duration: 4000,
      })

      console.log('✅ Password reset successful, redirecting to login...')
      
      // Sign out and redirect to login after a short delay to show success message
      setTimeout(async () => {
        await supabase.auth.signOut()
        navigate("/login", { 
          replace: true,
          state: { message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।' }
        })
      }, 2000)

    } catch (error: any) {
      console.error("Password reset error:", error)
      toast({
        title: "পাসওয়ার্ড পরিবর্তন করতে সমস্যা",
        description: error.message || "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking session
  if (sessionStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="animate-spin h-8 w-8" />
              <span>যাচাই করা হচ্ছে...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state if session is invalid or expired
  if (sessionStatus === 'invalid' || sessionStatus === 'expired') {
    const isExpired = sessionStatus === 'expired'
    const ErrorIcon = isExpired ? Clock : AlertTriangle
    const errorTitle = isExpired ? "লিংকের মেয়াদ শেষ" : "অবৈধ লিংক"
    const errorDesc = isExpired 
      ? "পাসওয়ার্ড রিসেট লিংকের মেয়াদ শেষ হয়ে গেছে। একটি নতুন রিসেট লিংকের জন্য অনুরোধ করুন।"
      : "পাসওয়ার্ড রিসেট লিংকটি অবৈধ বা মেয়াদ শেষ হয়ে গেছে।"
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 space-y-4">
            <Alert variant="destructive">
              <ErrorIcon className="h-4 w-4" />
              <AlertTitle>{errorTitle}</AlertTitle>
              <AlertDescription>
                {errorDesc}
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-blue-50 border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">নতুন রিসেট লিংক পান</AlertTitle>
              <AlertDescription className="text-blue-700">
                <div className="space-y-4 mt-3">
                  <p>আপনার ইমেইল ঠিকানা দিন এবং আমরা আপনাকে একটি নতুন পাসওয়ার্ড রিসেট লিংক পাঠাবো:</p>
                  
                  <div className="space-y-3">
                    <Input
                      type="email"
                      placeholder="আপনার ইমেইল ঠিকানা"
                      value={newLinkEmail}
                      onChange={(e) => setNewLinkEmail(e.target.value)}
                      disabled={newLinkLoading}
                      className="bg-white"
                    />
                    
                    <Button 
                      onClick={handleRequestNewLink}
                      disabled={newLinkLoading || !newLinkEmail.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {newLinkLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          পাঠানো হচ্ছে...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          নতুন রিসেট লিংক পাঠান
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Success message */}
                  {showNewLinkSuccess && (
                    <Alert className="bg-green-50 border-green-200 mt-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">সফল!</AlertTitle>
                      <AlertDescription className="text-green-700">
                        নতুন পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স (এবং স্প্যাম ফোল্ডার) চেক করুন।
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate("/login")} 
                className="flex-1"
              >
                লগইন পেজে যান
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="flex-1"
              >
                পেজ রিলোড করুন
              </Button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                সমস্যা সমাধান না হলে{" "}
                <a href="https://www.facebook.com/diplomabazar/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  সাহায্য নিন
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            নতুন পাসওয়ার্ড সেট করুন
          </CardTitle>
          <CardDescription>
            আপনার অ্যাকাউন্টের জন্য একটি নতুন পাসওয়ার্ড তৈরি করুন
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="নতুন পাসওয়ার্ড"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="পাসওয়ার্ড আবার লিখুন"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "পরিবর্তন করা হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
            </Button>
            <div className="text-sm text-center">
              <Button
                type="button"
                variant="link"
                className="text-blue-600 hover:underline"
                onClick={() => navigate("/login")}
              >
                লগইন পেজে ফিরে যান
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

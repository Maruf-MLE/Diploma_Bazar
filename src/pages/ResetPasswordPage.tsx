import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, Shield, AlertTriangle, Clock, RefreshCw, Mail, Loader2, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuthUrlParams } from "@/lib/urlParams"

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [newLinkLoading, setNewLinkLoading] = useState(false)
  const [newLinkEmail, setNewLinkEmail] = useState("")
  const [showNewLinkSuccess, setShowNewLinkSuccess] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{remaining: number, resetTime: string} | null>(null)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  
  // Parse URL parameters using the new utility
  const urlParams = useAuthUrlParams()
  const { params, hasError, isOtpExpired, isValidAuthFlow, errorMessage, debugInfo } = urlParams

  // Check if the reset session is valid
  useEffect(() => {
    // Prevent multiple rapid executions
    let isExecuting = false
    
    const checkResetSession = async () => {
      if (isExecuting) return
      isExecuting = true
      
      try {
        // Log comprehensive URL parameter analysis
        console.log('🔍 Reset Password URL Analysis:', {
          hasError,
          isOtpExpired,
          isValidAuthFlow,
          errorMessage,
          parametersFound: Object.keys(params).length
        })
        
        // Handle OTP expiration error specifically
        if (isOtpExpired) {
          console.log('⏰ OTP Expired - showing specific error message')
          toast({
            title: "OTP মেয়াদ শেষ",
            description: "পাসওয়ার্ড রিসেট লিংকের মেয়াদ শেষ হয়ে গেছে। দয়া করে নতুন লিংকের জন্য অনুরোধ করুন।",
            variant: "destructive",
          })
          setSessionChecked(true)
          return
        }
        
        // Handle other errors
        if (hasError && !isOtpExpired) {
          console.log('🚨 Authentication Error:', { 
            error: params.error,
            error_code: params.error_code,
            error_description: params.error_description 
          })
          throw new Error(errorMessage || 'Authentication error occurred')
        }
        
        // Extract tokens using the utility
        const { accessToken, refreshToken, token, type } = urlParams.extractTokens()
        
        console.log('🎫 Extracted tokens for password reset:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken, 
          hasToken: !!token, 
          type 
        })
        
      // Method 1: Check if there's an access token and refresh token in URL (new format)
        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('🔄 Method 1: Using access_token and refresh_token for session')
          // Set the session using the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('❌ Error setting session with tokens:', error)
            // Don't throw error immediately, try other methods
            console.log('⚠️ Token session failed, trying other methods...')
          } else if (data.session) {
            console.log('✅ Session established successfully with tokens')
            setIsValidSession(true)
            toast({
              title: "সেশন বৈধ",
              description: "আপনি এখন আপনার পাসওয়ার্ড পরিবর্তন করতে পারেন।",
            })
            return
          }
        }
        
        // Method 2: Check if there's a token parameter (PKCE format)
        if (type === 'recovery' && token) {
          console.log('🔄 Method 2: Using PKCE token for verification')
          
          // For PKCE flow, we need to verify the token with Supabase
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery'
            })
            
            if (error) {
              console.error('❌ Error verifying PKCE token:', error)
              // Don't throw error immediately, try other methods
              console.log('⚠️ PKCE verification failed, trying other methods...')
            } else if (data.session) {
              console.log('✅ Session established successfully with PKCE token')
              setIsValidSession(true)
              toast({
                title: "সেশন বৈধ",
                description: "আপনি এখন আপনার পাসওয়ার্ড পরিবর্তন করতে পারেন।",
              })
              return
            }
          } catch (verifyError) {
            console.error('❌ PKCE verification failed:', verifyError)
            // Continue to other methods
            console.log('⚠️ Trying alternative verification methods...')
          }
        }
        
        // Method 3: Check if user is already authenticated (direct access)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Error getting current session:', sessionError)
        }
        
        if (session) {
          console.log('✅ Method 3: Using existing session')
          setIsValidSession(true)
          toast({
            title: "সেশন বৈধ",
            description: "আপনি এখন আপনার পাসওয়ার্ড পরিবর্তন করতে পারেন।",
          })
          return
        }
        
        // Method 4: Try alternative verification for recovery type with any token
        if (type === 'recovery' && (token || accessToken)) {
          console.log('🔄 Method 4: Alternative recovery verification')
          try {
            // Try to exchange token for session
            const tokenToUse = token || accessToken
            if (tokenToUse) {
              console.log('🎫 Attempting to exchange token for session...')
              
              // Create a temporary session to test password reset capability
              const { data: userData, error: userError } = await supabase.auth.getUser(tokenToUse)
              
              if (!userError && userData.user) {
                console.log('✅ Method 4: Token is valid, allowing password reset')
                setIsValidSession(true)
                toast({
                  title: "সেশন বৈধ",
                  description: "আপনি এখন আপনার পাসওয়ার্ড পরিবর্তন করতে পারেন।",
                })
                return
              }
            }
          } catch (altError) {
            console.error('❌ Alternative verification failed:', altError)
          }
        }
        
        // If none of the methods work, but we have recovery type with valid token, allow password reset
        if (type === 'recovery' && (token || accessToken)) {
          console.log('⚠️ Recovery type detected with token - allowing password reset attempt')
          setIsValidSession(true)
          toast({
            title: "পাসওয়ার্ড রিসেট লিংক বৈধ",
            description: "আপনি এখন আপনার পাসওয়ার্ড পরিবর্তন করতে পারেন।",
          })
          return
        }
        
        // If none of the methods work, throw error
        console.log('❌ No valid authentication method found')
        throw new Error('Invalid reset link - no valid authentication method found')
        
      } catch (error: any) {
        console.error('❌ Reset session error:', error)
        
        // Generate detailed debug report for troubleshooting
        const debugReport = urlParams.generateDebugReport()
        console.log('📋 Debug Report:', debugReport)
        
        let errorTitle = "অবৈধ লিংক"
        let errorDescription = "পাসওয়ার্ড রিসেট লিংকটি অবৈধ বা মেয়াদ শেষ হয়ে গেছে। দয়া করে আবার পাসওয়ার্ড রিসেট করার জন্য অনুরোধ করুন।"
        
        // Customize error message based on the type of error
        if (isOtpExpired) {
          errorTitle = "OTP মেয়াদ শেষ"
          errorDescription = "পাসওয়ার্ড রিসেট লিংকের মেয়াদ শেষ হয়ে গেছে। একটি নতুন রিসেট লিংকের জন্য অনুরোধ করুন।"
        } else if (hasError) {
          errorTitle = "অথেনটিকেশন ত্রুটি"
          errorDescription = errorMessage || "একটি অথেনটিকেশন ত্রুটি ঘটেছে। দয়া করে আবার চেষ্টা করুন।"
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        })
        
        // Redirect to login page after a short delay
        setTimeout(() => navigate("/login"), 5000)
      } finally {
        setSessionChecked(true)
        isExecuting = false
      }
    }

    checkResetSession()
  }, [searchParams, navigate, toast]) // Simplified dependencies to prevent rapid re-execution

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
    setShowNewLinkSuccess(false)
    setRateLimitInfo(null)

    try {
      // Get the correct redirect URL based on current environment
      let redirectUrl
      redirectUrl = `${window.location.origin}/reset-password`

      console.log('🔄 Requesting new password reset link for:', newLinkEmail)
      console.log('🔗 Redirect URL:', redirectUrl)

      const { data, error } = await supabase.auth.resetPasswordForEmail(
        newLinkEmail.trim(),
        {
          redirectTo: redirectUrl,
        }
      )

      if (error) {
        // Handle rate limiting error specifically
        if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
          // Try to extract rate limit info from error (this depends on Supabase's error format)
          const rateLimitMatch = error.message.match(/(\d+)\s*seconds?/i)
          const waitTime = rateLimitMatch ? parseInt(rateLimitMatch[1]) : 60
          const resetTime = new Date(Date.now() + waitTime * 1000).toLocaleTimeString('bn-BD')
          
          setRateLimitInfo({
            remaining: waitTime,
            resetTime
          })
          
          toast({
            title: "অনুরোধের সীমা অতিক্রম",
            description: `অনেক বেশি অনুরোধ করা হয়েছে। ${waitTime} সেকেন্ড পরে আবার চেষ্টা করুন।`,
            variant: "destructive",
          })
          return
        }
        
        throw error
      }

      setShowNewLinkSuccess(true)
      toast({
        title: "নতুন রিসেট লিংক পাঠানো হয়েছে",
        description: "আপনার ইমেইলে নতুন পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।",
      })

      console.log('✅ New password reset email sent successfully')

    } catch (error: any) {
      console.error('❌ Error requesting new reset link:', error)
      toast({
        title: "নতুন লিংক পাঠাতে সমস্যা",
        description: error.message || "নতুন পাসওয়ার্ড রিসেট লিংক পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
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
        const { accessToken, refreshToken, token, type } = urlParams.extractTokens()
        
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
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span>যাচাই করা হচ্ছে...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state if session is invalid
  if (!isValidSession) {
    // Determine the appropriate error icon and message
    const ErrorIcon = isOtpExpired ? Clock : hasError ? AlertTriangle : Shield
    const errorTitle = isOtpExpired ? "OTP মেয়াদ শেষ" : hasError ? "অথেনটিকেশন ত্রুটি" : "অবৈধ লিংক"
    const errorDesc = isOtpExpired 
      ? "পাসওয়ার্ড রিসেট লিংকের মেয়াদ শেষ হয়ে গেছে। একটি নতুন রিসেট লিংকের জন্য অনুরোধ করুন।"
      : hasError 
      ? (errorMessage || "একটি অথেনটিকেশন ত্রুটি ঘটেছে। দয়া করে আবার চেষ্টা করুন।")
      : "পাসওয়ার্ড রিসেট লিংকটি অবৈধ বা মেয়াদ শেষ হয়ে গেছে। আপনাকে লগইন পেজে পাঠানো হচ্ছে..."
    
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
            
            {/* Show specific error details if available */}
            {hasError && (
              <Alert className="bg-orange-50 border-orange-200">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">ত্রুটির বিস্তারিত</AlertTitle>
                <AlertDescription className="text-orange-700">
                  <div className="space-y-1">
                    {params.error && <div><strong>Error:</strong> {params.error}</div>}
                    {params.error_code && <div><strong>Error Code:</strong> {params.error_code}</div>}
                    {params.error_description && <div><strong>Description:</strong> {params.error_description}</div>}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Special handling for OTP expired error - Enhanced with direct request functionality */}
            {(isOtpExpired || !isValidAuthFlow) && (
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
                    
                    {/* Rate limit information */}
                    {rateLimitInfo && (
                      <Alert className="bg-yellow-50 border-yellow-200 mt-3">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-800">অপেক্ষা করুন</AlertTitle>
                        <AlertDescription className="text-yellow-700">
                          অনেক বেশি অনুরোধের কারণে আপনাকে অপেক্ষা করতে হবে। পরবর্তী অনুরোধের জন্য {rateLimitInfo.resetTime} পর্যন্ত অপেক্ষা করুন।
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Debug information - enhanced with new utility */}
            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium text-sm text-gray-700 mb-2">
                ডিবাগ তথ্য (ডেভেলপমেন্টের জন্য)
              </summary>
              <div className="text-xs space-y-3 text-gray-600">
                <div>
                  <strong>URL Analysis:</strong>
                  <div className="bg-white p-2 rounded border space-y-1">
                    <div>Has Error: <span className={hasError ? 'text-red-600' : 'text-green-600'}>{hasError ? 'Yes' : 'No'}</span></div>
                    <div>OTP Expired: <span className={isOtpExpired ? 'text-red-600' : 'text-green-600'}>{isOtpExpired ? 'Yes' : 'No'}</span></div>
                    <div>Valid Auth Flow: <span className={isValidAuthFlow ? 'text-green-600' : 'text-red-600'}>{isValidAuthFlow ? 'Yes' : 'No'}</span></div>
                    <div>Parameters Found: {Object.keys(params).length}</div>
                  </div>
                </div>
                
                <div>
                  <strong>Current URL:</strong>
                  <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
                    {debugInfo.url}
                  </pre>
                </div>
                
                <div>
                  <strong>All Parameters:</strong>
                  <pre className="bg-white p-2 rounded border text-xs">
                    {JSON.stringify(params, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <strong>Debug Report:</strong>
                  <pre className="bg-white p-2 rounded border text-xs max-h-40 overflow-y-auto">
                    {urlParams.generateDebugReport()}
                  </pre>
                </div>
                
                <div>
                  <strong>Expected Parameters:</strong>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>PKCE Flow: <code>?token=xxx&type=recovery</code></li>
                    <li>Traditional Flow: <code>?access_token=xxx&refresh_token=xxx&type=recovery</code></li>
                    <li>Error Flow: <code>?error=xxx&error_code=xxx&error_description=xxx</code></li>
                  </ul>
                </div>
              </div>
            </details>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate("/login")} 
                className="flex-1"
              >
                লগইন পেজে যান
              </Button>
              {isOtpExpired ? (
                <Button 
                  onClick={() => navigate("/login")} 
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  নতুন রিসেট লিংক পান
                </Button>
              ) : (
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="flex-1"
                >
                  পেজ রিলোড করুন
                </Button>
              )}
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
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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

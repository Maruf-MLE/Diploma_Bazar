import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile, supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthUrlParams } from '@/lib/urlParams'
import { useToast } from '@/components/ui/use-toast'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, loading, checkBanStatus } = useAuth()
  const { toast } = useToast()
  const urlParams = useAuthUrlParams()
  const { params, isValidAuthFlow } = urlParams
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    // Check if this is a password reset flow
    const isPasswordReset = params.type === 'recovery' || 
                           (params.access_token && params.type === 'recovery') ||
                           (params.token && params.type === 'recovery')
    
    console.log('🔍 AuthCallback - Checking URL parameters:', {
      type: params.type,
      hasAccessToken: !!params.access_token,
      hasToken: !!params.token,
      isPasswordReset,
      isValidAuthFlow
    })
    
    // If this is a password reset, redirect to reset password page with all parameters
    if (isPasswordReset) {
      console.log('🔄 Redirecting to reset-password page for password reset flow')
      // Preserve all URL parameters when redirecting
      const currentUrl = new URL(window.location.href)
      const searchParams = currentUrl.search
      const hashParams = currentUrl.hash
      
      // Build the redirect URL with all parameters
      let redirectUrl = '/reset-password'
      if (searchParams) {
        redirectUrl += searchParams
      }
      if (hashParams) {
        redirectUrl += hashParams
      }
      
      navigate(redirectUrl, { replace: true })
      return
    }
    
    // If authentication is done loading and not a password reset
    if (!loading && !checking) {
      handleAuthComplete()
    }
  }, [loading, user, navigate, params, isValidAuthFlow, checking])
  
  const handleAuthComplete = async () => {
    if (!user) {
      console.log('No user found, redirecting to login')
      navigate('/login')
      return
    }
    
    setChecking(true)
    
    try {
      console.log('🔍 Checking user profile for:', user.id)
      
      // Check ban status first
      await checkBanStatus()
      
      // Check if user has a complete profile
      const profile = await getUserProfile(user.id)
      
      console.log('User profile data:', profile)
      
      if (!profile || !profile.name || !profile.roll_number || !profile.department || !profile.institute_name) {
        // Check if there's an existing user with same email but different auth method
        const userEmail = user.email
        
        if (userEmail) {
          console.log('🔍 Checking for duplicate email in Supabase Auth:', userEmail)
          
          // Check if this email already has an account with a different authentication method
          try {
            // Use admin functions to list users with this email (this won't work with client-side)
            // Instead, we'll attempt to sign in with email/password to check if account exists
            // If the attempt fails due to "Email not confirmed" or similar, it means email exists
            
            // We can detect duplicate email by trying password reset
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
              userEmail,
              {
                redirectTo: `${window.location.origin}/reset-password-check`,
              }
            )
            
            // If no error, it means email exists in auth system
            if (!resetError) {
              console.log('🔗 Found existing auth user with email:', userEmail)
              toast({
                title: "ইমেইল পাওয়া গেছে",
                description: "এই ইমেইল দিয়ে আগে থেকেই একটি অ্যাকাউন্ট আছে। পাসওয়ার্ড দিয়ে যাচাই করুন।",
                duration: 5000,
              })
              
              // Sign out current Google user first
              await supabase.auth.signOut()
              
              // Redirect to password verification page
              navigate(`/verify-existing-account?email=${encodeURIComponent(userEmail)}`)
              return
            }
            
            // If error occurs, it might mean email doesn't exist or other issue
            console.log('📧 Password reset result:', resetError)
            
          } catch (error) {
            console.log('🔍 Email check error (probably new email):', error)
            // Continue with normal registration flow
          }
        }
        
        console.log('🔄 Profile incomplete, redirecting to registration form')
        toast({
          title: "প্রোফাইল সম্পূর্ণ করুন",
          description: "আপনার অ্যাকাউন্ট ব্যবহার করতে প্রথমে প্রোফাইল তথ্য পূরণ করুন।",
        })
        navigate('/register')
      } else {
        console.log('✅ Profile complete, redirecting to home')
        toast({
          title: "স্বাগতম!",
          description: "আপনি সফলভাবে লগইন করেছেন।",
        })
        navigate('/')
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
      toast({
        title: "ত্রুটি",
        description: "প্রোফাইল তথ্য পরীক্ষা করতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
      // If there's an error, still try to navigate to registration to be safe
      navigate('/register')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            অথেনটিকেশন চেক করা হচ্ছে...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
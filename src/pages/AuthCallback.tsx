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
  
  console.log('🏠 AuthCallback render - State:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    loading,
    checking,
    currentUrl: window.location.href
  })

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
  }, [loading, user, checking])
  
  const handleAuthComplete = async () => {
    console.log('🚀 handleAuthComplete started')
    
    if (!user) {
      console.log('❌ No user found, redirecting to login')
      navigate('/login')
      return
    }
    
    console.log('✅ User found, continuing with profile check')
    setChecking(true)
    
    try {
      console.log('🔍 Checking user profile for:', user.id)
      console.log('📧 User email:', user.email)
      console.log('👤 User metadata:', user.user_metadata)
      
      // Check ban status first
      await checkBanStatus()
      
      // Check if user has a complete profile
      const profile = await getUserProfile(user.id)
      
      console.log('📋 User profile data:', profile)
      console.log('✅ Profile fields check:', {
        hasProfile: !!profile,
        hasName: !!profile?.name,
        hasRollNumber: !!profile?.roll_number,
        hasDepartment: !!profile?.department,
        hasInstituteName: !!profile?.institute_name
      })
      
      if (!profile || !profile.name || !profile.roll_number || !profile.department || !profile.institute_name) {
        // For new users who don't have a complete profile, directly redirect to registration
        // Don't do duplicate email check here since we're already authenticated via Google/OAuth
        
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
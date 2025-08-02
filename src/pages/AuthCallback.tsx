import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthUrlParams } from '@/lib/urlParams'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const urlParams = useAuthUrlParams()
  const { params, isValidAuthFlow } = urlParams

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
    if (!loading) {
      // If user is logged in, redirect to home
      if (user) {
        navigate('/')
      } else {
        // If no user, redirect to login
        navigate('/login')
      }
    }
  }, [loading, user, navigate, params, isValidAuthFlow])

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
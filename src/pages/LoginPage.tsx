import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase, checkUserBanStatus, getUserProfile } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { LoaderIcon } from "lucide-react"
import { FaGoogle } from "react-icons/fa"

export default function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { checkBanStatus } = useAuth()
  const [loading, setLoading] = useState(false)

  // Google Sign-in handler
  const handleGoogleSignIn = async () => {
    setLoading(true)
    
    try {
      console.log("Starting Google Sign-in...")
      
      // Sign in with Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      
      if (error) {
        console.error('Google sign-in error:', error)
        toast({
          title: "লগইন করতে সমস্যা",
          description: error.message || "Google দিয়ে লগইন করতে সমস্যা হয়েছে।",
          variant: "destructive",
        })
        setLoading(false)
        return
      }
      
      console.log('Google sign-in initiated successfully')
      
      // Note: The actual authentication completion happens in AuthCallback
      // So we don't set loading to false here as the page will redirect
      
    } catch (error: any) {
      console.error('Exception in Google sign-in:', error)
      toast({
        title: "ত্রুটি",
        description: error.message || "Google দিয়ে লগইন করতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
          <CardTitle className="text-3xl font-bold">স্বাগতম</CardTitle>
          <CardDescription className="text-blue-100 text-base">
            ডিপ্লোমা বাজারে লগইন করুন
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-8 pb-8">
          {/* Google Sign-in Button */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-base"
          >
            {loading ? (
              <>
                <LoaderIcon className="mr-3 h-5 w-5 animate-spin" />
                লগইন হচ্ছে...
              </>
            ) : (
              <>
                <FaGoogle className="mr-3 h-5 w-5 text-red-500" />
                Google দিয়ে লগইন করুন
              </>
            )}
          </Button>

          {/* Info Section */}
          <div className="text-center space-y-3 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              প্রথমবার ব্যবহার করছেন?
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Google দিয়ে লগইন করার পর আপনাকে প্রোফাইল তথ্য পূরণ করতে হবে।
            </p>
          </div>

          {/* Help Section */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">
              সমস্যা হচ্ছে?{" "}
              <a 
                href="https://www.facebook.com/diplomabazar/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline font-medium"
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

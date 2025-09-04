import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Link, Mail, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AccountLinkingPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  
  // Google user email from URL params (passed from AuthCallback)
  const googleEmail = searchParams.get('google_email')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAccountLinking = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First, verify the old email/password credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        toast({
          title: "লগইন ত্রুটি",
          description: "আপনার পুরনো ইমেইল বা পাসওয়ার্ড সঠিক নয়।",
          variant: "destructive",
        })
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

      const oldUserId = signInData.user.id

      // Get the old user's profile data
      const { data: oldProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', oldUserId)
        .single()

      if (profileError || !oldProfile) {
        toast({
          title: "ত্রুটি",
          description: "পুরনো প্রোফাইল ডাটা পাওয়া যায়নি।",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Sign out from old account
      await supabase.auth.signOut()

      // Now sign in with Google to get the Google user ID
      const { data: googleData, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/account-merge?old_profile=${encodeURIComponent(JSON.stringify(oldProfile))}&old_user_id=${oldUserId}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (googleError) {
        toast({
          title: "Google লগইন ত্রুটি",
          description: "Google দিয়ে লগইন করতে সমস্যা হয়েছে।",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // The redirect will handle the rest
      console.log('Redirecting to Google for account linking...')

    } catch (error: any) {
      console.error('Account linking error:', error)
      toast({
        title: "ত্রুটি",
        description: error.message || "অ্যাকাউন্ট লিংক করতে সমস্যা হয়েছে।",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center justify-center">
            <Link className="mr-2 h-6 w-6" />
            অ্যাকাউন্ট লিংক করুন
          </CardTitle>
          <CardDescription className="text-blue-100 text-sm">
            পুরনো অ্যাকাউন্ট Google এর সাথে যুক্ত করুন
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6 pb-6">
          {googleEmail && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Google Email:</strong> {googleEmail}
                <br />
                <span className="text-sm text-gray-600">
                  এই Google অ্যাকাউন্ট আপনার পুরনো অ্যাকাউন্টের সাথে লিংক হবে।
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">পুরনো অ্যাকাউন্টের তথ্য</h3>
            <p className="text-sm text-gray-600">
              আপনার পুরনো ইমেইল এবং পাসওয়ার্ড দিয়ে যাচাই করুন:
            </p>
          </div>

          <form onSubmit={handleAccountLinking} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                পুরনো ইমেইল
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="আপনার পুরনো ইমেইল ঠিকানা"
                value={formData.email}
                onChange={handleChange}
                required
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center">
                <Lock className="mr-2 h-4 w-4" />
                পুরনো পাসওয়ার্ড
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="আপনার পুরনো পাসওয়ার্ড"
                value={formData.password}
                onChange={handleChange}
                required
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md" 
              disabled={loading}
            >
              {loading ? "যাচাই করা হচ্ছে..." : "অ্যাকাউন্ট লিংক করুন"}
            </Button>
          </form>

          <div className="text-center space-y-3 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              পুরনো অ্যাকাউন্ট মনে নেই?{" "}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 font-medium hover:underline"
              >
                নতুন অ্যাকাউন্ট তৈরি করুন
              </button>
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              লিংক করার পর আপনি Google দিয়ে লগইন করতে পারবেন এবং আপনার পুরনো সব ডাটা থাকবে।
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

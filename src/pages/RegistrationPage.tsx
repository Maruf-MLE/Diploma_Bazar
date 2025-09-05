import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, EyeOff, Play } from "lucide-react"

export default function RegistrationPage() {
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    semester: "",
    department: "",
    instituteName: "",
  })
  const [loading, setLoading] = useState(false)
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Check if user is authenticated via Google
    if (!user) {
      toast({
        title: "ত্রুটি",
        description: "আপনাকে প্রথমে Google দিয়ে লগইন করতে হবে।",
        variant: "destructive",
      })
      navigate('/login')
      setLoading(false)
      return
    }

    try {
      console.log("🚀 প্রোফাইল আপডেট শুরু হচ্ছে")
      console.log("👤 User Info:", { 
        id: user.id, 
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata 
      })
      console.log("📝 Form Data:", formData)
      
      // First check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing profile:', checkError)
        throw new Error(`Profile check failed: ${checkError.message}`)
      }
      
      console.log("🔍 Existing profile:", existingProfile)
      
      const userData = {
        id: user.id,
        name: formData.name,
        // email field removed - it's handled by Supabase auth
        roll_number: formData.rollNumber,
        semester: formData.semester,
        department: formData.department,
        institute_name: formData.instituteName,
        created_at: existingProfile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log("💾 Profile data to save:", userData);

      // Insert or update the user's profile in the database using upsert
      const { data, error } = await supabase
        .from('profiles')
        .upsert(userData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Profile upsert error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log("✅ প্রোফাইল সফলভাবে সেভ হয়েছে:", data);

      // Success message
      toast({
        title: "সফল",
        description: "আপনার প্রোফাইল সফলভাবে সম্পূর্ণ হয়েছে।",
      })
      
      // Redirect to home page
      navigate("/")
      
    } catch (error: any) {
      console.error("প্রোফাইল আপডেট ত্রুটি:", error)
      toast({
        title: "ত্রুটি",
        description: error.message || "প্রোফাইল আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // প্রতিষ্ঠান, সেমিস্টার, বিভাগ ড্রপডাউনের জন্য ডাটা - SellBookPage থেকে
  const institutions = [
    { value: 'বাংলাদেশ ইনস্টিটিউট অফ গ্লাস এন্ড সেরামিকস', label: 'বাংলাদেশ ইনস্টিটিউট অফ গ্লাস এন্ড সেরামিকস' },
    { value: 'বাংলাদেশ সার্ভে ইনস্টিটিউট', label: 'বাংলাদেশ সার্ভে ইনস্টিটিউট' },
    { value: 'বাংলাদেশ সুইডেন পলিটেকনিক ইনস্টিটিউট', label: 'বাংলাদেশ সুইডেন পলিটেকনিক ইনস্টিটিউট' },
    { value: 'বগুড়া পলিটেকনিক ইনস্টিটিউট', label: 'বগুড়া পলিটেকনিক ইনস্টিটিউট' },
    { value: 'বরগুনা পলিটেকনিক ইনস্টিটিউট', label: 'বরগুনা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'বরিশাল পলিটেকনিক ইনস্টিটিউট', label: 'বরিশাল পলিটেকনিক ইনস্টিটিউট' },
    { value: 'ব্রাহ্মণবাড়িয়া পলিটেকনিক ইনস্টিটিউট', label: 'ব্রাহ্মণবাড়িয়া পলিটেকনিক ইনস্টিটিউট' },
    { value: 'চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট', label: 'চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট' },
    { value: 'চট্টগ্রাম মহিলা পলিটেকনিক ইনস্টিটিউট', label: 'চট্টগ্রাম মহিলা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'চাঁদপুর পলিটেকনিক ইনস্টিটিউট', label: 'চাঁদপুর পলিটেকনিক ইনস্টিটিউট' },
    { value: 'চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট', label: 'চাঁপাইনবাবগঞ্জ পলিটেকনিক ইনস্টিটিউট' },
    { value: 'দিনাজপুর পলিটেকনিক ইনস্টিটিউট', label: 'দিনাজপুর পলিটেকনিক ইনস্টিটিউট' },
    { value: 'ঢাকা পলিটেকনিক ইনস্টিটিউট', label: 'ঢাকা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'ঢাকা মহিলা পলিটেকনিক ইনস্টিটিউট', label: 'ঢাকা মহিলা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'ফরিদপুর পলিটেকনিক ইনস্টিটিউট', label: 'ফরিদপুর পলিটেকনিক ইনস্টিটিউট' },
    { value: 'ফেনী কম্পিউটার ইনস্টিটিউট', label: 'ফেনী কম্পিউটার ইনস্টিটিউট' },
    { value: 'ফেনী পলিটেকনিক ইনস্টিটিউট', label: 'ফেনী পলিটেকনিক ইনস্টিটিউট' },
    { value: 'গোপালগঞ্জ পলিটেকনিক ইনস্টিটিউট', label: 'গোপালগঞ্জ পলিটেকনিক ইনস্টিটিউট' },
    { value: 'গ্রাফিক আর্টস ইনস্টিটিউট (ঢাকা)', label: 'গ্রাফিক আর্টস ইনস্টিটিউট (ঢাকা)' },
    { value: 'হবিগঞ্জ পলিটেকনিক ইনস্টিটিউট', label: 'হবিগঞ্জ পলিটেকনিক ইনস্টিটিউট' },
    { value: 'যশোর পলিটেকনিক ইনস্টিটিউট', label: 'যশোর পলিটেকনিক ইনস্টিটিউট' },
    { value: 'ঝিনাইদহ পলিটেকনিক ইনস্টিটিউট', label: 'ঝিনাইদহ পলিটেকনিক ইনস্টিটিউট' },
    { value: 'খুলনা পলিটেকনিক ইনস্টিটিউট', label: 'খুলনা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'খুলনা মহিলা পলিটেকনিক ইনস্টিটিউট', label: 'খুলনা মহিলা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'কিশোরগঞ্জ পলিটেকনিক ইনস্টিটিউট', label: 'কিশোরগঞ্জ পলিটেকনিক ইনস্টিটিউট' },
    { value: 'কক্সবাজার পলিটেকনিক ইনস্টিটিউট', label: 'কক্সবাজার পলিটেকনিক ইনস্টিটিউট' },
    { value: 'কুড়িগ্রাম পলিটেকনিক ইনস্টিটিউট', label: 'কুড়িগ্রাম পলিটেকনিক ইনস্টিটিউট' },
    { value: 'কুমিল্লা পলিটেকনিক ইনস্টিটিউট', label: 'কুমিল্লা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'কুষ্টিয়া পলিটেকনিক ইনস্টিটিউট', label: 'কুষ্টিয়া পলিটেকনিক ইনস্টিটিউট' },
    { value: 'লক্ষ্মীপুর পলিটেকনিক ইনস্টিটিউট', label: 'লক্ষ্মীপুর পলিটেকনিক ইনস্টিটিউট' },
    { value: 'মাগুরা পলিটেকনিক ইনস্টিটিউট', label: 'মাগুরা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'মৌলভীবাজার পলিটেকনিক ইনস্টিটিউট', label: 'মৌলভীবাজার পলিটেকনিক ইনস্টিটিউট' },
    { value: 'ময়মনসিংহ পলিটেকনিক ইনস্টিটিউট', label: 'ময়মনসিংহ পলিটেকনিক ইনস্টিটিউট' },
    { value: 'মুন্সিগঞ্জ পলিটেকনিক ইনস্টিটিউট', label: 'মুন্সিগঞ্জ পলিটেকনিক ইনস্টিটিউট' },
    { value: 'নওগাঁ পলিটেকনিক ইনস্টিটিউট', label: 'নওগাঁ পলিটেকনিক ইনস্টিটিউট' },
    { value: 'নরসিংদী পলিটেকনিক ইনস্টিটিউট', label: 'নরসিংদী পলিটেকনিক ইনস্টিটিউট' },
    { value: 'পাবনা পলিটেকনিক ইনস্টিটিউট', label: 'পাবনা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'পটুয়াখালী পলিটেকনিক ইনস্টিটিউট', label: 'পটুয়াখালী পলিটেকনিক ইনস্টিটিউট' },
    { value: 'রাজশাহী পলিটেকনিক ইনস্টিটিউট', label: 'রাজশাহী পলিটেকনিক ইনস্টিটিউট' },
    { value: 'রাজশাহী মহিলা পলিটেকনিক ইনস্টিটিউট', label: 'রাজশাহী মহিলা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'রংপুর পলিটেকনিক ইনস্টিটিউট', label: 'রংপুর পলিটেকনিক ইনস্টিটিউট' },
    { value: 'সাতক্ষীরা পলিটেকনিক ইনস্টিটিউট', label: 'সাতক্ষীরা পলিটেকনিক ইনস্টিটিউট' },
    { value: 'শরীয়তপুর পলিটেকনিক ইনস্টিটিউট', label: 'শরীয়তপুর পলিটেকনিক ইনস্টিটিউট' },
    { value: 'শেরপুর পলিটেকনিক ইনস্টিটিউট', label: 'শেরপুর পলিটেকনিক ইনস্টিটিউট' },
    { value: 'সিরাজগঞ্জ পলিটেকনিক ইনস্টিটিউট', label: 'সিরাজগঞ্জ পলিটেকনিক ইনস্টিটিউট' },
    { value: 'সিলেট পলিটেকনিক ইনস্টিটিউট', label: 'সিলেট পলিটেকনিক ইনস্টিটিউট' },
    { value: 'টাঙ্গাইল পলিটেকনিক ইনস্টিটিউট', label: 'টাঙ্গাইল পলিটেকনিক ইনস্টিটিউট' },
    { value: 'ঠাকুরগাঁও পলিটেকনিক ইনস্টিটিউট', label: 'ঠাকুরগাঁও পলিটেকনিক ইনস্টিটিউট' },
    { value: 'ভোলা পলিটেকনিক ইনস্টিটিউট', label: 'ভোলা পলিটেকনিক ইনস্টিটিউট' }
  ];

  const departments = [
    { value: 'কম্পিউটার টেকনোলজি', label: 'কম্পিউটার টেকনোলজি' },
    { value: 'সিভিল টেকনোলজি', label: 'সিভিল টেকনোলজি' },
    { value: 'ইলেকট্রিক্যাল টেকনোলজি', label: 'ইলেকট্রিক্যাল টেকনোলজি' },
    { value: 'মেকানিক্যাল টেকনোলজি', label: 'মেকানিক্যাল টেকনোলজি' },
    { value: 'ইলেকট্রনিক্স টেকনোলজি', label: 'ইলেকট্রনিক্স টেকনোলজি' },
    { value: 'পাওয়ার টেকনোলজি', label: 'পাওয়ার টেকনোলজি' },
    { value: 'মেকাট্রনিক্স টেকনোলজি', label: 'মেকাট্রনিক্স টেকনোলজি' },
    { value: 'রেফ্রিজারেশন অ্যান্ড এয়ার কন্ডিশনিং টেকনোলজি', label: 'রেফ্রিজারেশন অ্যান্ড এয়ার কন্ডিশনিং টেকনোলজি' },
    { value: 'অটোমোবাইল টেকনোলজি', label: 'অটোমোবাইল টেকনোলজি' },
    { value: 'টেক্সটাইল টেকনোলজি', label: 'টেক্সটাইল টেকনোলজি' },
    { value: 'শিপবিল্ডিং টেকনোলজি', label: 'শিপবিল্ডিং টেকনোলজি' },
    { value: 'মেরিন টেকনোলজি', label: 'মেরিন টেকনোলজি' },
    { value: 'ফুড টেকনোলজি', label: 'ফুড টেকনোলজি' },
    { value: 'আর্কিটেকচার', label: 'আর্কিটেকচার' },
    { value: 'কেমিক্যাল টেকনোলজি', label: 'কেমিক্যাল টেকনোলজি' },
    { value: 'বায়োমেডিকেল টেকনোলজি', label: 'বায়োমেডিকেল টেকনোলজি' },
    { value: 'এনভায়রনমেন্টাল টেকনোলজি', label: 'এনভায়রনমেন্টাল টেকনোলজি' },
    { value: 'মাইনিং টেকনোলজি', label: 'মাইনিং টেকনোলজি' },
    { value: 'নিউক্লিয়ার টেকনোলজি', label: 'নিউক্লিয়ার টেকনোলজি' },
    { value: 'পেট্রোলিয়াম টেকনোলজি', label: 'পেট্রোলিয়াম টেকনোলজি' }
  ];

  const semesters = [
    { value: '১ম সেমিস্টার', label: '১ম সেমিস্টার' },
    { value: '২য় সেমিস্টার', label: '২য় সেমিস্টার' },
    { value: '৩য় সেমিস্টার', label: '৩য় সেমিস্টার' },
    { value: '৪র্থ সেমিস্টার', label: '৪র্থ সেমিস্টার' },
    { value: '৫ম সেমিস্টার', label: '৫ম সেমিস্টার' },
    { value: '৬ষ্ঠ সেমিস্টার', label: '৬ষ্ঠ সেমিস্টার' },
    { value: '৭ম সেমিস্টার', label: '৭ম সেমিস্টার' },
    { value: '৮ম সেমিস্টার', label: '৮ম সেমিস্টার' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">প্রোফাইল সম্পূর্ণ করুন</CardTitle>
          <CardDescription className="text-blue-100 mb-4">
            আপনার প্রোফাইল তথ্য পূরণ করে অ্যাকাউন্ট সম্পূর্ণ করুন
          </CardDescription>
          
          {/* Video Guide Button */}
         
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {/* User info section */}
            {user && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>আপনার ইমেইল:</strong> {user.email}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Google দিয়ে সফলভাবে লগইন হয়েছে। এখন প্রোফাইল তথ্য পূরণ করুন।
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">পূর্ণ নাম</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="আপনার পূর্ণ নাম"
                value={formData.name}
                onChange={handleChange}
                required
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollNumber">রোল নম্বর</Label>
              <Input
                id="rollNumber"
                name="rollNumber"
                type="text"
                placeholder="আপনার রোল নম্বর"
                value={formData.rollNumber}
                onChange={handleChange}
                required
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">সেমিস্টার</Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => handleSelectChange("semester", value)}
              >
                <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="সেমিস্টার নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectGroup>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.value} value={semester.value}>
                        {semester.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">বিভাগ</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleSelectChange("department", value)}
              >
                <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="বিভাগ নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectGroup>
                    {departments.map((department) => (
                      <SelectItem key={department.value} value={department.value}>
                        {department.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instituteName">প্রতিষ্ঠানের নাম</Label>
              <Select
                value={formData.instituteName}
                onValueChange={(value) => handleSelectChange("instituteName", value)}
              >
                <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="প্রতিষ্ঠানের নাম নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectGroup>
                    {institutions.map((institution) => (
                      <SelectItem key={institution.value} value={institution.value}>
                        {institution.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md" 
              disabled={loading}
            >
              {loading ? "প্রক্রিয়াকরণ হচ্ছে..." : "প্রোফাইল সম্পূর্ণ করুন"}
            </Button>
            <div className="text-sm text-center text-gray-600 space-y-2">
              <p>
                ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                <Link to="/login" className="text-blue-600 font-medium hover:underline">
                  লগইন করুন
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
      
      {/* Video Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-3xl w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800">কিভাবে অ্যাকাউন্ট খুলবেন - ভিডিও গাইড</DialogTitle>
          </DialogHeader>
          <div className="relative pb-[56.25%] h-0 mt-4 rounded-lg overflow-hidden shadow-xl border border-slate-200">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/TnFQT6uj6iU?si=CqQvhPgB7hxp0OzE"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

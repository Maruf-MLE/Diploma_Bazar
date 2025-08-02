# Supabase Email Template ঠিক করার নির্দেশিকা

## ১. Supabase Dashboard এ লগইন করুন
- https://supabase.com/dashboard এ যান
- আপনার প্রোজেক্ট `yryerjgidsyfiohmpeoc` সিলেক্ট করুন

## ২. Authentication > Email Templates এ যান
- বাম সাইডবার থেকে **Authentication** ক্লিক করুন
- **Email Templates** ট্যাবে ক্লিক করুন
- **Reset Password** টেমপ্লেট সিলেক্ট করুন

## ৩. Email Template আপডেট করুন

### Subject (বিষয়):
```
পাসওয়ার্ড রিসেট - বই চাপা বাজার
```

### Body (HTML):
```html
<div style="background-color: #f9fafb; padding: 40px 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #1f2937; text-align: center; margin-bottom: 30px;">পাসওয়ার্ড রিসেট</h1>
        
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">প্রিয় ব্যবহারকারী,</p>
        
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px;">আপনার পাসওয়ার্ড রিসেট করার জন্য নিচের বাটনে ক্লিক করুন:</p>
        
        <div style="text-align: center; margin-bottom: 30px;">
            <a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">পাসওয়ার্ড রিসেট করুন</a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">যদি বাটনটি কাজ না করে, নিচের লিংকটি কপি করে ব্রাউজারে পেস্ট করুন:</p>
        <p style="color: #6b7280; font-size: 14px; word-break: break-all;">{{ .ConfirmationURL }}</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">যদি আপনি পাসওয়ার্ড রিসেটের জন্য অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">ধন্যবাদান্তে,<br>বই চাপা বাজার টিম</p>
        </div>
    </div>
</div>
```

### Confirmation URL (গুরুত্বপূর্ণ):
```
{{ .SiteURL }}/reset-password?token={{ .TokenHash }}&type=recovery
```

## ৪. URL Configuration ঠিক করুন
- **Authentication > URL Configuration** এ যান
- **Site URL**: `http://localhost:8080`
- **Redirect URLs** এ যোগ করুন:
  - `http://localhost:8080/reset-password`
  - `http://localhost:8080/auth/callback`
  - `http://localhost:8080`

## ৫. Save Changes বাটনে ক্লিক করুন

এই পরিবর্তনের পর ইমেইলে বাটন এবং লিংক দুটোই সরাসরি `/reset-password` পেজে নিয়ে যাবে।

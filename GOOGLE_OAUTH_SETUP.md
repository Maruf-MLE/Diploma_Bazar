# Google OAuth সেটআপ গাইড

বই-চাপা-বাজার অ্যাপ্লিকেশনে Google Sign-in সক্রিয় করার জন্য নিম্নলিখিত পদক্ষেপগুলি অনুসরণ করুন।

## ১. Google Cloud Console সেটআপ

### ক. Google Cloud Project তৈরি করুন
1. [Google Cloud Console](https://console.cloud.google.com/) এ যান
2. নতুন প্রজেক্ট তৈরি করুন অথবা বিদ্যমান প্রজেক্ট সিলেক্ট করুন
3. প্রজেক্টের নাম: `বই-চাপা-বাজার` বা আপনার পছন্দমত

### খ. API সক্রিয় করুন
1. APIs & Services > Library এ যান
2. "Google Identity" বা "Google+ API" খুঁজুন
3. Enable করুন

### গ. OAuth 2.0 Credentials তৈরি করুন
1. APIs & Services > Credentials এ যান
2. "+ CREATE CREDENTIALS" ক্লিক করুন
3. "OAuth client ID" সিলেক্ট করুন
4. Application type: "Web application"
5. Name: `বই-চাপা-বাজার Web Client`

### ঘ. Authorized JavaScript origins যোগ করুন
নিম্নলিখিত Origins যোগ করুন:
- `http://localhost:8080` (Local development)
- `https://diplomabazar.vercel.app` (Production domain)

### ঙ. Authorized redirect URIs যোগ করুন
নিম্নলিখিত URIs যোগ করুন:

**Supabase Callback (সব environment এর জন্য):**
- `https://yryerjgidsyfiohmpeoc.supabase.co/auth/v1/callback`

**Local Development:**
- `http://localhost:8080/auth/callback`

**Production:**
- `https://diplomabazar.vercel.app/auth/callback`

### ঙ. Client ID ও Secret সংগ্রহ করুন
1. Credentials তৈরি হওয়ার পর Client ID ও Client Secret কপি করুন
2. এগুলো নিরাপদে সংরক্ষণ করুন

## ২. Local Environment সেটআপ

### ক. Environment Variables সেটআপ
1. `.env.example` ফাইলটি `.env.local` নামে কপি করুন:
```bash
cp .env.example .env.local
```

2. `.env.local` ফাইলে Google credentials যোগ করুন:
```
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
```

### খ. Supabase Local Development
1. Supabase CLI ইনস্টল করুন (যদি না থাকে):
```bash
npm install -g @supabase/cli
```

2. Supabase local server চালু করুন:
```bash
supabase start
```

3. এটি স্বয়ংক্রিয়ভাবে Google OAuth provider সক্রিয় করবে

## ৩. Testing

### ক. Development Server চালু করুন
```bash
npm run dev
```

### খ. Google Sign-in টেস্ট করুন
1. `http://localhost:8080` এ যান
2. Login পেজে যান
3. "Google দিয়ে সাইন ইন করুন" বাটনে ক্লিক করুন
4. Google OAuth flow সম্পন্ন করুন
5. সফলভাবে লগইন হলে profile completion পেজে redirect হবে

## ৪. Production Deployment

### ক. Production Environment Variables
Production এ deploy করার সময় নিম্নলিখিত environment variables সেট করুন:

```
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-supabase-anon-key
```

### খ. Redirect URIs আপডেট করুন
Google Cloud Console এ production domain এর জন্য redirect URIs যোগ করুন।

## ৫. Troubleshooting

### সাধারণ সমস্যা ও সমাধান:

#### "redirect_uri_mismatch" Error
- Google Cloud Console এ সঠিক redirect URI যোগ করা হয়েছে কিনা চেক করুন
- URI exactly match করতে হবে (trailing slash সহ/ছাড়া)

#### "invalid_client" Error
- Client ID ও Secret সঠিক কিনা চেক করুন
- Environment variables সঠিকভাবে load হচ্ছে কিনা দেখুন

#### Supabase Connection Issues
- Supabase local server চালু আছে কিনা চেক করুন (`supabase status`)
- Environment variables এ সঠিক Supabase URL আছে কিনা দেখুন

## ৬. Security Notes

⚠️ **গুরুত্বপূর্ণ সিকিউরিটি টিপস:**
- কখনই Client Secret git repository তে commit করবেন না
- Production এ environment variables secure store করুন
- Regular basis এ credentials rotate করুন
- শুধুমাত্র প্রয়োজনীয় redirect URIs যোগ করুন

## ৭. Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

---

এই গাইড অনুসরণ করে আপনি সফলভাবে Google OAuth সেটআপ করতে পারবেন। কোনো সমস্যা হলে documentation চেক করুন অথবা সাপোর্ট নিন।

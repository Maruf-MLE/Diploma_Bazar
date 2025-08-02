# Supabase সেটিংস ম্যানুয়ালি আপডেট করার নির্দেশিকা

যেহেতু SQL কমান্ড কাজ করছে না, আমরা Supabase ড্যাশবোর্ড থেকে সেটিংস আপডেট করব।

## ১. ইমেইল টেমপ্লেট আপডেট করুন

1. Supabase ড্যাশবোর্ডে লগইন করুন
2. বাম পাশের মেনু থেকে **Authentication** সিলেক্ট করুন
3. **Email Templates** ট্যাবে ক্লিক করুন
4. **Confirm signup** টেমপ্লেট সিলেক্ট করুন
5. নিচের কন্টেন্ট দিয়ে আপডেট করুন:

**Subject (বিষয়):**
```
ইমেইল যাচাইকরণ
```

**Body (HTML):**
```html
<h2>ইমেইল যাচাইকরণ</h2>
<p>প্রিয় ব্যবহারকারী,</p>
<p>আপনার ইমেইল যাচাই করতে নিচের বাটনে ক্লিক করুন:</p>
<a href="{{.ConfirmationURL}}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">ইমেইল যাচাই করুন</a>
<p>অথবা এই লিংকে ক্লিক করুন: <a href="{{.ConfirmationURL}}">{{.ConfirmationURL}}</a></p>
<p>যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।</p>
<p>ধন্যবাদান্তে,<br>বই চাপা বাজার টিম</p>
```

6. **Save Changes** বাটনে ক্লিক করুন

## ২. URL কনফিগারেশন আপডেট করুন

1. বাম পাশের মেনু থেকে **Authentication** সিলেক্ট করুন
2. **URL Configuration** ট্যাবে ক্লিক করুন
3. **Site URL** ফিল্ডে `http://localhost:8080` লিখুন
4. **Redirect URLs** সেকশনে নিচের URL গুলো যোগ করুন:
   - `http://localhost:8080/auth/callback`
   - `http://localhost:8080`
   - `http://localhost:8080/login`
   - `http://localhost:8080/register`
   - `http://localhost:8080/profile`
5. **Save** বাটনে ক্লিক করুন

## ৩. ইমেইল কনফিগারেশন চেক করুন

1. বাম পাশের মেনু থেকে **Authentication** সিলেক্ট করুন
2. **Providers** ট্যাবে ক্লিক করুন
3. **Email** প্রোভাইডার সিলেক্ট করুন
4. নিশ্চিত করুন যে **Confirm email** অপশন এনাবল করা আছে
5. **Save** বাটনে ক্লিক করুন

## ৪. টোকেন এক্সপায়ার টাইম বাড়ানো

1. বাম পাশের মেনু থেকে **Authentication** সিলেক্ট করুন
2. **Settings** ট্যাবে ক্লিক করুন
3. **User Management** সেকশনে স্ক্রল করুন
4. **Email Confirmation** সেটিংস খুঁজুন এবং টোকেন এক্সপায়ার টাইম `86400` (24 ঘন্টা) সেট করুন
5. **Save** বাটনে ক্লিক করুন

## ৫. এই পরিবর্তনগুলি করার পরে

1. আপনার অ্যাপ্লিকেশন রিস্টার্ট করুন
2. নতুন ইউজার রেজিস্টার করুন
3. ইমেইল চেক করুন এবং ভেরিফিকেশন লিংকে ক্লিক করুন
4. এটি আপনাকে `http://localhost:8080/auth/callback` এ রিডাইরেক্ট করবে 

## ৬. ইমেইল ভেরিফিকেশন সমস্যা সমাধানের আপডেটেড নির্দেশিকা

যদি উপরের পরিবর্তনগুলি করার পরেও ইমেইল ভেরিফিকেশন সমস্যা থাকে, তাহলে নিচের পদক্ষেপগুলি অনুসরণ করুন:

### ৬.১. সঠিক রিডাইরেক্ট URL নিশ্চিত করুন

1. Supabase ড্যাশবোর্ডে **Authentication > URL Configuration** এ যান
2. **Site URL** এবং **Redirect URLs** আপডেট করুন:
   - Site URL: আপনার অ্যাপ্লিকেশনের বর্তমান URL (উদাহরণ: `http://localhost:8080`)
   - Redirect URLs: নিম্নলিখিত URL গুলো যোগ করুন:
     - `http://localhost:8080/auth/callback`
     - `http://localhost:8080/auth/callback/`
     - `http://localhost:8080`
     - `http://localhost:8080/`
     - `http://localhost:8080/login`
     - `http://localhost:8080/register`
     - `http://localhost:8080/profile`
     - `http://localhost`
     - `http://localhost/`

### ৬.২. অথেনটিকেশন সেটিংস আপডেট করুন

1. **Authentication > Settings** এ যান
2. **User Management** সেকশনে:
   - **Enable email confirmations** চেকবক্স সিলেক্ট করুন
   - **Secure email change** চেকবক্স সিলেক্ট করুন
   - **Email confirmation token expiration time** `86400` (24 ঘন্টা) সেট করুন
3. **Save** বাটনে ক্লিক করুন

### ৬.৩. PKCE ফ্লো ব্যবহার করুন

1. আপনার কোডে Supabase ক্লায়েন্ট কনফিগারেশন আপডেট করুন:
```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})
```

### ৬.৪. ইমেইল টেমপ্লেট আপডেট করুন

1. **Authentication > Email Templates** এ যান
2. **Confirmation URL** ফিল্ড নিচের মত সেট করুন:
   - `{{.SiteURL}}/auth/callback#access_token={{.Token}}&refresh_token={{.RefreshToken}}&type=signup&email={{.Email}}`
3. **Save** বাটনে ক্লিক করুন

### ৬.৫. ভেরিফিকেশন লিংক টেস্ট করুন

1. আপনার অ্যাপ্লিকেশন রিস্টার্ট করুন
2. নতুন ইউজার রেজিস্টার করুন
3. ভেরিফিকেশন ইমেইল চেক করুন
4. ভেরিফিকেশন লিংক ক্লিক করার আগে লিংকটি কপি করে ব্রাউজারে পেস্ট করুন এবং URL টি পরীক্ষা করুন
5. লিংকে ক্লিক করে দেখুন যে এটি সঠিকভাবে আপনার অ্যাপ্লিকেশনে রিডাইরেক্ট করছে কিনা

### ৬.৬. ডিবাগিং

যদি সমস্যা থেকে যায়, তাহলে ডিবাগিং এর জন্য:

1. ব্রাউজারের ডেভেলপার টুলস খুলুন (F12)
2. কনসোল ট্যাবে লগ দেখুন
3. নেটওয়ার্ক ট্যাবে রিডাইরেক্ট এবং API কল চেক করুন
4. `AuthCallback.tsx` কম্পোনেন্টে অতিরিক্ত লগিং যোগ করুন
5. URL প্যারামিটার এবং হ্যাশ ভ্যালু কনসোলে লগ করুন 
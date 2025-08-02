# টোকেন এক্সপায়ার টাইম আপডেট করার বিকল্প উপায়

যেহেতু SQL কমান্ড কাজ করছে না, নিচের বিকল্প উপায়গুলো চেষ্টা করুন:

## ১. Supabase CLI ব্যবহার করুন

Supabase CLI ব্যবহার করে আপনি সেটিংস আপডেট করতে পারেন:

```bash
# Supabase CLI ইনস্টল করুন
npm install -g supabase

# লগইন করুন
supabase login

# আপনার প্রজেক্ট ID সেট করুন
supabase link --project-ref yryerjgidsyfiohmpeoc

# কনফিগারেশন আপডেট করুন
supabase functions config set SECURITY_EMAIL_CONFIRMATION_TOKEN_EXPIRATION_TIME 86400
```

## ২. Supabase ড্যাশবোর্ডে সাপোর্ট টিকেট খুলুন

1. Supabase ড্যাশবোর্ডে লগইন করুন
2. নিচের বাম কোণায় **Support** লিংকে ক্লিক করুন
3. একটি টিকেট খুলুন এবং নিচের মেসেজ পাঠান:

```
Subject: Need to increase email confirmation token expiration time

Hello,

I need to increase the email confirmation token expiration time for my project (ID: yryerjgidsyfiohmpeoc).

I would like to set the expiration time to 24 hours (86400 seconds) as the current short expiration time is causing issues with my users' email verification process.

Could you please update this setting for my project?

Thank you.
```

## ৩. Supabase API ব্যবহার করুন

Supabase Management API ব্যবহার করে আপনি সেটিংস আপডেট করতে পারেন:

```javascript
// আপনার Supabase API কী দিয়ে আপডেট করুন
const SUPABASE_API_KEY = 'YOUR_SUPABASE_API_KEY';

fetch('https://api.supabase.com/v1/projects/yryerjgidsyfiohmpeoc/config', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_API_KEY}`
  },
  body: JSON.stringify({
    auth: {
      email_confirmation_token_expiration_time: 86400
    }
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

## ৪. কোড-ভিত্তিক সমাধান

যদি টোকেন এক্সপায়ার টাইম বাড়ানো সম্ভব না হয়, তাহলে আপনি কোডে নিচের সমাধানগুলো ব্যবহার করতে পারেন:

1. **ভেরিফিকেশন লিংক রিসেন্ড করার বাটন যোগ করুন**:
   - লগইন পেজে একটি "ভেরিফিকেশন ইমেইল আবার পাঠান" বাটন যোগ করুন (ইতিমধ্যে করা হয়েছে)

2. **অটোমেটিক রিসেন্ড মেকানিজম**:
   - যদি ইউজার ভেরিফিকেশন লিংকে ক্লিক করে এবং টোকেন এক্সপায়ার হয়ে যায়, তাহলে অটোমেটিকভাবে নতুন ভেরিফিকেশন ইমেইল পাঠান

3. **ভেরিফিকেশন ছাড়াই অস্থায়ী লগইন অনুমতি দিন**:
   - ইউজারকে সীমিত সময়ের জন্য ভেরিফিকেশন ছাড়াই লগইন করতে দিন, কিন্তু সেনসিটিভ অপারেশনের জন্য ভেরিফিকেশন প্রয়োজন হবে

## ৫. Supabase ডকুমেন্টেশন দেখুন

Supabase ডকুমেন্টেশন দেখুন যেখানে টোকেন এক্সপায়ার টাইম সম্পর্কে তথ্য আছে:
https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts#token-expiration

## ৬. ম্যানুয়ালি ভেরিফিকেশন প্রসেস

যদি অটোমেটিক ভেরিফিকেশন কাজ না করে, তাহলে আপনি ম্যানুয়ালি ভেরিফিকেশন প্রসেস সেট আপ করতে পারেন:

1. ইউজার রেজিস্টার করার সময় একটি ভেরিফিকেশন কোড জেনারেট করুন
2. ইউজারকে ইমেইলে কোড পাঠান
3. ইউজার ওয়েবসাইটে লগইন করে কোড দিয়ে ভেরিফাই করবে 
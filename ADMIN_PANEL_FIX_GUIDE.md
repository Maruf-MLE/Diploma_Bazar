# 🔧 Admin Panel Data Loading Issue - Solution Guide

## সমস্যা
Admin verification management page এ কোনো ডেটা লোড হচ্ছে না বা দেখাচ্ছে না।

## সমাধান

### ধাপ ১: Supabase SQL Editor এ SQL Script চালান

1. Supabase Dashboard এ যান
2. SQL Editor সেকশনে যান  
3. `fix_admin_panel_data_loading.sql` ফাইলের সম্পূর্ণ কোড copy করুন
4. SQL Editor এ paste করুন এবং Run করুন

### ধাপ ২: যদি SQL Script কাজ না করে

যদি কোনো কারণে SQL script চালাতে সমস্যা হয়, তাহলে নিচের commands একে একে চালান:

```sql
-- 1. Drop existing function
DROP FUNCTION IF EXISTS public.get_combined_verification_data();

-- 2. Create new function  
CREATE OR REPLACE FUNCTION public.get_combined_verification_data()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  name TEXT,
  roll_no TEXT,
  reg_no TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  photo_url TEXT,
  status TEXT,
  is_verified BOOLEAN,
  institute_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vd.id,
    vd.user_id,
    COALESCE(u.email, '')::TEXT as email,
    COALESCE(p.name, vd.name, 'অজানা')::TEXT as name,
    COALESCE(vd.roll_no, '')::TEXT as roll_no,
    COALESCE(vd.reg_no, '')::TEXT as reg_no,
    COALESCE(vd.document_url, '')::TEXT as document_url,
    vd.created_at,
    vd.updated_at,
    COALESCE(fv.photo_url, '')::TEXT as photo_url,
    COALESCE(vd.status, fv.status, 'pending')::TEXT as status,
    COALESCE(vd.is_verified, false) as is_verified,
    COALESCE(p.institute_name, '')::TEXT as institute_name
  FROM 
    public.verification_data vd
  LEFT JOIN 
    auth.users u ON vd.user_id = u.id
  LEFT JOIN 
    public.profiles p ON vd.user_id = p.id
  LEFT JOIN 
    public.face_verification fv ON vd.user_id = fv.user_id
  ORDER BY vd.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO authenticated;
```

### ধাপ ৩: RLS Policies ঠিক করুন

```sql
-- Enable RLS
ALTER TABLE public.verification_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to select verification_data" ON public.verification_data;

-- Create new policy
CREATE POLICY "Allow all authenticated users to view verification data"
ON public.verification_data FOR SELECT
TO authenticated
USING (true);
```

### ধাপ ৪: Test করুন

SQL Editor এ নিচের query চালান:

```sql
SELECT COUNT(*) FROM get_combined_verification_data();
```

যদি এটি কোনো সংখ্যা return করে (যেমন: 0, 1, 2...), তাহলে function কাজ করছে।

### ধাপ ৫: Test Data তৈরি করুন (যদি প্রয়োজন হয়)

যদি আপনার কোনো verification data না থাকে তাহলে test করার জন্য:

```sql
-- Get a user ID from profiles table
SELECT id FROM public.profiles LIMIT 1;

-- Insert test data (replace USER_ID_HERE with actual ID)
INSERT INTO public.verification_data (
    user_id,
    name,
    roll_no,
    reg_no,
    document_url,
    is_verified,
    status
) VALUES (
    'USER_ID_HERE',
    'Test User',
    '123456',
    'REG123456',
    'https://example.com/test-document.jpg',
    false,
    'pending'
);
```

## যদি তবুও কাজ না করে

### Troubleshooting Steps:

1. **Browser Console চেক করুন:**
   - F12 চেপে Developer Tools খুলুন
   - Console tab এ যান
   - কোনো error দেখাচ্ছে কিনা দেখুন

2. **Network tab চেক করুন:**
   - Network tab এ যান
   - Admin page reload করুন
   - API calls fail হচ্ছে কিনা দেখুন

3. **Supabase RLS Policies চেক করুন:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'verification_data';
   ```

4. **Manually test করুন:**
   ```sql
   SELECT * FROM public.verification_data LIMIT 5;
   ```

## Important Notes:

- ⚠️ SQL script চালানোর পর browser cache clear করুন
- 🔄 Admin page এ "রিফ্রেশ" বাটন চেপে দেখুন
- 📊 যদি "কোন ডেটা পাওয়া যায়নি" দেখায়, তাহলে প্রথমে নিশ্চিত করুন যে কোনো user verification request করেছে
- 🐛 Development mode এ আপনি automatically admin access পাবেন

## Contact

যদি এখনও সমস্যা থাকে, তাহলে browser console এর error message এবং Supabase logs শেয়ার করুন।

-- এডমিন অ্যাকসেস ফিক্স করার জন্য SQL স্ক্রিপ্ট
-- এই স্ক্রিপ্টটি Supabase SQL এডিটরে চালাতে হবে

-- 1. admin_users টেবিলের RLS পলিসি আপডেট করি
-- আগের পলিসি বাতিল করি
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;

-- নতুন পলিসি তৈরি করি যা সব authenticated ইউজারকে অ্যাকসেস দেয়
CREATE POLICY "Anyone can view admin_users" 
ON public.admin_users 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. admin_users টেবিলে INSERT এর জন্য পলিসি তৈরি করি
CREATE POLICY "Service role can insert admin_users" 
ON public.admin_users 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- 3. is_admin ফাংশন আপডেট করি
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. সব টেবিলের RLS পলিসি চেক করি
-- আপনি যদি admin_users টেবিল ছাড়া অন্য কোন টেবিলে RLS সমস্যা থাকে, সেটাও ঠিক করতে পারেন

-- 5. আপনার ইউজার আইডি admin_users টেবিলে যোগ করি
-- এখানে আপনার ইউজার আইডি বসান
DO $$
DECLARE
  user_email TEXT := 'আপনার_ইমেইল@example.com'; -- এখানে আপনার ইমেইল লিখুন
  user_id UUID;
BEGIN
  -- ইমেইল দিয়ে ইউজার আইডি খুঁজি
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  -- যদি ইউজার পাওয়া যায়
  IF user_id IS NOT NULL THEN
    -- চেক করি ইউজার ইতিমধ্যে এডমিন কিনা
    IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = user_id) THEN
      -- এডমিন টেবিলে ইউজার যোগ করি
      INSERT INTO public.admin_users (user_id) VALUES (user_id);
      RAISE NOTICE 'ইউজার এডমিন হিসেবে যোগ করা হয়েছে। ইমেইল: %, ইউজার আইডি: %', user_email, user_id;
    ELSE
      RAISE NOTICE 'ইউজার ইতিমধ্যে এডমিন আছে। ইমেইল: %, ইউজার আইডি: %', user_email, user_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'এই ইমেইলের কোনো ইউজার পাওয়া যায়নি: %', user_email;
  END IF;
END $$; 
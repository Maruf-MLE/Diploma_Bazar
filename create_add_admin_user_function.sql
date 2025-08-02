-- Supabase SQL এডিটরে চালানোর জন্য একটি ফাংশন তৈরি করছি যা ইউজারকে এডমিন হিসেবে যোগ করবে

-- admin_users টেবিলের RLS পলিসি আপডেট করি
-- আগের পলিসি বাতিল করি
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;

-- নতুন পলিসি তৈরি করি যা সব authenticated ইউজারকে অ্যাকসেস দেয়
CREATE POLICY "Anyone can view admin_users" 
ON public.admin_users 
FOR SELECT 
TO authenticated 
USING (true);

-- add_admin_user ফাংশন তৈরি করি
CREATE OR REPLACE FUNCTION public.add_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- চেক করি ইউজার ইতিমধ্যে এডমিন কিনা
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = $1) THEN
    RETURN TRUE;
  END IF;
  
  -- এডমিন টেবিলে ইউজার যোগ করি
  INSERT INTO public.admin_users (user_id) VALUES ($1);
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ফাংশনটি authenticated ইউজারদের জন্য এক্সিকিউট করার অনুমতি দেই
GRANT EXECUTE ON FUNCTION public.add_admin_user(UUID) TO authenticated;

-- আপনার ইউজার আইডি দিয়ে ফাংশনটি চালাই
SELECT public.add_admin_user('আপনার_ইউজার_আইডি');

-- আপনার ইমেইল দিয়ে ইউজার আইডি খুঁজে বের করে ফাংশনটি চালাই
DO $$
DECLARE
  user_email TEXT := 'আপনার_ইমেইল@example.com'; -- এখানে আপনার ইমেইল লিখুন
  user_id UUID;
BEGIN
  -- ইমেইল দিয়ে ইউজার আইডি খুঁজি
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  -- যদি ইউজার পাওয়া যায়
  IF user_id IS NOT NULL THEN
    -- ফাংশনটি চালাই
    PERFORM public.add_admin_user(user_id);
    RAISE NOTICE 'ইউজার এডমিন হিসেবে যোগ করা হয়েছে। ইমেইল: %, ইউজার আইডি: %', user_email, user_id;
  ELSE
    RAISE EXCEPTION 'এই ইমেইলের কোনো ইউজার পাওয়া যায়নি: %', user_email;
  END IF;
END $$; 
-- =====================================================
-- ADMIN SECURITY SETUP - Complete SQL Script
-- =====================================================
-- This script will secure your admin panel properly
-- Run this in Supabase SQL Editor

-- ১. admin_users টেবিলে RLS enable করি
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ২. সব পুরানো policies মুছে ফেলি (যদি থাকে)
DROP POLICY IF EXISTS "Allow authenticated users to view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Only service role can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Only service role can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Only service role can delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Anyone can view admin_users" ON public.admin_users;

-- ৩. নতুন secure policies তৈরি করি
CREATE POLICY "Allow authenticated users to view admin_users" 
ON public.admin_users 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Only service role can insert admin_users" 
ON public.admin_users 
FOR INSERT 
TO service_role 
WITH CHECK (true);

CREATE POLICY "Only service role can update admin_users" 
ON public.admin_users 
FOR UPDATE 
TO service_role 
USING (true);

CREATE POLICY "Only service role can delete admin_users" 
ON public.admin_users 
FOR DELETE 
TO service_role 
USING (true);

-- ৪. পুরানো is_admin function মুছে ফেলি এবং নতুন তৈরি করি
DROP FUNCTION IF EXISTS public.is_admin(UUID);

CREATE FUNCTION public.is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- চেক করি user_id admin_users টেবিলে আছে কিনা
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- function এ execute permission দেই
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- ৫. Admin user add করার secure function
CREATE OR REPLACE FUNCTION public.add_admin_user(target_email TEXT)
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
  result JSON;
BEGIN
  -- Email দিয়ে user_id খুঁজি
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;
  
  -- যদি user পাওয়া না যায়
  IF target_user_id IS NULL THEN
    result := json_build_object(
      'success', false,
      'error', 'User not found with email: ' || target_email
    );
    RETURN result;
  END IF;
  
  -- চেক করি user ইতিমধ্যে admin কিনা
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = target_user_id) THEN
    result := json_build_object(
      'success', false,
      'error', 'User is already an admin'
    );
    RETURN result;
  END IF;
  
  -- Admin হিসেবে add করি
  INSERT INTO public.admin_users (user_id) VALUES (target_user_id);
  
  result := json_build_object(
    'success', true,
    'message', 'User successfully added as admin',
    'user_id', target_user_id,
    'email', target_email
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- শুধু service_role এ execute permission
GRANT EXECUTE ON FUNCTION public.add_admin_user(TEXT) TO service_role;

-- ৬. আপনার নিজের ইমেইল দিয়ে admin add করুন
-- নিচের ইমেইল পরিবর্তন করুন আপনার ইমেইল দিয়ে
DO $$
DECLARE
  admin_email TEXT := 'cursoruserme24@gmail.com'; -- আপনার ইমেইল
  target_user_id UUID;
BEGIN
  -- Email দিয়ে user_id খুঁজি
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  -- যদি user পাওয়া যায়
  IF target_user_id IS NOT NULL THEN
    -- চেক করি user ইতিমধ্যে admin কিনা
    IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = target_user_id) THEN
      -- Admin হিসেবে add করি
      INSERT INTO public.admin_users (user_id) VALUES (target_user_id);
      RAISE NOTICE 'User successfully added as admin. Email: %, User ID: %', admin_email, target_user_id;
    ELSE
      RAISE NOTICE 'User is already an admin. Email: %, User ID: %', admin_email, target_user_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'User not found with email: %', admin_email;
  END IF;
END $$;

-- ৭. Verify setup
SELECT 'Setup completed successfully!' as status;
SELECT 'Current admin users:' as info;
SELECT au.id, au.user_id, u.email, au.created_at 
FROM public.admin_users au 
JOIN auth.users u ON au.user_id = u.id;

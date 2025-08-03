-- Production Database এ Admin User Add করার Script
-- Supabase Dashboard > SQL Editor এ এই script টি run করুন

-- ১. আপনার ইমেইল এখানে লিখুন
DO $$
DECLARE
  admin_email TEXT := 'আপনার_ইমেইল@gmail.com'; -- এখানে আপনার actual ইমেইল লিখুন
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
      RAISE NOTICE 'SUCCESS: User added as admin. Email: %, User ID: %', admin_email, target_user_id;
    ELSE
      RAISE NOTICE 'INFO: User is already an admin. Email: %, User ID: %', admin_email, target_user_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'ERROR: User not found with email: %', admin_email;
  END IF;
END $$;

-- ২. Verification করুন
SELECT 'Current Admin Users:' as status;
SELECT au.id, au.user_id, u.email, au.created_at 
FROM public.admin_users au 
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;

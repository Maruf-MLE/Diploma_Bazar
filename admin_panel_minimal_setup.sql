-- =====================================================
-- MINIMAL ADMIN PANEL SETUP (শুধু প্রয়োজনীয় জিনিস)
-- =====================================================
-- আপনার admin_users টেবিল ইতিমধ্যে আছে, শুধু বাকি setup করি

-- ১. RLS enable করি admin_users টেবিলে
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ২. পুরানো policies মুছে ফেলি (যদি থাকে)
DROP POLICY IF EXISTS "Allow authenticated users to view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;

-- ৩. নতুন policy তৈরি করি
CREATE POLICY "Allow authenticated users to view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (true);

-- ৪. is_admin function তৈরি করি
DROP FUNCTION IF EXISTS public.is_admin(UUID);

CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function এ execute permission দেই
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- ৫. Verification system এর জন্য function (যদি আপনার কাছে verification টেবিল থাকে)
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
  -- Check if verification tables exist first
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_data') THEN
    RAISE EXCEPTION 'verification_data table does not exist';
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(vd.id, fv.id) as id,
    COALESCE(vd.user_id, fv.user_id) as user_id,
    u.email,
    COALESCE(vd.name, p.name) as name,
    vd.roll_no,
    vd.reg_no,
    vd.document_url,
    COALESCE(vd.created_at, fv.created_at) as created_at,
    COALESCE(vd.updated_at, fv.updated_at) as updated_at,
    COALESCE(fv.photo_url, null) as photo_url,
    COALESCE(fv.status, 'pending') as status,
    COALESCE(vd.is_verified, fv.is_verified, false) as is_verified,
    p.institute_name
  FROM auth.users u
  LEFT JOIN public.verification_data vd ON u.id = vd.user_id
  LEFT JOIN public.face_verification fv ON u.id = fv.user_id
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE (vd.id IS NOT NULL OR fv.id IS NOT NULL);
  
EXCEPTION
  WHEN OTHERS THEN
    -- If verification tables don't exist, return empty result
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO authenticated;

-- ৬. আপনার ইমেইল দিয়ে admin add করি
DO $$
DECLARE
  admin_email TEXT := 'আপনার_ইমেইল@gmail.com'; -- এখানে আপনার actual ইমেইল দিন
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
    RAISE NOTICE 'WARNING: User not found with email: %. Please register first or check email spelling.', admin_email;
  END IF;
END $$;

-- ৭. Verification করি সব ঠিক আছে কিনা
SELECT 'Minimal Admin Setup Completed!' as status;

-- Current admin users দেখি
SELECT 'Current Admin Users:' as info;
SELECT au.id, au.user_id, u.email, au.created_at 
FROM public.admin_users au 
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;

-- Functions check করি
SELECT 'Available Functions:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'get_combined_verification_data')
ORDER BY routine_name;

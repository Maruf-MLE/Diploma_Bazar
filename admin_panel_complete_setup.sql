-- =====================================================
-- ADMIN PANEL COMPLETE SETUP - Supabase SQL Script
-- =====================================================
-- Run this complete script in Supabase SQL Editor
-- This will set up everything needed for your admin panel

-- =====================================================
-- 1. CREATE ADMIN_USERS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS admin_users_user_id_idx ON public.admin_users(user_id);

-- =====================================================
-- 2. ENABLE RLS ON ADMIN_USERS TABLE
-- =====================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Only service role can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;

-- Allow authenticated users to check admin status
CREATE POLICY "Allow authenticated users to view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (true);

-- Only service role can insert/update/delete admin users
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

-- =====================================================
-- 3. CREATE IS_ADMIN FUNCTION
-- =====================================================
DROP FUNCTION IF EXISTS public.is_admin(UUID);

CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user_id exists in admin_users table
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- =====================================================
-- 4. CREATE GET_COMBINED_VERIFICATION_DATA FUNCTION
-- =====================================================
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
    COALESCE(vd.id, fv.id) as id,
    COALESCE(vd.user_id, fv.user_id) as user_id,
    u.email,
    COALESCE(vd.name, p.name) as name,
    vd.roll_no,
    vd.reg_no,
    vd.document_url,
    COALESCE(vd.created_at, fv.created_at) as created_at,
    COALESCE(vd.updated_at, fv.updated_at) as updated_at,
    fv.photo_url,
    COALESCE(fv.status, 'pending') as status,
    COALESCE(vd.is_verified, fv.is_verified, false) as is_verified,
    p.institute_name
  FROM auth.users u
  LEFT JOIN public.verification_data vd ON u.id = vd.user_id
  LEFT JOIN public.face_verification fv ON u.id = fv.user_id
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE (vd.id IS NOT NULL OR fv.id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins can call this)
GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO authenticated;

-- =====================================================
-- 5. ENSURE ALL REQUIRED TABLES EXIST
-- =====================================================

-- Verification data table
CREATE TABLE IF NOT EXISTS public.verification_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  roll_no TEXT,
  reg_no TEXT,
  document_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Face verification table
CREATE TABLE IF NOT EXISTS public.face_verification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  status TEXT DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table for admin reports management
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ban system table
CREATE TABLE IF NOT EXISTS public.user_ban_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  banned_by UUID REFERENCES auth.users(id),
  banned_at TIMESTAMP WITH TIME ZONE,
  ban_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS verification_data_user_id_idx ON public.verification_data(user_id);
CREATE INDEX IF NOT EXISTS face_verification_user_id_idx ON public.face_verification(user_id);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_reported_user_id_idx ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS user_ban_status_user_id_idx ON public.user_ban_status(user_id);

-- =====================================================
-- 7. ENABLE RLS ON ALL ADMIN-RELATED TABLES
-- =====================================================

-- Verification data RLS
ALTER TABLE public.verification_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own verification data" ON public.verification_data;
DROP POLICY IF EXISTS "Admins can view all verification data" ON public.verification_data;

CREATE POLICY "Users can view own verification data"
ON public.verification_data
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification data"
ON public.verification_data
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own verification data"
ON public.verification_data
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verification data"
ON public.verification_data
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Face verification RLS
ALTER TABLE public.face_verification ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own face verification" ON public.face_verification;
DROP POLICY IF EXISTS "Admins can view all face verification" ON public.face_verification;

CREATE POLICY "Users can view own face verification"
ON public.face_verification
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all face verification"
ON public.face_verification
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own face verification"
ON public.face_verification
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own face verification"
ON public.face_verification
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Reports RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;

CREATE POLICY "Users can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
ON public.reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

CREATE POLICY "Admins can view all reports"
ON public.reports
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Ban status RLS
ALTER TABLE public.user_ban_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own ban status" ON public.user_ban_status;
DROP POLICY IF EXISTS "Admins can manage ban status" ON public.user_ban_status;

CREATE POLICY "Users can view own ban status"
ON public.user_ban_status
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage ban status"
ON public.user_ban_status
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 8. ADD YOUR EMAIL AS ADMIN (REPLACE WITH YOUR EMAIL)
-- =====================================================
DO $$
DECLARE
  admin_email TEXT := 'আপনার_ইমেইল@gmail.com'; -- এখানে আপনার ইমেইল দিন
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
    RAISE NOTICE 'WARNING: User not found with email: %. Please register first.', admin_email;
  END IF;
END $$;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================
SELECT 'Admin Panel Setup Completed Successfully!' as status;

-- Show current admin users
SELECT 'Current Admin Users:' as info;
SELECT au.id, au.user_id, u.email, au.created_at 
FROM public.admin_users au 
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;

-- Show table information
SELECT 'Tables Created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_users', 'verification_data', 'face_verification', 'reports', 'user_ban_status')
ORDER BY table_name;

-- Show functions created
SELECT 'Functions Created:' as info;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'get_combined_verification_data')
ORDER BY routine_name;

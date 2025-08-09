-- =====================================================
-- Admin Verification Data Fix - Supabase SQL Script  
-- =====================================================
-- This script will fix the admin verification management page data loading issue
-- Run this script in Supabase SQL Editor

-- =====================================================
-- 1. DROP AND RECREATE get_combined_verification_data FUNCTION
-- =====================================================

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_combined_verification_data();

-- Create a new optimized function that works with existing data structure
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
    COALESCE(p.name, vd.name, '')::TEXT as name,
    COALESCE(vd.roll_no, '')::TEXT as roll_no,
    COALESCE(vd.reg_no, '')::TEXT as reg_no,
    COALESCE(vd.document_url, '')::TEXT as document_url,
    vd.created_at,
    vd.updated_at,
    COALESCE(fv.photo_url, '')::TEXT as photo_url,
    COALESCE(fv.status, 'pending')::TEXT as status,
    COALESCE(vd.is_verified, fv.is_verified, false) as is_verified,
    COALESCE(p.institute_name, '')::TEXT as institute_name
  FROM 
    public.verification_data vd
  LEFT JOIN 
    auth.users u ON vd.user_id = u.id
  LEFT JOIN 
    public.profiles p ON vd.user_id = p.id
  LEFT JOIN 
    public.face_verification fv ON vd.user_id = fv.user_id
  
  UNION ALL
  
  SELECT
    fv.id,
    fv.user_id,
    COALESCE(u.email, '')::TEXT as email,
    COALESCE(p.name, '')::TEXT as name,
    ''::TEXT as roll_no,
    ''::TEXT as reg_no,
    ''::TEXT as document_url,
    fv.created_at,
    fv.updated_at,
    COALESCE(fv.photo_url, '')::TEXT as photo_url,
    COALESCE(fv.status, 'pending')::TEXT as status,
    COALESCE(fv.is_verified, false) as is_verified,
    COALESCE(p.institute_name, '')::TEXT as institute_name
  FROM 
    public.face_verification fv
  LEFT JOIN 
    auth.users u ON fv.user_id = u.id
  LEFT JOIN 
    public.profiles p ON fv.user_id = p.id
  LEFT JOIN 
    public.verification_data vd ON fv.user_id = vd.user_id
  WHERE 
    vd.user_id IS NULL -- Only include face_verification records that don't have verification_data
    
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO anon;

-- =====================================================
-- 2. CREATE A SIMPLER FALLBACK FUNCTION
-- =====================================================

-- Create a simpler function that only gets verification_data
CREATE OR REPLACE FUNCTION public.get_verification_data_only()
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
    ''::TEXT as email, -- We'll keep email empty for security
    COALESCE(p.name, vd.name, 'অজানা')::TEXT as name,
    COALESCE(vd.roll_no, '')::TEXT as roll_no,
    COALESCE(vd.reg_no, '')::TEXT as reg_no,
    COALESCE(vd.document_url, '')::TEXT as document_url,
    vd.created_at,
    vd.updated_at,
    ''::TEXT as photo_url, -- Face verification data is separate
    'pending'::TEXT as status,
    COALESCE(vd.is_verified, false) as is_verified,
    COALESCE(p.institute_name, '')::TEXT as institute_name
  FROM 
    public.verification_data vd
  LEFT JOIN 
    public.profiles p ON vd.user_id = p.id
  ORDER BY vd.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_verification_data_only() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_verification_data_only() TO anon;

-- =====================================================
-- 3. ENSURE RLS POLICIES ARE CORRECT
-- =====================================================

-- Make sure verification_data table has correct RLS policies
ALTER TABLE public.verification_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to select verification_data" ON public.verification_data;
DROP POLICY IF EXISTS "Allow users to insert their own verification_data" ON public.verification_data;
DROP POLICY IF EXISTS "Allow users to update their own verification_data" ON public.verification_data;

-- Create policies that allow proper access
CREATE POLICY "Allow authenticated users to select verification_data"
ON public.verification_data FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own verification_data"
ON public.verification_data FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own verification_data"
ON public.verification_data FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- 4. ENSURE face_verification TABLE POLICIES
-- =====================================================

-- Make sure face_verification table has correct RLS policies
ALTER TABLE public.face_verification ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to select face_verification" ON public.face_verification;
DROP POLICY IF EXISTS "Allow users to insert their own face_verification" ON public.face_verification;
DROP POLICY IF EXISTS "Allow users to update their own face_verification" ON public.face_verification;

-- Create policies
CREATE POLICY "Allow authenticated users to select face_verification"
ON public.face_verification FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own face_verification"
ON public.face_verification FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own face_verification"
ON public.face_verification FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- 5. TEST DATA INSERTION (If no data exists)
-- =====================================================

-- Insert a sample verification record if none exists (optional - remove this if you have real data)
DO $$
DECLARE
    user_count INTEGER;
    sample_user_id UUID;
BEGIN
    -- Check if we have any verification data
    SELECT COUNT(*) INTO user_count FROM public.verification_data;
    
    IF user_count = 0 THEN
        -- Get any user from profiles table
        SELECT id INTO sample_user_id FROM public.profiles LIMIT 1;
        
        -- If we have a profile, create sample verification data
        IF sample_user_id IS NOT NULL THEN
            INSERT INTO public.verification_data (
                user_id,
                name,
                roll_no,
                reg_no,
                document_url,
                is_verified,
                created_at,
                updated_at
            ) VALUES (
                sample_user_id,
                'Sample User (Test)',
                '123456',
                'REG123456',
                'https://example.com/sample-document.jpg',
                false,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Sample verification data created for testing';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 6. VERIFICATION AND TEST
-- =====================================================

-- Check if our functions work
-- You can test these in Supabase SQL Editor:
-- SELECT * FROM get_combined_verification_data() LIMIT 5;
-- SELECT * FROM get_verification_data_only() LIMIT 5;

COMMIT;


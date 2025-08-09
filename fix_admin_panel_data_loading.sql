-- =====================================================
-- Fix Admin Panel Data Loading Issue
-- =====================================================
-- Run this SQL script in Supabase SQL Editor to fix the admin verification management page

-- =====================================================
-- 1. DROP EXISTING FUNCTION AND CREATE NEW ONE
-- =====================================================

-- Drop the old function
DROP FUNCTION IF EXISTS public.get_combined_verification_data();

-- Create a new function that works with your existing table structure
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO authenticated;

-- =====================================================
-- 2. CREATE A SIMPLE FALLBACK FUNCTION
-- =====================================================

-- Create a simple function that only gets verification_data (backup method)
CREATE OR REPLACE FUNCTION public.get_verification_data_simple()
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
    ''::TEXT as email,
    COALESCE(vd.name, 'অজানা')::TEXT as name,
    COALESCE(vd.roll_no, '')::TEXT as roll_no,
    COALESCE(vd.reg_no, '')::TEXT as reg_no,
    COALESCE(vd.document_url, '')::TEXT as document_url,
    vd.created_at,
    vd.updated_at,
    ''::TEXT as photo_url,
    COALESCE(vd.status, 'pending')::TEXT as status,
    COALESCE(vd.is_verified, false) as is_verified,
    ''::TEXT as institute_name
  FROM 
    public.verification_data vd
  ORDER BY vd.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_verification_data_simple() TO authenticated;

-- =====================================================
-- 3. FIX RLS POLICIES
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE public.verification_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.verification_data;
DROP POLICY IF EXISTS "Allow authenticated users to select verification_data" ON public.verification_data;
DROP POLICY IF EXISTS "Users can view own verification data" ON public.verification_data;
DROP POLICY IF EXISTS "Users can insert their own verification_data" ON public.verification_data;
DROP POLICY IF EXISTS "Users can update their own verification_data" ON public.verification_data;

-- Create new policies that allow proper access
CREATE POLICY "Allow all authenticated users to view verification data"
ON public.verification_data FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own verification data"
ON public.verification_data FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own verification data"
ON public.verification_data FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- 4. ENSURE FACE_VERIFICATION TABLE EXISTS AND HAS PROPER POLICIES
-- =====================================================

-- Create face_verification table if it doesn't exist
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

-- Enable RLS on face_verification table
ALTER TABLE public.face_verification ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to select face_verification" ON public.face_verification;
DROP POLICY IF EXISTS "Allow users to insert their own face_verification" ON public.face_verification;
DROP POLICY IF EXISTS "Allow users to update their own face_verification" ON public.face_verification;

-- Create policies for face_verification
CREATE POLICY "Allow all authenticated users to view face verification data"
ON public.face_verification FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own face verification data"
ON public.face_verification FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own face verification data"
ON public.face_verification FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- 5. CREATE TEST DATA IF NO DATA EXISTS
-- =====================================================

-- Insert sample data if no verification data exists (for testing)
DO $$
DECLARE
    verification_count INTEGER;
    sample_user_id UUID;
BEGIN
    -- Check if we have any verification data
    SELECT COUNT(*) INTO verification_count FROM public.verification_data;
    
    IF verification_count = 0 THEN
        -- Try to get a user from profiles table
        SELECT id INTO sample_user_id FROM public.profiles LIMIT 1;
        
        -- If no profile found, try to get any authenticated user
        IF sample_user_id IS NULL THEN
            SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
        END IF;
        
        -- Create sample verification data if we have a user
        IF sample_user_id IS NOT NULL THEN
            INSERT INTO public.verification_data (
                user_id,
                name,
                roll_no,
                reg_no,
                document_url,
                is_verified,
                status,
                created_at,
                updated_at
            ) VALUES (
                sample_user_id,
                'Test User (Sample)',
                '123456',
                'REG123456',
                'https://example.com/sample-document.jpg',
                false,
                'pending',
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Sample verification data created for testing purposes';
        ELSE
            RAISE NOTICE 'No users found to create sample data';
        END IF;
    ELSE
        RAISE NOTICE 'Verification data already exists (% records)', verification_count;
    END IF;
END $$;

-- =====================================================
-- 6. CREATE ADMIN FUNCTIONS FOR APPROVE/REJECT
-- =====================================================

-- Function to approve verification
CREATE OR REPLACE FUNCTION public.approve_verification(verification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.verification_data 
  SET 
    is_verified = true,
    status = 'approved',
    updated_at = NOW()
  WHERE id = verification_id;
  
  -- Also update face_verification if exists
  UPDATE public.face_verification 
  SET 
    is_verified = true,
    status = 'approved',
    updated_at = NOW()
  WHERE user_id = (SELECT user_id FROM public.verification_data WHERE id = verification_id);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject verification
CREATE OR REPLACE FUNCTION public.reject_verification(verification_id UUID, feedback_text TEXT DEFAULT '')
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.verification_data 
  SET 
    is_verified = false,
    status = 'rejected',
    updated_at = NOW()
  WHERE id = verification_id;
  
  -- Also update face_verification if exists
  UPDATE public.face_verification 
  SET 
    is_verified = false,
    status = 'rejected',
    feedback = feedback_text,
    updated_at = NOW()
  WHERE user_id = (SELECT user_id FROM public.verification_data WHERE id = verification_id);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for admin functions
GRANT EXECUTE ON FUNCTION public.approve_verification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_verification(UUID, TEXT) TO authenticated;

-- =====================================================
-- 7. TEST THE FUNCTIONS
-- =====================================================

-- Test the main function (you can run this separately to check)
-- SELECT COUNT(*) FROM get_combined_verification_data();

COMMIT;

-- =====================================================
-- USAGE NOTES:
-- =====================================================
-- 1. After running this script, your admin panel should be able to load data
-- 2. The script creates sample data if no verification data exists
-- 3. Both main function and fallback function are created for reliability
-- 4. Admin functions for approve/reject are also created
-- 5. All necessary RLS policies are set up properly

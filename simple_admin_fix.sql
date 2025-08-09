-- =====================================================
-- Simple Admin Panel Fix - শুধুমাত্র existing table দিয়ে কাজ করবে
-- =====================================================
-- আপনার verification_data table এ কোনো পরিবর্তন করা হবে না

-- =====================================================
-- 1. DROP EXISTING FUNCTION
-- =====================================================
DROP FUNCTION IF EXISTS public.get_combined_verification_data();

-- =====================================================
-- 2. CREATE SIMPLE FUNCTION - শুধু verification_data table ব্যবহার করে
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
    vd.id,
    vd.user_id,
    ''::TEXT as email, -- আপাতত খালি রাখি
    COALESCE(vd.name, 'অজানা')::TEXT as name,
    COALESCE(vd.roll_no, '')::TEXT as roll_no,
    COALESCE(vd.reg_no, '')::TEXT as reg_no,
    COALESCE(vd.document_url, '')::TEXT as document_url,
    vd.created_at,
    vd.updated_at,
    ''::TEXT as photo_url, -- আপাতত খালি রাখি
    COALESCE(vd.status, 'pending')::TEXT as status,
    COALESCE(vd.is_verified, false) as is_verified,
    ''::TEXT as institute_name -- আপাতত খালি রাখি
  FROM 
    public.verification_data vd
  ORDER BY vd.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO authenticated;

-- =====================================================
-- 3. FIX RLS POLICY - verification_data table এর জন্য
-- =====================================================
ALTER TABLE public.verification_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.verification_data;
DROP POLICY IF EXISTS "Allow authenticated users to select verification_data" ON public.verification_data;
DROP POLICY IF EXISTS "Users can view own verification data" ON public.verification_data;

-- Create new policy যা সবাইকে access দেবে
CREATE POLICY "Allow all authenticated users to view verification data"
ON public.verification_data FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- 4. CREATE SIMPLE APPROVE/REJECT FUNCTIONS
-- =====================================================

-- Approve function - শুধু verification_data table update করবে
CREATE OR REPLACE FUNCTION public.approve_verification(verification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.verification_data 
  SET 
    is_verified = true,
    status = 'approved',
    updated_at = NOW()
  WHERE id = verification_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject function - শুধু verification_data table update করবে
CREATE OR REPLACE FUNCTION public.reject_verification(verification_id UUID, feedback_text TEXT DEFAULT 'তথ্য সঠিক নয়')
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.verification_data 
  SET 
    is_verified = false,
    status = 'rejected',
    updated_at = NOW()
  WHERE id = verification_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.approve_verification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_verification(UUID, TEXT) TO authenticated;

-- =====================================================
-- 5. CREATE TEST DATA (যদি কোনো data না থাকে)
-- =====================================================
DO $$
DECLARE
    verification_count INTEGER;
    sample_user_id UUID;
BEGIN
    -- Check existing data count
    SELECT COUNT(*) INTO verification_count FROM public.verification_data;
    
    IF verification_count = 0 THEN
        -- Get any user ID from auth.users
        SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
        
        IF sample_user_id IS NOT NULL THEN
            -- Create sample data
            INSERT INTO public.verification_data (
                user_id,
                name,
                roll_no,
                reg_no,
                document_url,
                is_verified,
                status
            ) VALUES (
                sample_user_id,
                'Test User (Sample)',
                '123456',
                'REG123456',
                'https://example.com/sample-document.jpg',
                false,
                'pending'
            );
            
            RAISE NOTICE 'Sample verification data created for testing';
        ELSE
            RAISE NOTICE 'No users found to create sample data';
        END IF;
    ELSE
        RAISE NOTICE 'Verification data already exists (% records)', verification_count;
    END IF;
END $$;

-- =====================================================
-- 6. TEST THE FUNCTION
-- =====================================================
-- Test query (আপনি পরে চালাতে পারেন):
-- SELECT * FROM get_combined_verification_data() LIMIT 5;

COMMIT;

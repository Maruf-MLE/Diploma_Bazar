-- Migration to update the verification system to require admin approval
-- Function to check if a user is verified - only checks verification_data table and is_verified field
CREATE OR REPLACE FUNCTION public.is_user_verified(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_verified BOOLEAN := FALSE;
BEGIN
  -- Check verification_data table
  SELECT is_verified INTO v_is_verified
  FROM public.verification_data
  WHERE user_id = user_id_param
  LIMIT 1;
  
  -- Return the result (or FALSE if no records found)
  RETURN COALESCE(v_is_verified, FALSE);
END;
$$;

-- Add status column to verification_data if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'verification_data'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.verification_data ADD COLUMN status TEXT;
  END IF;
END $$;

-- Set all existing pending verification records to require admin approval
UPDATE public.verification_data
SET is_verified = false, status = 'pending'
WHERE is_verified IS NULL OR is_verified = true; 
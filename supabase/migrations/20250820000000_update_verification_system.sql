-- Migration to update the verification system to use only one step
-- Function to check if a user is verified - now only checks verification_data table
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

-- Update any existing verification_data entries to be verified
UPDATE public.verification_data
SET is_verified = true
WHERE is_verified IS NULL OR is_verified = false; 
-- Function to check if a user is verified
-- This checks only verification_data table and ensures is_verified is true
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
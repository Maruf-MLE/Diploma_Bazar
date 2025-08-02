-- Create function to check if a user is verified
CREATE OR REPLACE FUNCTION public.is_user_verified(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_verified BOOLEAN;
BEGIN
  -- First check verification_data table
  SELECT is_verified INTO v_is_verified
  FROM public.verification_data
  WHERE user_id = user_id_param
  LIMIT 1;
  
  -- If verified in verification_data, return true
  IF v_is_verified = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- If not verified or no record in verification_data, check face_verification
  SELECT is_verified INTO v_is_verified
  FROM public.face_verification
  WHERE user_id = user_id_param
  LIMIT 1;
  
  -- Return the result from face_verification or false if no record
  RETURN COALESCE(v_is_verified, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_verified TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION public.is_user_verified IS 
'Checks if a user is verified by looking at both verification_data and face_verification tables.'; 
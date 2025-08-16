-- Fix Phone Verification Functions
-- This fixes the parameter issues in phone verification functions

-- 1. Fix generate_phone_otp function to accept phone number parameter
CREATE OR REPLACE FUNCTION public.generate_phone_otp(
  p_phone_number TEXT
)
RETURNS TEXT AS $$
DECLARE
  otp_code TEXT;
  user_id_val UUID;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO user_id_val;
  
  -- Generate 6-digit OTP
  otp_code := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  
  -- Delete any existing unverified attempts for this user
  DELETE FROM public.phone_verification_attempts 
  WHERE user_id = user_id_val 
    AND verified = false;
  
  -- Insert new verification attempt
  INSERT INTO public.phone_verification_attempts (
    user_id, 
    phone_number, 
    otp_code, 
    expires_at
  ) VALUES (
    user_id_val,
    p_phone_number,
    otp_code,
    NOW() + INTERVAL '10 minutes'
  );
  
  -- Return the OTP code
  RETURN otp_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix verify_phone_otp function to accept phone number parameter
CREATE OR REPLACE FUNCTION public.verify_phone_otp(
  p_phone_number TEXT,
  p_otp_code TEXT
)
RETURNS JSON AS $$
DECLARE
  verification_record RECORD;
  user_id_val UUID;
  result JSON;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO user_id_val;
  
  IF user_id_val IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Get verification attempt
  SELECT * INTO verification_record
  FROM public.phone_verification_attempts 
  WHERE user_id = user_id_val 
    AND phone_number = p_phone_number
    AND verified = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if verification record exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'কোন বৈধ OTP পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে'
    );
  END IF;
  
  -- Check attempt limit
  IF verification_record.attempts >= 3 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'সর্বোচ্চ চেষ্টার সংখ্যা পার হয়েছে। নতুন OTP চান।'
    );
  END IF;
  
  -- Increment attempts
  UPDATE public.phone_verification_attempts 
  SET attempts = attempts + 1
  WHERE id = verification_record.id;
  
  -- Check if OTP matches
  IF verification_record.otp_code = p_otp_code THEN
    -- Mark as verified
    UPDATE public.phone_verification_attempts 
    SET verified = true
    WHERE id = verification_record.id;
    
    -- Update user profile
    UPDATE public.profiles 
    SET 
      phone_number = p_phone_number,
      phone_verified = true
    WHERE id = user_id_val;
    
    result := json_build_object(
      'success', true,
      'message', 'ফোন নম্বর সফলভাবে যাচাই হয়েছে'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'ভুল OTP কোড',
      'attempts_remaining', 3 - (verification_record.attempts + 1)
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_phone_otp(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_phone_otp(TEXT, TEXT) TO authenticated;

-- 4. Create a simple function to send SMS directly (for testing)
CREATE OR REPLACE FUNCTION public.send_sms_direct(
  p_phone_number TEXT,
  p_message TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a placeholder function
  -- In real implementation, this would call Twilio API
  
  RAISE LOG 'SMS to %: %', p_phone_number, p_message;
  
  -- Simulate SMS sending (replace with actual Twilio API call)
  result := json_build_object(
    'success', true,
    'message', 'SMS sent successfully (simulated)',
    'phone_number', p_phone_number,
    'message_sid', 'SM' || FLOOR(RANDOM() * 1000000000)::TEXT
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.send_sms_direct(TEXT, TEXT) TO authenticated;

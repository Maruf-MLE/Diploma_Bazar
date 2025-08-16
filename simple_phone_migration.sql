-- Phone Verification Quick Setup
-- Run these commands one by one in your Supabase SQL Editor

-- 1. Add phone verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- 2. Create phone verification attempts table
CREATE TABLE IF NOT EXISTS public.phone_verification_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.phone_verification_attempts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view own phone verification attempts" ON public.phone_verification_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create phone verification attempts" ON public.phone_verification_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone verification attempts" ON public.phone_verification_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. OTP generation function
CREATE OR REPLACE FUNCTION public.generate_phone_otp()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create phone verification function
CREATE OR REPLACE FUNCTION public.create_phone_verification_attempt(
  user_id UUID,
  phone_number TEXT
)
RETURNS JSON AS $$
DECLARE
  otp_code TEXT;
  verification_count INTEGER;
  result JSON;
BEGIN
  -- Generate OTP
  otp_code := public.generate_phone_otp();
  
  -- Check rate limiting (max 3 attempts per hour)
  SELECT COUNT(*) INTO verification_count
  FROM public.phone_verification_attempts 
  WHERE user_id = create_phone_verification_attempt.user_id 
    AND created_at > NOW() - INTERVAL '1 hour'
    AND attempts >= 3;
    
  IF verification_count > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Too many attempts. Please wait 1 hour before trying again.'
    );
  END IF;
  
  -- Delete old unverified attempts
  DELETE FROM public.phone_verification_attempts 
  WHERE user_id = create_phone_verification_attempt.user_id 
    AND verified = false;
  
  -- Insert new verification attempt
  INSERT INTO public.phone_verification_attempts (
    user_id, 
    phone_number, 
    otp_code, 
    expires_at
  ) VALUES (
    create_phone_verification_attempt.user_id,
    create_phone_verification_attempt.phone_number,
    otp_code,
    NOW() + INTERVAL '10 minutes'
  );
  
  -- Return result (in development, we return the OTP)
  result := json_build_object(
    'success', true,
    'message', 'OTP sent successfully',
    'otp_code', otp_code,
    'expires_in', 10
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verify OTP function
CREATE OR REPLACE FUNCTION public.verify_phone_otp(
  user_id UUID,
  otp_code TEXT
)
RETURNS JSON AS $$
DECLARE
  verification_record RECORD;
  result JSON;
BEGIN
  -- Get latest verification attempt
  SELECT * INTO verification_record
  FROM public.phone_verification_attempts 
  WHERE user_id = verify_phone_otp.user_id 
    AND verified = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if record exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No valid verification attempt found or OTP expired'
    );
  END IF;
  
  -- Check attempt limit
  IF verification_record.attempts >= 3 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Maximum attempts exceeded. Please request a new OTP.'
    );
  END IF;
  
  -- Increment attempts
  UPDATE public.phone_verification_attempts 
  SET attempts = attempts + 1
  WHERE id = verification_record.id;
  
  -- Check OTP
  IF verification_record.otp_code = verify_phone_otp.otp_code THEN
    -- Mark as verified
    UPDATE public.phone_verification_attempts 
    SET verified = true
    WHERE id = verification_record.id;
    
    -- Update user profile
    UPDATE public.profiles 
    SET 
      phone_number = verification_record.phone_number,
      phone_verified = true
    WHERE id = verify_phone_otp.user_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Phone number verified successfully'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'Invalid OTP code',
      'attempts_remaining', 3 - (verification_record.attempts + 1)
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_phone_otp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_phone_verification_attempt(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_phone_otp(UUID, TEXT) TO authenticated;

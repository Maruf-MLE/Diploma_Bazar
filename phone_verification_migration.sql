-- Phone Verification System Migration
-- This adds phone verification functionality to the existing system

-- 1. Add phone number and verification fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verification_token TEXT,
ADD COLUMN IF NOT EXISTS phone_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Create phone_verification_attempts table to track OTP attempts
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

-- 3. Add RLS policies for phone verification
ALTER TABLE public.phone_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own verification attempts
CREATE POLICY "Users can view own phone verification attempts" ON public.phone_verification_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own verification attempts
CREATE POLICY "Users can create phone verification attempts" ON public.phone_verification_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own verification attempts
CREATE POLICY "Users can update own phone verification attempts" ON public.phone_verification_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Create function to generate OTP
CREATE OR REPLACE FUNCTION public.generate_phone_otp()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to send OTP via Twilio (to be called from Edge Functions)
CREATE OR REPLACE FUNCTION public.create_phone_verification_attempt(
  user_id UUID,
  phone_number TEXT
)
RETURNS JSON AS $$
DECLARE
  otp_code TEXT;
  verification_record RECORD;
  result JSON;
BEGIN
  -- Generate OTP
  otp_code := public.generate_phone_otp();
  
  -- Check if user has too many recent attempts (rate limiting)
  SELECT COUNT(*) INTO verification_record
  FROM public.phone_verification_attempts 
  WHERE user_id = create_phone_verification_attempt.user_id 
    AND created_at > NOW() - INTERVAL '1 hour'
    AND attempts >= 3;
    
  IF verification_record.count > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Too many attempts. Please wait 1 hour before trying again.'
    );
  END IF;
  
  -- Delete any existing unverified attempts for this user
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
  
  -- Return success with OTP (in production, this would be sent via Twilio)
  result := json_build_object(
    'success', true,
    'message', 'OTP sent successfully',
    'otp_code', otp_code, -- Remove this in production
    'expires_in', 10
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_phone_otp(
  user_id UUID,
  otp_code TEXT
)
RETURNS JSON AS $$
DECLARE
  verification_record RECORD;
  result JSON;
BEGIN
  -- Get verification attempt
  SELECT * INTO verification_record
  FROM public.phone_verification_attempts 
  WHERE user_id = verify_phone_otp.user_id 
    AND verified = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if verification record exists
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
  
  -- Check if OTP matches
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

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phone_verification_attempts_user_id 
ON public.phone_verification_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_phone_verification_attempts_expires_at 
ON public.phone_verification_attempts(expires_at);

-- 8. Create cleanup function to remove expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_phone_verifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.phone_verification_attempts 
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.phone_verification_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_phone_otp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_phone_verification_attempt(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_phone_otp(UUID, TEXT) TO authenticated;

COMMENT ON TABLE public.phone_verification_attempts IS 'Stores phone verification attempts and OTP codes';
COMMENT ON FUNCTION public.create_phone_verification_attempt(UUID, TEXT) IS 'Creates a new phone verification attempt with OTP';
COMMENT ON FUNCTION public.verify_phone_otp(UUID, TEXT) IS 'Verifies OTP code for phone verification';

-- Fix Phone Verification Functions (Updated with DROP statements)
-- This fixes the parameter issues and drops existing functions first

-- 1. Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.generate_phone_otp();
DROP FUNCTION IF EXISTS public.generate_phone_otp(TEXT);
DROP FUNCTION IF EXISTS public.verify_phone_otp(UUID, TEXT);
DROP FUNCTION IF EXISTS public.verify_phone_otp(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_phone_verification_attempt(UUID, TEXT);

-- 2. Create/Recreate generate_phone_otp function with correct parameter
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
  
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
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

-- 3. Create verify_phone_otp function with correct parameters
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

-- 4. Create a simple SMS sending function for testing
CREATE OR REPLACE FUNCTION public.send_sms_direct(
  p_phone_number TEXT,
  p_message TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a placeholder function for SMS logging
  -- In real implementation, this would call Twilio API through an edge function
  
  RAISE LOG 'SMS to %: %', p_phone_number, p_message;
  
  -- Simulate SMS sending (replace with actual Twilio API call via edge function)
  result := json_build_object(
    'success', true,
    'message', 'SMS sent successfully (simulated)',
    'phone_number', p_phone_number,
    'message_sid', 'SM' || FLOOR(RANDOM() * 1000000000)::TEXT
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure phone_verification_attempts table exists with correct structure
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

-- 6. Ensure RLS is enabled and policies exist
ALTER TABLE public.phone_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own phone verification attempts" ON public.phone_verification_attempts;
DROP POLICY IF EXISTS "Users can create phone verification attempts" ON public.phone_verification_attempts;
DROP POLICY IF EXISTS "Users can update own phone verification attempts" ON public.phone_verification_attempts;

-- Recreate policies
CREATE POLICY "Users can view own phone verification attempts" ON public.phone_verification_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create phone verification attempts" ON public.phone_verification_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone verification attempts" ON public.phone_verification_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Ensure profiles table has phone columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verification_token TEXT,
ADD COLUMN IF NOT EXISTS phone_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phone_verification_attempts_user_id 
ON public.phone_verification_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_phone_verification_attempts_expires_at 
ON public.phone_verification_attempts(expires_at);

CREATE INDEX IF NOT EXISTS idx_phone_verification_attempts_phone_verified
ON public.phone_verification_attempts(user_id, verified, expires_at);

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.phone_verification_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_phone_otp(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_phone_otp(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_sms_direct(TEXT, TEXT) TO authenticated;

-- 10. Create cleanup function to remove expired OTPs
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

GRANT EXECUTE ON FUNCTION public.cleanup_expired_phone_verifications() TO authenticated;

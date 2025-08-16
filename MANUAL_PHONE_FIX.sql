-- MANUAL PHONE VERIFICATION FIX
-- Copy this entire script and paste in Supabase SQL Editor, then click RUN

-- Step 1: Drop existing functions first
DROP FUNCTION IF EXISTS public.generate_phone_otp();
DROP FUNCTION IF EXISTS public.generate_phone_otp(TEXT);
DROP FUNCTION IF EXISTS public.verify_phone_otp(UUID, TEXT);
DROP FUNCTION IF EXISTS public.verify_phone_otp(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_phone_verification_attempt(UUID, TEXT);

-- Step 2: Ensure table exists
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

-- Step 3: Add phone columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Step 4: Create generate OTP function
CREATE OR REPLACE FUNCTION public.generate_phone_otp(p_phone_number TEXT)
RETURNS TEXT AS $$
DECLARE
  otp_code TEXT;
  user_id_val UUID;
BEGIN
  SELECT auth.uid() INTO user_id_val;
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  otp_code := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  
  DELETE FROM public.phone_verification_attempts 
  WHERE user_id = user_id_val AND verified = false;
  
  INSERT INTO public.phone_verification_attempts (user_id, phone_number, otp_code, expires_at)
  VALUES (user_id_val, p_phone_number, otp_code, NOW() + INTERVAL '10 minutes');
  
  RETURN otp_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create verify OTP function
CREATE OR REPLACE FUNCTION public.verify_phone_otp(p_phone_number TEXT, p_otp_code TEXT)
RETURNS JSON AS $$
DECLARE
  verification_record RECORD;
  user_id_val UUID;
BEGIN
  SELECT auth.uid() INTO user_id_val;
  IF user_id_val IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  SELECT * INTO verification_record FROM public.phone_verification_attempts 
  WHERE user_id = user_id_val AND phone_number = p_phone_number 
    AND verified = false AND expires_at > NOW()
  ORDER BY created_at DESC LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'কোন বৈধ OTP পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে');
  END IF;
  
  IF verification_record.attempts >= 3 THEN
    RETURN json_build_object('success', false, 'error', 'সর্বোচ্চ চেষ্টার সংখ্যা পার হয়েছে। নতুন OTP চান।');
  END IF;
  
  UPDATE public.phone_verification_attempts SET attempts = attempts + 1 WHERE id = verification_record.id;
  
  IF verification_record.otp_code = p_otp_code THEN
    UPDATE public.phone_verification_attempts SET verified = true WHERE id = verification_record.id;
    UPDATE public.profiles SET phone_number = p_phone_number, phone_verified = true WHERE id = user_id_val;
    RETURN json_build_object('success', true, 'message', 'ফোন নম্বর সফলভাবে যাচাই হয়েছে');
  ELSE
    RETURN json_build_object('success', false, 'error', 'ভুল OTP কোড', 'attempts_remaining', 3 - (verification_record.attempts + 1));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Set up RLS
ALTER TABLE public.phone_verification_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own phone verification attempts" ON public.phone_verification_attempts;

CREATE POLICY "Users can manage own phone verification attempts" ON public.phone_verification_attempts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Step 7: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.phone_verification_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_phone_otp(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_phone_otp(TEXT, TEXT) TO authenticated;

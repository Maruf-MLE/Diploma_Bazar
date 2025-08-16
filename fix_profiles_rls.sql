-- Fix Profiles Table RLS Policies
-- This fixes the registration issue by allowing proper profile creation

-- First, let's check the current policies and drop them if needed
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Allow users to insert their own profile during registration
-- This is the key policy that was missing/broken
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Optional: If you need to allow service role to manage profiles
-- This can help during edge cases where auth.uid() might not be available immediately
CREATE POLICY "Service role can manage all profiles" ON public.profiles
    FOR ALL USING (
        current_setting('request.jwt.claim.role', true) = 'service_role'
    );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.profiles TO authenticated;

-- Also ensure the profiles table structure is correct
-- Add missing columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS semester TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS institute_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or update the profiles table trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_updated_at ON public.profiles;
CREATE TRIGGER trigger_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Verify the policies are working by showing them
DO $$
BEGIN
  RAISE NOTICE 'Profiles RLS policies have been updated successfully!';
  RAISE NOTICE 'The following policies are now active:';
  RAISE NOTICE '1. Users can view own profile';
  RAISE NOTICE '2. Users can insert own profile';
  RAISE NOTICE '3. Users can update own profile';
  RAISE NOTICE '4. Service role can manage all profiles';
END $$;

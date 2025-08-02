-- Complete SQL for setting up the profiles table and disabling email verification
-- Copy and paste this into the Supabase SQL Editor

-- Step 1: Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary key and auth user link
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    
    -- User information fields
    name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    semester TEXT NOT NULL,
    department TEXT NOT NULL,
    institute_name TEXT NOT NULL,
    
    -- Optional fields for future use
    avatar_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Step 2: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies for profiles table
-- Anyone can view profiles (for public display)
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (TRUE);

-- Only authenticated users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Step 4: Create updated_at trigger for the profiles table
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
    
-- Step 5: Confirm all existing user emails
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Step 6: Disable email confirmation requirement in Supabase auth settings
UPDATE auth.config
SET value = jsonb_set(value, '{email_confirmations}', 'false'::jsonb)
WHERE name = 'auth';

-- Step 7: Set the site URL for easier redirects
UPDATE auth.config
SET value = jsonb_set(value, '{site_url}', '"http://localhost:8082"'::jsonb)
WHERE name = 'auth';

-- Step 8: Modify auth hooks to automatically confirm email for new users
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the email_confirmed_at timestamp for any new user
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'confirm_user_email_trigger'
  ) THEN
    CREATE TRIGGER confirm_user_email_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.auto_confirm_email();
  END IF;
END $$; 
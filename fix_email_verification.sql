-- সমস্ত বিদ্যমান ব্যবহারকারীদের ইমেইল নিশ্চিত করুন
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ইমেইল যাচাইকরণ নিষ্ক্রিয় করুন (auth.config টেবিলে)
UPDATE auth.config
SET value = jsonb_set(value, '{email_confirmations}', 'false'::jsonb)
WHERE name = 'auth';

-- Fix for the email verification error

-- First, check if the function exists and drop it
DROP FUNCTION IF EXISTS public.handle_email_verification() CASCADE;

-- Either add the missing column or drop the trigger
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT TRUE;

-- Create a new version of the function that doesn't cause errors
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Just return NEW without making changes
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- We don't need to create the trigger since we dropped it with CASCADE above
-- Just notify in the SQL comment that it's been handled
-- The CASCADE should have removed any triggers using this function 
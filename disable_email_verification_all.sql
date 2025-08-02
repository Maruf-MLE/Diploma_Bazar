-- Disable email verification for all users

-- 1. Confirm all existing users' emails
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Disable email confirmation requirement in Supabase auth settings
UPDATE auth.config
SET value = jsonb_set(value, '{email_confirmations}', 'false'::jsonb)
WHERE name = 'auth';

-- 3. Set the site URL for easier redirects
UPDATE auth.config
SET value = jsonb_set(value, '{site_url}', '"http://localhost:8082"'::jsonb)
WHERE name = 'auth';

-- 4. Modify auth hooks to set email_confirmed_at automatically for new users
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
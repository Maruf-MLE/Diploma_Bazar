-- Alternative approach to disable email verification

-- 1. Confirm all existing user emails (this should still work)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Create a trigger function to automatically confirm new users' emails
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the email_confirmed_at timestamp for any new user
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger that will automatically confirm emails for new users
DO $$
BEGIN
  -- Drop the trigger if it already exists
  DROP TRIGGER IF EXISTS confirm_user_email_trigger ON auth.users;
  
  -- Create the trigger
  CREATE TRIGGER confirm_user_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.auto_confirm_email();
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating trigger: %', SQLERRM;
END $$; 
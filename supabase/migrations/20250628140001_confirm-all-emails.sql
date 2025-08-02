-- Function to confirm all users' emails
CREATE OR REPLACE FUNCTION public.confirm_all_emails()
RETURNS void AS $$
BEGIN
  -- Update all users in the auth.users table to set email_confirmed_at to current timestamp
  -- if it's not already set
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service_role only
GRANT EXECUTE ON FUNCTION public.confirm_all_emails() TO service_role;

-- Execute the function to confirm all existing users' emails
SELECT public.confirm_all_emails(); 
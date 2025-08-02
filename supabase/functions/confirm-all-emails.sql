-- ইমেইল কনফার্ম করার ফাংশন
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

-- ইমেইল যাচাইকরণ নিষ্ক্রিয় করার ফাংশন
CREATE OR REPLACE FUNCTION disable_email_confirmations()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.config
  SET value = jsonb_set(value, '{email_confirmations}', 'false'::jsonb)
  WHERE name = 'auth';
  
  RETURN 'ইমেইল যাচাইকরণ নিষ্ক্রিয় করা হয়েছে';
END;
$$; 
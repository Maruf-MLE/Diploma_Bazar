-- সমস্ত বিদ্যমান ব্যবহারকারীদের ইমেইল নিশ্চিত করুন
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- ইমেইল যাচাইকরণ নিষ্ক্রিয় করুন
UPDATE auth.config
SET value = jsonb_set(value, '{email_confirmations}', 'false'::jsonb)
WHERE name = 'auth';

-- ইমেইল অটো-কনফার্ম ট্রিগার তৈরি করুন
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the email_confirmed_at timestamp for any new user
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ট্রিগার তৈরি করুন যদি আগে থেকে না থাকে
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
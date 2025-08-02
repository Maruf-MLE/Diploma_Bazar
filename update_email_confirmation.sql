-- SQL command to auto-confirm all existing user emails
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Check users that have been updated
SELECT id, email, email_confirmed_at
FROM auth.users; 
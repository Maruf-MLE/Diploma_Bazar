-- Script to check email verification status

-- Check if users have confirmed emails
SELECT id, email, email_confirmed_at 
FROM auth.users
ORDER BY created_at DESC
LIMIT 10; 
-- Simple script to disable email verification
-- Run this script after creating the profiles table

-- Confirm all existing user emails
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Disable email confirmation requirement
UPDATE auth.config
SET value = jsonb_set(value, '{email_confirmations}', 'false'::jsonb)
WHERE name = 'auth'; 
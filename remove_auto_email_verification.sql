-- ইমেইল অটো-কনফার্ম ট্রিগার মুছে ফেলার SQL স্ক্রিপ্ট

-- 1. ট্রিগার মুছে ফেলি
DROP TRIGGER IF EXISTS confirm_user_email_trigger ON auth.users;

-- 2. ফাংশন মুছে ফেলি
DROP FUNCTION IF EXISTS public.auto_confirm_email();

-- 3. ইমেইল কনফার্মেশন সেটিং চেক করি
SELECT name, value->'email_confirmations' AS email_confirmations 
FROM auth.config 
WHERE name = 'auth';

-- 4. ইমেইল কনফার্মেশন সেটিং আপডেট করি (true = ইমেইল ভেরিফিকেশন চালু)
UPDATE auth.config
SET value = jsonb_set(value, '{email_confirmations}', 'true'::jsonb)
WHERE name = 'auth';

-- 5. আপডেট চেক করি
SELECT name, value->'email_confirmations' AS email_confirmations 
FROM auth.config 
WHERE name = 'auth'; 
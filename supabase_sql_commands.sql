-- সমস্ত বিদ্যমান ব্যবহারকারীদের ইমেইল নিশ্চিত করুন
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- ইমেইল যাচাইকরণ নিষ্ক্রিয় করুন (auth.config টেবিলে)
UPDATE auth.config
SET value = jsonb_set(value, '{email_confirmations}', 'false'::jsonb)
WHERE name = 'auth';

-- যাচাই করুন যে আপডেট সফল হয়েছে
SELECT id, email, email_confirmed_at FROM auth.users;
SELECT name, value->'email_confirmations' as email_confirmations FROM auth.config WHERE name = 'auth'; 
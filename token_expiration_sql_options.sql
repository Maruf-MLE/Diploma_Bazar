-- টোকেন এক্সপায়ার টাইম আপডেট করার জন্য বিভিন্ন SQL কমান্ড
-- একটি একটি করে চেষ্টা করুন যতক্ষণ না একটি কাজ করে

-- অপশন ১: সরাসরি auth.config টেবিলে আপডেট
-- যদি auth.config টেবিল থাকে
UPDATE auth.config 
SET config_data = jsonb_set(
  config_data, 
  '{security,email_confirmation_token_expiration_time}', 
  '86400'
);

-- অপশন ২: auth.instance টেবিলে আপডেট
-- কিছু Supabase ইন্সটেন্সে এটি ব্যবহার করা হয়
UPDATE auth.instance 
SET raw_config = jsonb_set(
  raw_config, 
  '{security,email_confirmation_token_expiration_time}', 
  '86400'
);

-- অপশন ৩: auth.settings টেবিলে আপডেট
-- কিছু Supabase ইন্সটেন্সে এটি ব্যবহার করা হয়
UPDATE auth.settings 
SET settings = jsonb_set(
  settings, 
  '{security,email_confirmation_token_expiration_time}', 
  '86400'
);

-- অপশন ৪: auth.config টেবিলে আপডেট (অন্য ফরম্যাট)
UPDATE auth.config 
SET config_data = jsonb_set(
  config_data, 
  '{SECURITY_EMAIL_CONFIRMATION_TOKEN_EXPIRATION_TIME}', 
  '86400'
);

-- অপশন ৫: auth_config টেবিলে আপডেট (ভিন্ন স্কিমা)
-- কিছু Supabase ইন্সটেন্সে auth স্কিমা ছাড়া auth_config টেবিল থাকতে পারে
UPDATE auth_config 
SET value = '86400' 
WHERE key = 'SECURITY_EMAIL_CONFIRMATION_TOKEN_EXPIRATION_TIME';

-- অপশন ৬: সরাসরি সেটিংস ফাংশন কল
-- কিছু Supabase ইন্সটেন্সে এই ফাংশন থাকতে পারে
SELECT set_config('auth.email_confirmation_token_expiration_time', '86400', false);

-- অপশন ৭: টেবিল স্ট্রাকচার দেখা
-- আপনি প্রথমে টেবিল স্ট্রাকচার দেখতে পারেন
SELECT * FROM information_schema.tables 
WHERE table_schema = 'auth' 
AND table_name LIKE '%config%' OR table_name LIKE '%setting%';

-- টেবিল কলাম দেখা
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'config';

-- অপশন ৮: auth.config টেবিলের সব ডাটা দেখা
-- এটি দেখতে সাহায্য করবে কিভাবে ডাটা স্টোর করা হয়েছে
SELECT * FROM auth.config LIMIT 10; 
-- ফাংশন চেক করার জন্য SQL কমান্ড

-- ১. সব স্কিমার সব ফাংশন দেখুন যেগুলোর নাম auth বা config শব্দ আছে
SELECT routine_schema, routine_name 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION'
AND (routine_name LIKE '%auth%' OR routine_name LIKE '%config%')
ORDER BY routine_schema, routine_name;

-- ২. supabase_functions স্কিমার ফাংশন দেখুন
SELECT routine_schema, routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'supabase_functions'
ORDER BY routine_schema, routine_name;

-- ৩. auth স্কিমার ফাংশন দেখুন (যদি থাকে)
SELECT routine_schema, routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'auth' AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ৪. set_config ফাংশন খুঁজুন
SELECT routine_schema, routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%set_config%'
ORDER BY routine_schema, routine_name;

-- ৫. auth সেটিংস আপডেট করার জন্য ফাংশন খুঁজুন
SELECT routine_schema, routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%set%' AND routine_name LIKE '%auth%'
ORDER BY routine_schema, routine_name;

-- ৬. সব স্কিমা দেখুন যেগুলোর নাম auth বা supabase শব্দ আছে
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE '%auth%' OR schema_name LIKE '%supabase%'
ORDER BY schema_name;

-- Disable email confirmation requirement in Supabase Auth settings
UPDATE auth.config
SET confirm_email_on_signup = false;

-- Check current settings
SELECT confirm_email_on_signup FROM auth.config; 
-- ডাটাবেস স্ট্রাকচার এক্সপ্লোর করার জন্য SQL কমান্ড

-- ১. সব স্কিমা দেখুন
SELECT schema_name 
FROM information_schema.schemata 
ORDER BY schema_name;

-- ২. সব টেবিল দেখুন
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;

-- ৩. auth স্কিমা আছে কিনা চেক করুন
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- ৪. সব টেবিল দেখুন যেগুলোর নাম auth বা config শব্দ আছে
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%auth%' OR table_name LIKE '%config%'
ORDER BY table_schema, table_name;

-- ৫. supabase_auth স্কিমা চেক করুন
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'supabase_auth'
ORDER BY table_schema, table_name;

-- ৬. pgsodium স্কিমা চেক করুন
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'pgsodium'
ORDER BY table_schema, table_name;

-- ৭. storage স্কিমা চেক করুন
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'storage'
ORDER BY table_schema, table_name;

-- ৮. auth_config টেবিল চেক করুন (auth স্কিমা ছাড়া)
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'auth_config'
ORDER BY table_schema, table_name; 
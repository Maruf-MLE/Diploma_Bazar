-- auth.users টেবিলের স্কিমা চেক করার জন্য SQL স্ক্রিপ্ট
-- এই স্ক্রিপ্টটি Supabase SQL এডিটরে চালাতে হবে

-- auth.users টেবিলের কলাম দেখি
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_schema = 'auth' AND 
  table_name = 'users'
ORDER BY 
  ordinal_position;

-- auth.users টেবিলে is_admin কলাম আছে কিনা চেক করি
SELECT 
  COUNT(*) > 0 AS has_is_admin_column
FROM 
  information_schema.columns
WHERE 
  table_schema = 'auth' AND 
  table_name = 'users' AND
  column_name = 'is_admin';

-- যদি is_admin কলাম না থাকে, তাহলে profiles টেবিলে চেক করি
SELECT 
  COUNT(*) > 0 AS has_is_admin_column
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' AND 
  table_name = 'profiles' AND
  column_name = 'is_admin';

-- admin_users টেবিলে কয়টি রেকর্ড আছে দেখি
SELECT COUNT(*) AS admin_count FROM public.admin_users; 
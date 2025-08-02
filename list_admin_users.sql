-- admin_users টেবিলের সব ইউজার দেখার জন্য SQL স্ক্রিপ্ট
-- এই স্ক্রিপ্টটি Supabase SQL এডিটরে চালাতে হবে

-- এডমিন ইউজারদের তালিকা দেখি
SELECT 
  au.id AS admin_id,
  au.user_id,
  u.email,
  u.raw_user_meta_data->>'name' AS name,
  p.institute_name,
  au.created_at
FROM 
  public.admin_users au
JOIN 
  auth.users u ON au.user_id = u.id
LEFT JOIN
  public.profiles p ON au.user_id = p.id
ORDER BY 
  au.created_at DESC; 
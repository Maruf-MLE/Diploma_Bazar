-- SQL to add the current user as an admin
-- Replace 'YOUR_USER_ID' with your actual user ID

-- First, find your user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';

-- Then, insert your user ID into the admin_users table
INSERT INTO public.admin_users (user_id) 
VALUES ('YOUR_USER_ID');

-- Verify admin status
SELECT * FROM public.admin_users; 
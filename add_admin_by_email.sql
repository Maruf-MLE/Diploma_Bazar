-- ইমেইল দিয়ে ইউজারকে এডমিন হিসেবে যোগ করার SQL স্ক্রিপ্ট
-- এই স্ক্রিপ্টটি Supabase SQL এডিটরে চালাতে হবে

-- আপনার ইমেইল এখানে লিখুন
DO $$
DECLARE
  user_email TEXT := 'আপনার_ইমেইল@example.com'; -- এখানে আপনার ইমেইল লিখুন
  user_id UUID;
BEGIN
  -- ইমেইল দিয়ে ইউজার আইডি খুঁজি
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  -- যদি ইউজার পাওয়া যায়
  IF user_id IS NOT NULL THEN
    -- চেক করি ইউজার ইতিমধ্যে এডমিন কিনা
    IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = user_id) THEN
      -- এডমিন টেবিলে ইউজার যোগ করি
      INSERT INTO public.admin_users (user_id) VALUES (user_id);
      RAISE NOTICE 'ইউজার এডমিন হিসেবে যোগ করা হয়েছে। ইমেইল: %, ইউজার আইডি: %', user_email, user_id;
    ELSE
      RAISE NOTICE 'ইউজার ইতিমধ্যে এডমিন আছে। ইমেইল: %, ইউজার আইডি: %', user_email, user_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'এই ইমেইলের কোনো ইউজার পাওয়া যায়নি: %', user_email;
  END IF;
END $$; 
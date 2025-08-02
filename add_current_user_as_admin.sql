-- বর্তমান লগইন করা ইউজারকে এডমিন হিসেবে যোগ করার SQL স্ক্রিপ্ট
-- এই স্ক্রিপ্টটি Supabase SQL এডিটরে চালাতে হবে

-- বর্তমান লগইন করা ইউজারের আইডি পাওয়া
DO $$
DECLARE
  current_user_id UUID;
BEGIN
  -- বর্তমান লগইন করা ইউজারের আইডি নিই
  current_user_id := auth.uid();
  
  -- যদি ইউজার লগইন থাকে
  IF current_user_id IS NOT NULL THEN
    -- চেক করি ইউজার ইতিমধ্যে এডমিন কিনা
    IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = current_user_id) THEN
      -- এডমিন টেবিলে ইউজার যোগ করি
      INSERT INTO public.admin_users (user_id) VALUES (current_user_id);
      RAISE NOTICE 'বর্তমান ইউজার এডমিন হিসেবে যোগ করা হয়েছে। ইউজার আইডি: %', current_user_id;
    ELSE
      RAISE NOTICE 'ইউজার ইতিমধ্যে এডমিন আছে। ইউজার আইডি: %', current_user_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'কোনো ইউজার লগইন নেই। আগে লগইন করুন।';
  END IF;
END $$; 
-- প্রোফাইল টেবিলের RLS পলিসি ফিক্স করার SQL স্ক্রিপ্ট

-- 1. বর্তমান পলিসি চেক করি
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'profiles';

-- 2. বর্তমান পলিসি ডিলিট করি
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 3. নতুন পলিসি তৈরি করি যা ইনসার্ট অপারেশন অনুমতি দেয়
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);  -- সবাইকে ইনসার্ট করার অনুমতি দেয়

-- 4. আপডেট পলিসি চেক করি
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 5. ভিউ পলিসি চেক করি
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- 6. নতুন পলিসি যোগ করি যা সার্ভিস রোলকে সব অপারেশনের অনুমতি দেয়
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 7. RLS এনাবল আছে কিনা চেক করি
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'profiles';

-- 8. প্রোফাইল টেবিলের স্কিমা চেক করি
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'profiles'
ORDER BY 
  ordinal_position; 
-- Enable Row Level Security on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view messages where they are sender or receiver" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages where they are sender" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages where they are sender or receiver" ON public.messages;
DROP POLICY IF EXISTS "Enable read for users involved in conversation" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable update for users involved in conversation" ON public.messages;

-- Create comprehensive RLS policies for messages
CREATE POLICY "Enable read for users involved in conversation" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

CREATE POLICY "Enable insert for authenticated users" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND auth.uid() IS NOT NULL
    );

CREATE POLICY "Enable update for users involved in conversation" ON public.messages
    FOR UPDATE USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Enable realtime for messages table (very important!)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Verify the publication includes messages table
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Grant necessary permissions for realtime
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Enable realtime on profiles table as well (for sender info)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Check if realtime is properly configured
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- সুপাবেস ড্যাশবোর্ডে রান করার জন্য SQL স্ক্রিপ্ট
-- এই স্ক্রিপ্টটি profiles টেবিলের RLS পলিসি ঠিক করবে

-- 1. বর্তমান RLS পলিসিগুলি চেক করি
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

-- 2. পুরানো পলিসি মুছে ফেলি
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 3. নতুন পলিসি তৈরি করি
-- সবাই প্রোফাইল দেখতে পারবে
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- সবাই প্রোফাইল ইনসার্ট করতে পারবে (রেজিস্ট্রেশনের সময়)
CREATE POLICY "Anyone can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- শুধু নিজের প্রোফাইল আপডেট করতে পারবে
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 4. RLS আছে কিনা চেক করি
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'profiles';

-- 5. RLS এনাবল করি
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. আবার পলিসি চেক করি
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

-- 7. টেস্ট ইউজার ইনসার্ট করি
-- এটি শুধু টেস্ট করার জন্য, এটি রান করার দরকার নেই
/*
INSERT INTO public.profiles (id, name, roll_number, semester, department, institute_name)
VALUES 
  ('test-user-id', 'Test User', 'TEST123', '1st', 'Test Dept', 'Test Institute');

-- টেস্ট ডাটা ডিলিট করি
DELETE FROM public.profiles WHERE id = 'test-user-id';
*/ 
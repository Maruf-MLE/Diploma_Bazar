-- Step 1: Enable Row Level Security on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view messages where they are sender or receiver" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages where they are sender" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages where they are sender or receiver" ON public.messages;
DROP POLICY IF EXISTS "Enable read for users involved in conversation" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable update for users involved in conversation" ON public.messages;

-- Step 3: Create comprehensive RLS policies for messages
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

-- Step 4: Check if messages table is already in realtime publication
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages';

-- Step 5: Only add to publication if not already there (this will skip if already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

-- Step 6: Grant necessary permissions for realtime
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO anon;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Step 8: Handle profiles table for realtime (for sender info)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Step 9: Fix profiles table RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profiles policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Step 10: Verify everything is set up correctly
SELECT 'Messages table in realtime publication:' as info, schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'messages'

UNION ALL

SELECT 'Profiles table in realtime publication:' as info, schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'profiles';

-- Step 11: Check RLS status
SELECT 
    'RLS Status:' as info,
    relname as table_name, 
    CASE WHEN relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_class 
WHERE relname IN ('messages', 'profiles');

-- Step 12: Check policies
SELECT 
    'Policies:' as info,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename IN ('messages', 'profiles')
ORDER BY tablename, cmd;

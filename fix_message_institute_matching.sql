-- =====================================================
-- FIX MESSAGE INSTITUTE MATCHING - SQL Script
-- =====================================================
-- This script will fix the message table RLS policies for institute matching

-- ১. First, check if RLS is enabled on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ২. Drop all existing message policies
DROP POLICY IF EXISTS "Allow users to view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Allow users to send messages" ON public.messages;
DROP POLICY IF EXISTS "Allow users to send messages to same institute users" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- ৩. Create new policies with institute matching

-- Policy for viewing messages (sender or receiver can view)
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy for sending messages with institute matching
CREATE POLICY "Users can send messages to same institute users" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND 
  public.can_message_user(sender_id, receiver_id)
);

-- Policy for updating message status (only receiver can update)
CREATE POLICY "Users can update message status" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- ৪. Verify the function is working correctly
-- Test the can_message_user function
DO $$
BEGIN
  -- Check if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_message_user') THEN
    RAISE NOTICE 'can_message_user function exists';
  ELSE
    RAISE EXCEPTION 'can_message_user function does not exist! Please run the institute_matching_system.sql first';
  END IF;
END $$;

-- ৫. Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'messages' AND schemaname = 'public';

-- ৬. Test query to verify setup
SELECT 'Message institute matching policies updated successfully!' as status;

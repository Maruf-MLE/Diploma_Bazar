-- =====================================================
-- TEST INSTITUTE MATCHING SYSTEM
-- =====================================================
-- This script will help you test if the institute matching system is working

-- ১. Check if all functions exist
SELECT 
  'Function exists: ' || proname as status
FROM pg_proc 
WHERE proname IN ('users_same_institute', 'can_message_user', 'can_purchase_book')
ORDER BY proname;

-- ২. Check RLS status on messages table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'messages' AND schemaname = 'public';

-- ৩. Check current policies on messages table
SELECT 
  tablename,
  policyname,
  cmd as operation,
  permissive,
  CASE 
    WHEN cmd = 'INSERT' THEN with_check
    WHEN cmd = 'SELECT' THEN qual
    WHEN cmd = 'UPDATE' THEN qual
    ELSE 'N/A'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'messages' AND schemaname = 'public'
ORDER BY cmd;

-- ৪. Check if there are any users with institute data
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN institute_name IS NOT NULL THEN 1 END) as users_with_institute,
  array_agg(DISTINCT institute_name) as institutes
FROM public.profiles;

-- ৫. Test function with sample data (you can modify the UUIDs)
-- Uncomment and modify these lines to test with real user IDs:

/*
-- Replace these UUIDs with actual user IDs from your system
DO $$
DECLARE
  user1 UUID := 'your-user1-id-here';
  user2 UUID := 'your-user2-id-here';
  test_result BOOLEAN;
BEGIN
  -- Test users_same_institute function
  SELECT public.users_same_institute(user1, user2) INTO test_result;
  RAISE NOTICE 'users_same_institute result: %', test_result;
  
  -- Test can_message_user function
  SELECT public.can_message_user(user1, user2) INTO test_result;
  RAISE NOTICE 'can_message_user result: %', test_result;
END $$;
*/

-- ৬. Check purchase_requests table policies
SELECT 
  tablename,
  policyname,
  cmd as operation,
  permissive,
  with_check as policy_condition
FROM pg_policies 
WHERE tablename = 'purchase_requests' AND schemaname = 'public'
ORDER BY cmd;

SELECT 'Test completed!' as status;

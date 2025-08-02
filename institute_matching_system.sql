-- =====================================================
-- INSTITUTE MATCHING SYSTEM - SQL Setup
-- =====================================================
-- This script will ensure users can only interact with users from same institute

-- ১. Function to check if two users are from same institute
CREATE OR REPLACE FUNCTION public.users_same_institute(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user1_institute TEXT;
  user2_institute TEXT;
BEGIN
  -- Get institute of first user
  SELECT institute_name INTO user1_institute 
  FROM public.profiles 
  WHERE id = user1_id;
  
  -- Get institute of second user
  SELECT institute_name INTO user2_institute 
  FROM public.profiles 
  WHERE id = user2_id;
  
  -- Return true if both institutes match and not null
  RETURN (user1_institute IS NOT NULL AND 
          user2_institute IS NOT NULL AND 
          user1_institute = user2_institute);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.users_same_institute(UUID, UUID) TO authenticated;

-- ২. Function to check if user can message another user
CREATE OR REPLACE FUNCTION public.can_message_user(sender_id UUID, receiver_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Cannot message yourself
  IF sender_id = receiver_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if both users are from same institute
  RETURN public.users_same_institute(sender_id, receiver_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.can_message_user(UUID, UUID) TO authenticated;

-- ৩. Function to check if user can make purchase request for a book
CREATE OR REPLACE FUNCTION public.can_purchase_book(buyer_id UUID, book_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  seller_id UUID;
BEGIN
  -- Get the seller of the book
  SELECT b.seller_id INTO seller_id 
  FROM public.books b 
  WHERE b.id = book_id;
  
  -- Cannot buy your own book
  IF buyer_id = seller_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if buyer and seller are from same institute
  RETURN public.users_same_institute(buyer_id, seller_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.can_purchase_book(UUID, UUID) TO authenticated;

-- ৪. Update messages table RLS policies to check institute matching
-- First enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop all existing message policies
DROP POLICY IF EXISTS "Allow users to view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Allow users to send messages" ON public.messages;
DROP POLICY IF EXISTS "Allow users to send messages to same institute users" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

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

-- ৫. Update purchase_requests table RLS policy to check institute matching
-- First enable RLS on purchase_requests table
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- Drop all existing purchase_requests policies
DROP POLICY IF EXISTS "Allow buyers to create purchase requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow buyers to create purchase requests for same institute sellers" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow buyers to create purchase requests for same institute sel" ON public.purchase_requests;
DROP POLICY IF EXISTS "Users can view their own purchase requests (as buyer or seller)" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow users to view their own purchase requests (as buyer or seller)" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow buyers to update their own purchase requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Allow sellers to update status of purchase requests" ON public.purchase_requests;

-- Create new policies with institute matching

-- Policy for viewing purchase requests (buyer or seller can view)
CREATE POLICY "Users can view their purchase requests" 
ON public.purchase_requests 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Policy for creating purchase requests with institute matching
CREATE POLICY "Users can create purchase requests for same institute sellers" 
ON public.purchase_requests 
FOR INSERT 
WITH CHECK (
  auth.uid() = buyer_id AND 
  public.can_purchase_book(buyer_id, book_id)
);

-- Policy for buyers to update their own requests
CREATE POLICY "Buyers can update their own requests" 
ON public.purchase_requests 
FOR UPDATE 
USING (auth.uid() = buyer_id AND status = 'pending')
WITH CHECK (auth.uid() = buyer_id AND status = 'pending');

-- Policy for sellers to update request status
CREATE POLICY "Sellers can update request status" 
ON public.purchase_requests 
FOR UPDATE 
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- ৬. Add function to get user institute
CREATE OR REPLACE FUNCTION public.get_user_institute(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_institute TEXT;
BEGIN
  SELECT institute_name INTO user_institute 
  FROM public.profiles 
  WHERE id = user_id;
  
  RETURN user_institute;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_institute(UUID) TO authenticated;

-- ৭. Add function to check current user's institute against another user
CREATE OR REPLACE FUNCTION public.current_user_same_institute(other_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.users_same_institute(auth.uid(), other_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.current_user_same_institute(UUID) TO authenticated;

-- ৮. Verify setup
SELECT 'Institute matching system setup completed successfully!' as status;

-- Test queries (uncomment to test after adding some data)
-- SELECT public.users_same_institute('user1-uuid', 'user2-uuid');
-- SELECT public.can_message_user('sender-uuid', 'receiver-uuid');
-- SELECT public.can_purchase_book('buyer-uuid', 'book-uuid');

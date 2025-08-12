-- Complete RLS Policy for message_images table
-- This allows users to manage images only for messages they are part of

-- Step 1: Enable RLS on message_images table
ALTER TABLE public.message_images ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies
DROP POLICY IF EXISTS "message_images_select_policy" ON public.message_images;
DROP POLICY IF EXISTS "message_images_insert_policy" ON public.message_images;
DROP POLICY IF EXISTS "message_images_update_policy" ON public.message_images;
DROP POLICY IF EXISTS "message_images_delete_policy" ON public.message_images;
DROP POLICY IF EXISTS "Users can view message images" ON public.message_images;
DROP POLICY IF EXISTS "Users can add message images" ON public.message_images;
DROP POLICY IF EXISTS "Users can update message images" ON public.message_images;
DROP POLICY IF EXISTS "Users can delete message images" ON public.message_images;

-- Step 3: Create helper function to check if user is part of the message conversation
CREATE OR REPLACE FUNCTION user_can_access_message_image(target_message_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user is either sender or receiver of the message
  RETURN EXISTS (
    SELECT 1 
    FROM public.messages m
    WHERE m.id = target_message_id
    AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: CREATE RLS POLICIES

-- SELECT Policy: Users can view images from messages they are part of
CREATE POLICY "message_images_select_policy" 
ON public.message_images 
FOR SELECT 
USING (
  user_can_access_message_image(message_id)
);

-- INSERT Policy: Users can add images to messages they are part of
CREATE POLICY "message_images_insert_policy" 
ON public.message_images 
FOR INSERT 
WITH CHECK (
  user_can_access_message_image(message_id)
);

-- UPDATE Policy: Users can update images from messages they are part of
CREATE POLICY "message_images_update_policy" 
ON public.message_images 
FOR UPDATE 
USING (
  user_can_access_message_image(message_id)
)
WITH CHECK (
  user_can_access_message_image(message_id)
);

-- DELETE Policy: Users can delete images from messages they are part of
CREATE POLICY "message_images_delete_policy" 
ON public.message_images 
FOR DELETE 
USING (
  user_can_access_message_image(message_id)
);

-- Step 5: Grant necessary permissions
GRANT ALL ON public.message_images TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.message_images TO service_role;

-- Step 6: Add helpful comment
COMMENT ON FUNCTION user_can_access_message_image(uuid) IS 
'Function to check if the authenticated user can access message images based on message participation';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ message_images RLS policies configured successfully!';
  RAISE NOTICE 'Security rules:';
  RAISE NOTICE '  - Users can only access images from their own messages';
  RAISE NOTICE '  - Both sender and receiver can view/add/update/delete images';
  RAISE NOTICE '  - No access to other users'' message images';
END $$;

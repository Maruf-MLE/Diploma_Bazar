-- Simple RLS Policy for message_images table
-- Basic security without complex helper functions

-- Step 1: Enable RLS
ALTER TABLE public.message_images ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "message_images_select_policy" ON public.message_images;
DROP POLICY IF EXISTS "message_images_insert_policy" ON public.message_images;
DROP POLICY IF EXISTS "message_images_update_policy" ON public.message_images;
DROP POLICY IF EXISTS "message_images_delete_policy" ON public.message_images;

-- Step 3: Create simple policies

-- SELECT: Users can view images from messages they participate in
CREATE POLICY "message_images_read" 
ON public.message_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.id = message_images.message_id 
    AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  )
);

-- INSERT: Users can add images to messages they participate in
CREATE POLICY "message_images_create" 
ON public.message_images 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.id = message_images.message_id 
    AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  )
);

-- UPDATE: Users can update images from messages they participate in
CREATE POLICY "message_images_update" 
ON public.message_images 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.id = message_images.message_id 
    AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  )
);

-- DELETE: Users can delete images from messages they participate in  
CREATE POLICY "message_images_delete" 
ON public.message_images 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.id = message_images.message_id 
    AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
  )
);

-- Grant permissions
GRANT ALL ON public.message_images TO authenticated;
GRANT ALL ON public.message_images TO service_role;

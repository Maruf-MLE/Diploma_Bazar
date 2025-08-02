-- Messages Bucket Setup SQL Script (Only Bucket Creation)
-- This script only creates the bucket without adding policies
-- Run this in Supabase SQL Editor

-- Create the messages bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'messages', 
  'messages', 
  false, 
  10485760, 
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'text/plain', 'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'application/vnd.ms-powerpoint', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Output success message
SELECT 'Messages bucket created successfully!' as result;

-- NOTE: After running this script, you must manually create the policies
-- through the Supabase Dashboard:
-- 1. Go to Storage section
-- 2. Click on the 'messages' bucket
-- 3. Go to the Policies tab
-- 4. Create the following policies:
--    - Allow authenticated users to upload files (INSERT)
--    - Allow authenticated users to view files (SELECT)
--    - Allow authenticated users to update their files (UPDATE)
--    - Allow authenticated users to delete their files (DELETE)
--
-- For detailed instructions, see SUPABASE_BUCKET_SETUP_GUIDE.md 
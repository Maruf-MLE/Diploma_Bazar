-- Create book-images storage bucket for book cover and additional images
-- This script should be run in Supabase Dashboard -> Storage -> New Bucket

-- First, create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage section in Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Name: "book-images"
-- 4. Make it Public: YES (so images can be displayed)
-- 5. File size limit: 10MB
-- 6. Allowed MIME types: image/jpeg,image/png,image/webp,image/gif

-- Then run these policies:

-- Policy to allow authenticated users to upload images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-images',
  'book-images', 
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload book images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-images');

-- Policy to allow public read access to book images
CREATE POLICY "Allow public read access to book images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'book-images');

-- Policy to allow users to update their own uploaded images
CREATE POLICY "Allow users to update their own book images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'book-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy to allow users to delete their own uploaded images
CREATE POLICY "Allow users to delete their own book images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'book-images' AND auth.uid()::text = (storage.foldername(name))[1]);

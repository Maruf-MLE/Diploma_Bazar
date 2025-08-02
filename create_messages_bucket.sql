-- Messages Bucket Setup SQL Script
-- Run this in Supabase SQL Editor

-- Create the messages bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('messages', 'messages', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
ON CONFLICT (id) DO NOTHING;

-- Create policies for the messages bucket
-- Allow authenticated users to upload files
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow authenticated users to upload files"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to upload files" already exists. Skipping.';
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to view files"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to view files" already exists. Skipping.';
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to update their files"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to update their files" already exists. Skipping.';
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to delete their files"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to delete their files" already exists. Skipping.';
    END;
END
$$;

-- Create RLS policy to allow authenticated users to access the messages bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Output success message
SELECT 'Messages bucket and policies set up successfully!' as result; 
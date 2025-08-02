-- Create verification_data table
CREATE TABLE IF NOT EXISTS public.verification_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  roll_no TEXT,
  reg_no TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS verification_data_user_id_idx ON public.verification_data(user_id);

-- Create storage bucket for verification documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification_documents', 'verification_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload verification documents" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification_documents');

-- Create storage policy to allow users to view their own verification documents
CREATE POLICY "Allow users to view their own verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'verification_documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create RLS policy for verification_data table
ALTER TABLE public.verification_data ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own verification data
CREATE POLICY "Users can view their own verification data"
ON public.verification_data
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to insert their own verification data
CREATE POLICY "Users can insert their own verification data"
ON public.verification_data
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own verification data
CREATE POLICY "Users can update their own verification data"
ON public.verification_data
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid()); 
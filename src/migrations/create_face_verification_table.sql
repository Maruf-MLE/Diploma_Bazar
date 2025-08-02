-- Create face_verification table
CREATE TABLE IF NOT EXISTS public.face_verification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  is_verified BOOLEAN DEFAULT false,
  feedback TEXT, -- Admin feedback if rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS face_verification_user_id_idx ON public.face_verification(user_id);

-- Create storage bucket for verification photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification_photos', 'verification_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload verification photos" 
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification_photos');

-- Create storage policy to allow users to view their own verification photos
CREATE POLICY "Allow users to view their own verification photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'verification_photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create RLS policy for face_verification table
ALTER TABLE public.face_verification ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own face verification data
CREATE POLICY "Users can view their own face verification data"
ON public.face_verification
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to insert their own face verification data
CREATE POLICY "Users can insert their own face verification data"
ON public.face_verification
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own face verification data
CREATE POLICY "Users can update their own face verification data"
ON public.face_verification
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create view for face verification with user details
CREATE OR REPLACE VIEW public.face_verification_view AS
SELECT 
  f.id,
  f.user_id,
  u.email,
  p.name,
  f.photo_url,
  f.status,
  f.is_verified,
  f.feedback,
  f.created_at,
  f.updated_at
FROM 
  public.face_verification f
JOIN 
  auth.users u ON f.user_id = u.id
LEFT JOIN 
  public.profiles p ON f.user_id = p.id;

-- Grant access to authenticated users for the view
GRANT SELECT ON public.face_verification_view TO authenticated;

-- Allow admins to view all face verifications (you need to create an admin role)
-- CREATE POLICY "Admins can view all face verifications"
-- ON public.face_verification
-- FOR SELECT
-- TO authenticated
-- USING (auth.uid() IN (SELECT user_id FROM admin_users)); 
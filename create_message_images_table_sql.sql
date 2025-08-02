-- Create a separate table for message images
CREATE TABLE IF NOT EXISTS public.message_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  image_path TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_images_message_id ON public.message_images(message_id);

-- Create a function to store message images
CREATE OR REPLACE FUNCTION public.store_message_image(
  p_message_id UUID,
  p_image_url TEXT,
  p_image_path TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.message_images (message_id, image_url, image_path, file_name)
  VALUES (p_message_id, p_image_url, p_image_path, p_file_name)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.store_message_image TO authenticated;

-- Update storage.buckets to make messages bucket public
UPDATE storage.buckets
SET public = true
WHERE name = 'messages';

-- Insert messages bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'messages', 'messages', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'messages'
); 
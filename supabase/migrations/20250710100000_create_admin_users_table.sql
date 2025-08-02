-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS admin_users_user_id_idx ON public.admin_users(user_id);

-- Add is_verified field to verification_data table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'verification_data'
    AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.verification_data
    ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create RLS policy for admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_users table
CREATE POLICY "Admins can view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = $1
  );
END;
$$ LANGUAGE plpgsql;

-- Insert a default admin user (replace with the actual admin user ID)
-- INSERT INTO public.admin_users (user_id) 
-- VALUES ('REPLACE_WITH_ADMIN_USER_ID');

-- Grant permission to execute the function
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated; 
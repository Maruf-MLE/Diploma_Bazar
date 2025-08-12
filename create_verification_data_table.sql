-- Create verification_data table as specified by user
CREATE TABLE IF NOT EXISTS public.verification_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NULL,
  roll_no text NULL,
  reg_no text NULL,
  document_url text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  is_verified boolean NULL DEFAULT false,
  status text NULL DEFAULT 'pending',
  CONSTRAINT verification_data_pkey PRIMARY KEY (id),
  CONSTRAINT verification_data_reg_no_key UNIQUE (reg_no),
  CONSTRAINT verification_data_roll_no_key UNIQUE (roll_no),
  CONSTRAINT verification_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create index for efficient user lookups
CREATE INDEX IF NOT EXISTS verification_data_user_id_idx 
ON public.verification_data 
USING btree (user_id) 
TABLESPACE pg_default;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS verification_data_status_idx 
ON public.verification_data 
USING btree (status) 
TABLESPACE pg_default;

-- Create index for verification status
CREATE INDEX IF NOT EXISTS verification_data_is_verified_idx 
ON public.verification_data 
USING btree (is_verified) 
TABLESPACE pg_default;

-- Enable RLS (Row Level Security)
ALTER TABLE public.verification_data ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to view their own verification data
CREATE POLICY "Users can view their own verification data" 
ON public.verification_data 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policy: Allow users to insert their own verification data
CREATE POLICY "Users can insert their own verification data" 
ON public.verification_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Allow users to update their own verification data (only if not verified)
CREATE POLICY "Users can update their own unverified data" 
ON public.verification_data 
FOR UPDATE 
USING (auth.uid() = user_id AND is_verified = false)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Allow admins to view all verification data
-- Note: You'll need to create an admin role or function for this to work
CREATE POLICY "Admins can view all verification data" 
ON public.verification_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);

-- RLS Policy: Allow admins to update verification status
CREATE POLICY "Admins can update verification status" 
ON public.verification_data 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at field
DROP TRIGGER IF EXISTS set_verification_data_updated_at ON public.verification_data;
CREATE TRIGGER set_verification_data_updated_at
BEFORE UPDATE ON public.verification_data
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create helper function to check if user is verified
CREATE OR REPLACE FUNCTION public.is_user_verified(user_id_param uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.verification_data 
    WHERE user_id = user_id_param 
    AND is_verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.verification_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_verified(uuid) TO anon, authenticated;

-- Add some sample statuses for reference
COMMENT ON COLUMN public.verification_data.status IS 'Possible values: pending, approved, rejected, under_review';
COMMENT ON TABLE public.verification_data IS 'Stores user verification information including documents and approval status';

SELECT 'Verification data table created successfully!' as message;

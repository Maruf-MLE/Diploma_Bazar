-- Update existing verification_data table with helper functions and indexes

-- Add missing indexes if not exists (these will improve performance)
CREATE INDEX IF NOT EXISTS verification_data_is_verified_idx 
ON public.verification_data 
USING btree (is_verified) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS verification_data_status_idx 
ON public.verification_data 
USING btree (status) 
TABLESPACE pg_default;

-- Create or update the helper function to check if user is verified
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

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION public.is_user_verified(uuid) TO anon, authenticated;

-- Create or update trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger if it doesn't exist
DROP TRIGGER IF EXISTS set_verification_data_updated_at ON public.verification_data;
CREATE TRIGGER set_verification_data_updated_at
BEFORE UPDATE ON public.verification_data
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add helpful comments
COMMENT ON COLUMN public.verification_data.status IS 'Possible values: pending, approved, rejected, under_review';
COMMENT ON COLUMN public.verification_data.is_verified IS 'Boolean flag: true when admin approves verification, false otherwise';
COMMENT ON TABLE public.verification_data IS 'Stores user verification information including documents and approval status';

-- Sample status update query for admin (for reference)
-- UPDATE public.verification_data 
-- SET is_verified = true, status = 'approved', updated_at = NOW() 
-- WHERE user_id = 'USER_ID_HERE';

SELECT 'Verification table updated successfully with indexes and helper functions!' as message;

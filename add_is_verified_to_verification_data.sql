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
    ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    
    -- Add comment to explain the field
    COMMENT ON COLUMN public.verification_data.is_verified IS 'Indicates if the user is verified';
    
    -- Update existing records to set is_verified to true if they have document_url
    UPDATE public.verification_data
    SET is_verified = TRUE
    WHERE document_url IS NOT NULL;
    
    RAISE NOTICE 'Added is_verified column to verification_data table';
  ELSE
    RAISE NOTICE 'is_verified column already exists in verification_data table';
  END IF;
END $$; 
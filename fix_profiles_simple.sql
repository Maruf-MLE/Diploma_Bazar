-- Simple fix for profiles table - use existing 'name' column as 'full_name'
-- Copy this SQL to Supabase Dashboard -> SQL Editor

-- Add full_name column and populate it from existing 'name' column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text;

-- Update full_name from existing name column
UPDATE public.profiles 
SET full_name = COALESCE(name, 'User ' || substring(id::text, 1, 8))
WHERE full_name IS NULL;

-- Create function to keep full_name in sync with name
CREATE OR REPLACE FUNCTION public.sync_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If name is updated, update full_name too
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    NEW.full_name := COALESCE(NEW.name, 'User ' || substring(NEW.id::text, 1, 8));
  END IF;
  
  -- If full_name is null, generate from name
  IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
    NEW.full_name := COALESCE(NEW.name, 'User ' || substring(NEW.id::text, 1, 8));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for syncing full_name
DROP TRIGGER IF EXISTS sync_full_name_trigger ON public.profiles;
CREATE TRIGGER sync_full_name_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_full_name();

-- Test the setup
SELECT 'Profiles table full_name column added and synced!' as status;

-- Add department and institute_name columns to verification_data table
ALTER TABLE public.verification_data 
ADD COLUMN department text NULL,
ADD COLUMN institute_name text NULL;

-- Add indexes for the new columns for better query performance
CREATE INDEX IF NOT EXISTS verification_data_department_idx 
ON public.verification_data USING btree (department);

CREATE INDEX IF NOT EXISTS verification_data_institute_name_idx 
ON public.verification_data USING btree (institute_name);

-- Optional: Update existing records if you want to populate from profiles table
-- Uncomment the following lines if you want to migrate existing data
/*
UPDATE public.verification_data v
SET 
  department = p.department,
  institute_name = p.institute_name,
  updated_at = NOW()
FROM public.profiles p
WHERE v.user_id = p.id 
AND (v.department IS NULL OR v.institute_name IS NULL);
*/

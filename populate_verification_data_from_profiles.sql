-- Populate department and institute_name in verification_data table from profiles table
-- This script will update existing verification records with data from profiles

-- Check current state before update
SELECT 
  vd.id,
  vd.user_id,
  vd.name,
  vd.department as current_department,
  vd.institute_name as current_institute_name,
  p.department as profile_department,
  p.institute_name as profile_institute_name
FROM verification_data vd
LEFT JOIN profiles p ON vd.user_id = p.id
WHERE vd.department IS NULL OR vd.institute_name IS NULL
ORDER BY vd.created_at DESC;

-- Update verification_data with data from profiles where it's missing or empty
UPDATE verification_data 
SET 
  department = COALESCE(
    NULLIF(verification_data.department, ''),
    profiles.department
  ),
  institute_name = COALESCE(
    NULLIF(verification_data.institute_name, ''),
    profiles.institute_name
  ),
  updated_at = NOW()
FROM profiles
WHERE verification_data.user_id = profiles.id
  AND (
    verification_data.department IS NULL 
    OR verification_data.department = '' 
    OR verification_data.institute_name IS NULL 
    OR verification_data.institute_name = ''
  );

-- Check the result after update
SELECT 
  vd.id,
  vd.user_id,
  vd.name,
  vd.department,
  vd.institute_name,
  vd.roll_no,
  vd.reg_no,
  vd.is_verified,
  vd.updated_at
FROM verification_data vd
ORDER BY vd.created_at DESC;

-- Count statistics
SELECT 
  COUNT(*) as total_records,
  COUNT(department) as records_with_department,
  COUNT(institute_name) as records_with_institute_name,
  COUNT(CASE WHEN department IS NOT NULL AND institute_name IS NOT NULL THEN 1 END) as complete_records
FROM verification_data;

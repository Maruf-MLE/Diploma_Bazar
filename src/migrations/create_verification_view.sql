-- Create a view for verification data
CREATE OR REPLACE VIEW public.verification_view AS
SELECT 
  v.id,
  v.user_id,
  u.email,
  p.full_name,
  v.name as extracted_name,
  v.roll_no,
  v.reg_no,
  v.document_url,
  v.created_at,
  v.updated_at
FROM 
  public.verification_data v
JOIN 
  auth.users u ON v.user_id = u.id
LEFT JOIN 
  public.profiles p ON v.user_id = p.id;

-- Grant access to authenticated users
GRANT SELECT ON public.verification_view TO authenticated; 
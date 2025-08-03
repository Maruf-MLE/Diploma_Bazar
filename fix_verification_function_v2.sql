-- Fixed SQL function to combine verification_data and face_verification tables
-- This fixes the column type mismatch issue

CREATE OR REPLACE FUNCTION public.get_combined_verification_data()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  name TEXT,
  roll_no TEXT,
  reg_no TEXT,
  document_url TEXT,
  photo_url TEXT,
  status TEXT,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  institute_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.user_id,
    COALESCE(u.email, '')::TEXT as email,
    COALESCE(v.name, p.name, '')::TEXT as name,
    COALESCE(v.roll_no, '')::TEXT as roll_no,
    COALESCE(v.reg_no, '')::TEXT as reg_no,
    COALESCE(v.document_url, '')::TEXT as document_url,
    COALESCE(f.photo_url, '')::TEXT as photo_url,
    COALESCE(f.status, 'pending')::TEXT as status,
    COALESCE(v.is_verified, false) AS is_verified,
    v.created_at,
    v.updated_at,
    COALESCE(p.institute_name, '')::TEXT as institute_name
  FROM
    public.verification_data v
  JOIN
    auth.users u ON v.user_id = u.id
  LEFT JOIN
    public.profiles p ON v.user_id = p.id
  LEFT JOIN
    public.face_verification f ON v.user_id = f.user_id
  ORDER BY
    v.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO anon;

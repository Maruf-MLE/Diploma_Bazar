-- Create SQL function to combine verification_data and face_verification tables
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
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.user_id,
    NULL::TEXT as email, -- Email field is not available directly
    p.name,
    v.roll_no,
    v.reg_no,
    v.document_url,
    f.photo_url,
    f.status,
    COALESCE(v.is_verified, false) AS is_verified,
    v.created_at,
    v.updated_at
  FROM
    public.verification_data v
  LEFT JOIN
    public.profiles p ON v.user_id = p.id
  LEFT JOIN
    public.face_verification f ON v.user_id = f.user_id
  ORDER BY
    v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO authenticated; 
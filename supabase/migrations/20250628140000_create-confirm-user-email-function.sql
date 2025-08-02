-- Function to confirm a user's email
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Update the auth.users table to set email_confirmed_at to current timestamp
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = user_id AND email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.confirm_user_email(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_user_email(uuid) TO authenticated; 
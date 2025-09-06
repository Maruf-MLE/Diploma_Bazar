-- Function to handle new user signup and set Google avatar
-- This function will be triggered when a new user signs up

-- First, let's create or replace the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_with_google_avatar()
RETURNS TRIGGER AS $$
DECLARE
  google_avatar_url TEXT;
BEGIN
  -- Extract Google avatar URL from user metadata
  google_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Insert new profile with Google avatar if available
  INSERT INTO public.profiles (
    id,
    name,
    email,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(google_avatar_url, '/placeholder.svg'),
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_with_avatar ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created_with_avatar
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_google_avatar();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_with_google_avatar() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_with_google_avatar() TO anon;
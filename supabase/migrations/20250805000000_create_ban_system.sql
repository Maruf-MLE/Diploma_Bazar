-- Create or update user_ban_status table
CREATE TABLE IF NOT EXISTS "public"."user_ban_status" (
  "user_id" UUID PRIMARY KEY,
  "is_banned" BOOLEAN DEFAULT FALSE,
  "banned_at" TIMESTAMP WITH TIME ZONE,
  "banned_by" TEXT,
  "ban_reason" TEXT,
  "ban_expires_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS with permissive policies
ALTER TABLE "public"."user_ban_status" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations" ON "public"."user_ban_status";
DROP POLICY IF EXISTS "Allow admins full access" ON "public"."user_ban_status";
DROP POLICY IF EXISTS "Allow users to view own ban status" ON "public"."user_ban_status";

-- Create policies
CREATE POLICY "Allow admins full access" ON "public"."user_ban_status"
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Allow users to view own ban status" ON "public"."user_ban_status"
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to check if a user is banned
CREATE OR REPLACE FUNCTION is_user_banned(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT CASE
      WHEN ban_expires_at IS NULL AND is_banned = TRUE THEN TRUE
      WHEN ban_expires_at IS NOT NULL AND ban_expires_at > now() AND is_banned = TRUE THEN TRUE
      ELSE FALSE
    END
    FROM user_ban_status
    WHERE user_ban_status.user_id = $1
    LIMIT 1
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Create function to ban a user
CREATE OR REPLACE FUNCTION ban_user(
  target_user_id UUID,
  ban_status BOOLEAN,
  ban_reason TEXT DEFAULT NULL,
  ban_duration TEXT DEFAULT 'permanent',
  admin_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expiration_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate expiration date based on duration
  IF ban_duration = '7days' THEN
    expiration_date := now() + INTERVAL '7 days';
  ELSIF ban_duration = '30days' THEN
    expiration_date := now() + INTERVAL '30 days';
  ELSIF ban_duration = '90days' THEN
    expiration_date := now() + INTERVAL '90 days';
  END IF;
  
  -- Add or update ban record
  INSERT INTO public.user_ban_status (
    user_id, 
    is_banned,
    banned_at,
    banned_by,
    ban_reason,
    ban_expires_at,
    updated_at
  ) 
  VALUES (
    target_user_id,
    ban_status,
    CASE WHEN ban_status THEN now() ELSE NULL END,
    admin_id::text,
    ban_reason,
    expiration_date,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    is_banned = ban_status,
    banned_at = CASE WHEN ban_status THEN now() ELSE user_ban_status.banned_at END,
    banned_by = CASE WHEN ban_status THEN admin_id::text ELSE user_ban_status.banned_by END,
    ban_reason = CASE WHEN ban_status THEN ban_reason ELSE user_ban_status.ban_reason END,
    ban_expires_at = CASE WHEN ban_status THEN expiration_date ELSE user_ban_status.ban_expires_at END,
    updated_at = now();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$; 
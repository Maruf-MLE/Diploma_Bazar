-- Create a simplified user_ban_status table if it doesn't exist
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

-- Enable RLS with a permissive policy for admin access
ALTER TABLE "public"."user_ban_status" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations" ON "public"."user_ban_status";
DROP POLICY IF EXISTS "Allow admins full access" ON "public"."user_ban_status";
DROP POLICY IF EXISTS "Allow users to view own ban status" ON "public"."user_ban_status";

-- Create a simple policy that allows all operations for now
CREATE POLICY "Allow all operations" ON "public"."user_ban_status" USING (true);

-- Create a function for banning users
CREATE OR REPLACE FUNCTION ban_user(
  target_user_id UUID,
  ban_status BOOLEAN,
  ban_reason TEXT DEFAULT NULL,
  ban_duration TEXT DEFAULT 'permanent'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expiration_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;
BEGIN
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
    auth.uid()::text,
    ban_reason,
    expiration_date,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    is_banned = ban_status,
    banned_at = CASE WHEN ban_status THEN now() ELSE banned_at END,
    banned_by = CASE WHEN ban_status THEN auth.uid()::text ELSE banned_by END,
    ban_reason = CASE WHEN ban_status THEN ban_reason ELSE user_ban_status.ban_reason END,
    ban_expires_at = CASE WHEN ban_status THEN expiration_date ELSE user_ban_status.ban_expires_at END,
    updated_at = now();
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$; 
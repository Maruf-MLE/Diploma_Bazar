-- Create reports table
CREATE TABLE IF NOT EXISTS "public"."reports" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "reported_user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "reporter_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "admin_notes" TEXT,
  "resolved_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "resolved_at" TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admins full access" ON "public"."reports"
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Allow users to create reports" ON "public"."reports"
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Create user_ban_status table
CREATE TABLE IF NOT EXISTS "public"."user_ban_status" (
  "user_id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "is_banned" BOOLEAN NOT NULL DEFAULT FALSE,
  "banned_at" TIMESTAMP WITH TIME ZONE,
  "banned_by" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "ban_reason" TEXT,
  "ban_expires_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE "public"."user_ban_status" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admins full access" ON "public"."user_ban_status"
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Allow users to view own ban status" ON "public"."user_ban_status"
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to get current ban status
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
-- Create a function for creating reports table that can be called by regular users
CREATE OR REPLACE FUNCTION create_reports_table_simple()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the reports table if it doesn't exist
  CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "reported_user_id" UUID,
    "reporter_id" UUID,
    "reason" TEXT,
    "details" TEXT,
    "status" TEXT DEFAULT 'pending',
    "admin_notes" TEXT,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP WITH TIME ZONE
  );

  -- Enable RLS but with a default policy to allow all operations initially
  ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Allow all operations" ON "public"."reports";
  CREATE POLICY "Allow all operations" ON "public"."reports" USING (true);
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$; 
-- Create a function for executing SQL dynamically
-- This function is restricted to admin users only
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is an admin
  IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    EXECUTE sql_query;
  ELSE
    RAISE EXCEPTION 'Access denied. Only administrators can execute SQL.';
  END IF;
END;
$$;

-- Create a function specifically for creating the reports table
CREATE OR REPLACE FUNCTION create_reports_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is an admin
  IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
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
  ELSE
    RAISE EXCEPTION 'Access denied. Only administrators can create the reports table.';
  END IF;
END;
$$;

-- Function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;

-- Function to safely check if a table exists
CREATE OR REPLACE FUNCTION table_exists(schema_name TEXT, table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = schema_name
    AND table_name = table_name
  );
END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION table_exists TO service_role; 
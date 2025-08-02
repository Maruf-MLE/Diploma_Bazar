# User Ban System Setup Instructions

This document provides instructions for setting up the user ban system for the Boi Chapa Bazar application.

## Overview

The user ban system allows administrators to ban users who violate the platform's rules. The system includes:

1. A `user_ban_status` table to store ban information
2. Admin interface for banning/unbanning users
3. Helper functions for managing bans

## Setup Steps

### Step 1: Run the migration scripts

First, ensure you have the necessary migration scripts in your Supabase project:

1. `20250802000000_create_exec_sql_function.sql` - Creates helper functions
2. `20250804000000_create_simple_ban_helper.sql` - Creates the ban table and policies

You can apply these migrations through the Supabase dashboard or using the CLI.

### Step 2: Run the JavaScript setup script

1. Make sure you have the Supabase URL and key available as environment variables:

```bash
export VITE_SUPABASE_URL=your_supabase_url
export VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Run the setup script:

```bash
node fix_ban_system.mjs
```

### Step 3: Verify the setup

1. Check the admin panel to ensure you can view, ban, and unban users
2. Verify console logs for any errors
3. Test banning and unbanning a user

## Troubleshooting

If you encounter issues:

### Error: User ban status table doesn't exist

Run the following SQL in the Supabase SQL Editor:

```sql
-- Create the user_ban_status table
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

-- Enable RLS with permissive policy
ALTER TABLE "public"."user_ban_status" ENABLE ROW LEVEL SECURITY;

-- Create permissive policy
CREATE POLICY "Allow all operations" ON "public"."user_ban_status" USING (true);
```

### Error: Permission denied

Run this SQL to grant permissions:

```sql
GRANT ALL ON TABLE public.user_ban_status TO authenticated;
GRANT ALL ON TABLE public.user_ban_status TO service_role;
```

### Error: Function exec_sql does not exist

Run this SQL:

```sql
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
```

## Technical Details

### user_ban_status Table Structure

| Column         | Type                   | Description                              |
|----------------|------------------------|------------------------------------------|
| user_id        | UUID                   | Primary key, references auth.users(id)   |
| is_banned      | BOOLEAN                | Whether the user is currently banned     |
| banned_at      | TIMESTAMP WITH TIME ZONE | When the user was banned                 |
| banned_by      | TEXT                   | ID of admin who banned the user          |
| ban_reason     | TEXT                   | Reason for ban                           |
| ban_expires_at | TIMESTAMP WITH TIME ZONE | When the ban expires (null = permanent)  |
| created_at     | TIMESTAMP WITH TIME ZONE | Record creation timestamp                |
| updated_at     | TIMESTAMP WITH TIME ZONE | Record update timestamp                  |

### Ban Duration Options

The system supports different ban durations:

- 7 days
- 30 days
- 90 days
- Permanent (no expiration) 
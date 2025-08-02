# Verification Status Fix

This document explains how to fix the issue where all users are showing as "verified noi" (not verified) regardless of their actual verification status.

## The Problem

The verification status check in the UserProfilePage.tsx was directly querying the `verifications` table with a specific status filter, which doesn't match the actual database schema. The application uses both `verification_data` and `face_verification` tables to determine if a user is verified.

## The Solution

1. We've already updated the code to use the `getUserVerificationStatus` function from `@/lib/supabase.ts` which properly checks both tables.

2. To ensure the RPC function works correctly, you need to run the following SQL in your Supabase dashboard:

```sql
-- Function to check if a user is verified
-- This checks both verification_data and face_verification tables
CREATE OR REPLACE FUNCTION public.is_user_verified(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_verified BOOLEAN := FALSE;
BEGIN
  -- First check verification_data table
  SELECT is_verified INTO v_is_verified
  FROM public.verification_data
  WHERE user_id = user_id_param
  LIMIT 1;
  
  -- If verified in verification_data, return true
  IF v_is_verified = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- If not verified in verification_data, check face_verification table
  SELECT is_verified INTO v_is_verified
  FROM public.face_verification
  WHERE user_id = user_id_param
  LIMIT 1;
  
  -- Return the result from face_verification (or FALSE if no records found)
  RETURN COALESCE(v_is_verified, FALSE);
END;
$$;
```

## How to Apply the Fix

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Paste the SQL code above
5. Run the query

This will create or replace the `is_user_verified` function that the application uses to check verification status.

## Verifying the Fix

After applying the fix:

1. Restart your application
2. The verification status should now correctly show as "ভেরিফায়েড" for verified users and "ভেরিফায়েড নয়" for non-verified users
3. Check the browser console for debug messages showing the verification status for each user 
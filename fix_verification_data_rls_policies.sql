-- verification_data টেবিলের RLS Policy ঠিক করার SQL Commands
-- সমস্যা: বর্তমানে RLS policy এর কারণে user verification check করতে পারছে না
-- সমাধান: শুধু admin দেখতে পারবে, কিন্তু verification check function কাজ করবে

-- ১. প্রথমে সব পুরাতন policies মুছে দিই
DROP POLICY IF EXISTS "Users can view their own verification status" ON verification_data;
DROP POLICY IF EXISTS "Users can read their own verification data" ON verification_data;
DROP POLICY IF EXISTS "Allow users to read their own verification" ON verification_data;
DROP POLICY IF EXISTS "Users can insert their own verification data" ON verification_data;
DROP POLICY IF EXISTS "Users can update their own verification data" ON verification_data;
DROP POLICY IF EXISTS "Admins can manage all verification data" ON verification_data;
DROP POLICY IF EXISTS "Admin full access to verification_data" ON verification_data;
DROP POLICY IF EXISTS "verification_data_select_policy" ON verification_data;
DROP POLICY IF EXISTS "verification_data_insert_policy" ON verification_data;
DROP POLICY IF EXISTS "verification_data_update_policy" ON verification_data;

-- ২. RLS enable করি যদি এখনো না করা থাকে
ALTER TABLE verification_data ENABLE ROW LEVEL SECURITY;

-- ৩. শুধুমাত্র Admin দের জন্য সব ধরনের access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin only access to verification_data" ON verification_data
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 
            FROM admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- ৪. একটি security definer function তৈরি করি verification check এর জন্য
-- এই function RLS bypass করবে কিন্তু শুধু verification status return করবে
CREATE OR REPLACE FUNCTION check_user_verification_status(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- এটা RLS bypass করবে
SET search_path = public
AS $$
DECLARE
    is_user_verified BOOLEAN DEFAULT FALSE;
BEGIN
    -- যদি user_uuid NULL হয় তাহলে false return করি
    IF user_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- verification_data table থেকে is_verified check করি
    SELECT COALESCE(is_verified, FALSE)
    INTO is_user_verified
    FROM verification_data
    WHERE user_id = user_uuid
    LIMIT 1;
    
    -- Result return করি
    RETURN COALESCE(is_user_verified, FALSE);
    
EXCEPTION
    WHEN OTHERS THEN
        -- কোন error হলে false return করি
        RETURN FALSE;
END;
$$;

-- ৫. আরেকটি function তৈরি করি যা verification details return করবে (শুধু admin দের জন্য)
CREATE OR REPLACE FUNCTION get_user_verification_details(user_uuid UUID)
RETURNS TABLE(
    is_verified BOOLEAN,
    status TEXT,
    name TEXT,
    roll_no TEXT,
    reg_no TEXT,
    verified_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the caller is an admin
    IF NOT EXISTS (
        SELECT 1 
        FROM admin_users 
        WHERE admin_users.user_id = auth.uid()
    ) THEN
        -- যদি admin না হয় তাহলে empty result return করি
        RETURN;
    END IF;
    
    -- Admin হলে verification details return করি
    RETURN QUERY
    SELECT 
        vd.is_verified,
        vd.status,
        vd.name,
        vd.roll_no,
        vd.reg_no,
        vd.verified_at
    FROM verification_data vd
    WHERE vd.user_id = user_uuid;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Error হলে empty result return করি
        RETURN;
END;
$$;

-- ৬. Function permissions দিই
GRANT EXECUTE ON FUNCTION check_user_verification_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_verification_details(UUID) TO authenticated;

-- ৭. Comment যোগ করি documentation এর জন্য
COMMENT ON POLICY "Admin only access to verification_data" ON verification_data 
IS 'Only admin users can directly access verification_data table. Regular users should use check_user_verification_status() function.';

COMMENT ON FUNCTION check_user_verification_status(UUID) 
IS 'Security definer function to check if a user is verified. Bypasses RLS for verification checking.';

COMMENT ON FUNCTION get_user_verification_details(UUID) 
IS 'Admin-only function to get full verification details of a user.';

-- ৮. Test করার জন্য একটি query (এটা শুধু reference, actual run করার দরকার নেই)
/*
-- Test verification check (যেকোন authenticated user চালাতে পারবে):
SELECT check_user_verification_status('USER_UUID_HERE');

-- Test admin access (শুধু admin চালাতে পারবে):
SELECT * FROM get_user_verification_details('USER_UUID_HERE');
*/

-- সফল হলে message
DO $$
BEGIN
    RAISE NOTICE 'verification_data RLS policies have been successfully updated!';
    RAISE NOTICE 'Only admins can directly access the table now.';
    RAISE NOTICE 'Use check_user_verification_status() function for verification checking.';
END $$;

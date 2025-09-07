-- FINAL RATE LIMIT DATABASE FIX
-- Execute this in Supabase SQL Editor to resolve all conflicts

-- Step 1: Drop ALL existing rate limit functions to avoid conflicts
DROP FUNCTION IF EXISTS check_rate_limit(text, text, text, text);
DROP FUNCTION IF EXISTS check_rate_limit(varchar, varchar, varchar, varchar);
DROP FUNCTION IF EXISTS record_request(text, text, text, text);
DROP FUNCTION IF EXISTS record_request(varchar, varchar, varchar, varchar);

-- Step 2: Ensure clean table structure
CREATE TABLE IF NOT EXISTS rate_limit_entries (
    id BIGSERIAL PRIMARY KEY,
    identifier TEXT NOT NULL,
    identifier_type TEXT DEFAULT 'IP',
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_entries_lookup 
ON rate_limit_entries (identifier, identifier_type, endpoint, method, created_at);

-- Step 4: Create CLEAN check_rate_limit function with TEXT parameters
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_identifier_type TEXT DEFAULT 'IP',
    p_endpoint TEXT DEFAULT '*',
    p_method TEXT DEFAULT 'ALL'
) RETURNS JSON AS $$
DECLARE
    current_minute_count INTEGER := 0;
    current_hour_count INTEGER := 0;
    current_day_count INTEGER := 0;
    minute_limit INTEGER := 50;
    hour_limit INTEGER := 2000;
    day_limit INTEGER := 10000;
    now_time TIMESTAMPTZ := NOW();
    minute_start TIMESTAMPTZ := DATE_TRUNC('minute', now_time);
    hour_start TIMESTAMPTZ := DATE_TRUNC('hour', now_time);
    day_start TIMESTAMPTZ := DATE_TRUNC('day', now_time);
    result JSON;
BEGIN
    -- Set endpoint-specific limits
    CASE p_endpoint
        WHEN '/api/auth/login' THEN minute_limit := 20; hour_limit := 300; day_limit := 1000;
        WHEN '/api/auth/register' THEN minute_limit := 10; hour_limit := 100; day_limit := 300;
        WHEN '/api/auth/reset-password' THEN minute_limit := 5; hour_limit := 30; day_limit := 100;
        WHEN '/api/auth/verify-otp' THEN minute_limit := 15; hour_limit := 200; day_limit := 500;
        WHEN '/api/books' THEN minute_limit := 100; hour_limit := 3000; day_limit := 15000;
        WHEN '/api/messages' THEN minute_limit := 80; hour_limit := 2000; day_limit := 8000;
        WHEN '/api/upload' THEN minute_limit := 20; hour_limit := 300; day_limit := 1000;
        WHEN '/api/notifications' THEN minute_limit := 60; hour_limit := 1000; day_limit := 5000;
        WHEN '/api/admin' THEN minute_limit := 30; hour_limit := 500; day_limit := 2000;
        ELSE minute_limit := 50; hour_limit := 2000; day_limit := 10000;
    END CASE;

    -- Count current minute requests
    SELECT COUNT(*) INTO current_minute_count
    FROM rate_limit_entries
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND created_at >= minute_start;

    -- Count current hour requests
    SELECT COUNT(*) INTO current_hour_count
    FROM rate_limit_entries
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND created_at >= hour_start;

    -- Count current day requests
    SELECT COUNT(*) INTO current_day_count
    FROM rate_limit_entries
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND created_at >= day_start;

    -- Build result JSON
    result := json_build_object(
        'allowed', (
            current_minute_count < minute_limit AND
            current_hour_count < hour_limit AND
            current_day_count < day_limit
        ),
        'blocked', false,
        'blocked_until', null,
        'limits', json_build_object(
            'per_minute', minute_limit,
            'per_hour', hour_limit,
            'per_day', day_limit
        ),
        'current', json_build_object(
            'minute', current_minute_count,
            'hour', current_hour_count,
            'day', current_day_count
        ),
        'reset_times', json_build_object(
            'minute_reset', minute_start + INTERVAL '1 minute',
            'hour_reset', hour_start + INTERVAL '1 hour',
            'day_reset', day_start + INTERVAL '1 day'
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create CLEAN record_request function with TEXT parameters
CREATE OR REPLACE FUNCTION record_request(
    p_identifier TEXT,
    p_identifier_type TEXT DEFAULT 'IP',
    p_endpoint TEXT DEFAULT '*',
    p_method TEXT DEFAULT 'ALL'
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO rate_limit_entries (identifier, identifier_type, endpoint, method)
    VALUES (p_identifier, p_identifier_type, p_endpoint, p_method);
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Test the functions to make sure they work
DO $$
DECLARE
    test_result JSON;
    record_result BOOLEAN;
    verify_result JSON;
BEGIN
    -- Test check_rate_limit
    SELECT check_rate_limit('test-setup-final', 'IP', '/api/test', 'GET') INTO test_result;
    RAISE NOTICE 'check_rate_limit test: %', test_result;
    
    -- Test record_request
    SELECT record_request('test-setup-final', 'IP', '/api/test', 'GET') INTO record_result;
    RAISE NOTICE 'record_request test: %', record_result;
    
    -- Verify counting
    SELECT check_rate_limit('test-setup-final', 'IP', '/api/test', 'GET') INTO verify_result;
    RAISE NOTICE 'Counting verification: %', verify_result;
    
    -- Clean up test data
    DELETE FROM rate_limit_entries WHERE identifier = 'test-setup-final';
    RAISE NOTICE 'Test completed and cleaned up';
END;
$$;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_request(text, text, text, text) TO anon, authenticated;
GRANT SELECT, INSERT ON rate_limit_entries TO anon, authenticated;

-- Final confirmation
SELECT 'Final rate limit database setup complete!' as status;

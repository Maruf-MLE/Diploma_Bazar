-- Check and fix rate limit tables and functions
-- Execute this step by step in Supabase SQL Editor

-- Step 1: Check existing tables (run this first to see what exists)
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('rate_limit_tracker', 'rate_limit_entries', 'rate_limit_violations')
-- ORDER BY table_name, ordinal_position;

-- Step 2: Create rate_limit_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS rate_limit_entries (
    id BIGSERIAL PRIMARY KEY,
    identifier TEXT NOT NULL,
    identifier_type TEXT DEFAULT 'IP',
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create rate_limit_violations table if it doesn't exist  
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id BIGSERIAL PRIMARY KEY,
    identifier TEXT NOT NULL,
    identifier_type TEXT DEFAULT 'IP',
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_count INTEGER NOT NULL,
    limit_exceeded TEXT NOT NULL,
    user_agent TEXT,
    headers JSONB,
    blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_entries_lookup 
ON rate_limit_entries (identifier, identifier_type, endpoint, method, created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_lookup 
ON rate_limit_violations (identifier, identifier_type, blocked, blocked_until);

-- Step 5: Updated check_rate_limit function with proper table references
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
    minute_limit INTEGER := 50;  -- Default: 50/minute
    hour_limit INTEGER := 2000;  -- Default: 2000/hour
    day_limit INTEGER := 10000;  -- Default: 10000/day
    now_time TIMESTAMPTZ := NOW();
    minute_start TIMESTAMPTZ := DATE_TRUNC('minute', now_time);
    hour_start TIMESTAMPTZ := DATE_TRUNC('hour', now_time);
    day_start TIMESTAMPTZ := DATE_TRUNC('day', now_time);
    is_blocked BOOLEAN := FALSE;
    blocked_until TIMESTAMPTZ := NULL;
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

    -- Check if temporarily blocked
    SELECT blocked, blocked_until INTO is_blocked, blocked_until
    FROM rate_limit_violations
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND blocked = TRUE
      AND blocked_until > now_time
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT is_blocked THEN blocked_until := NULL; END IF;

    -- Build result
    result := json_build_object(
        'allowed', (
            current_minute_count < minute_limit AND
            current_hour_count < hour_limit AND
            current_day_count < day_limit AND
            NOT is_blocked
        ),
        'blocked', COALESCE(is_blocked, FALSE),
        'blocked_until', blocked_until,
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

-- Step 6: Create record_request function
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

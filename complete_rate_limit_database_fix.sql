-- COMPLETE RATE LIMITING DATABASE FIX
-- Execute this step by step in Supabase SQL Editor
-- This resolves all schema conflicts and sets up proper rate limiting

-- Step 1: Drop any existing conflicting functions
DROP FUNCTION IF EXISTS check_rate_limit(text, text, text, text);
DROP FUNCTION IF EXISTS record_request(text, text, text, text);

-- Step 2: Create or ensure proper table structure
-- Rate limit entries table for request counting
CREATE TABLE IF NOT EXISTS rate_limit_entries (
    id BIGSERIAL PRIMARY KEY,
    identifier TEXT NOT NULL,
    identifier_type TEXT DEFAULT 'IP',
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit violations table (with blocking info)
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id BIGSERIAL PRIMARY KEY,
    identifier TEXT NOT NULL,
    identifier_type TEXT DEFAULT 'IP',
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    limit_exceeded TEXT NOT NULL DEFAULT 'per_minute',
    user_agent TEXT,
    headers JSONB,
    blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMPTZ,
    violation_time TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit tracker (aggregated counts)
CREATE TABLE IF NOT EXISTS rate_limit_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('IP', 'USER', 'MIXED')),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(identifier, identifier_type, endpoint, method, window_start)
);

-- Rate limit config table
CREATE TABLE IF NOT EXISTS rate_limit_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'ALL',
    requests_per_minute INTEGER NOT NULL DEFAULT 50,
    requests_per_hour INTEGER NOT NULL DEFAULT 1000,
    requests_per_day INTEGER NOT NULL DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(endpoint, method)
);

-- Step 3: Add missing columns safely
DO $$ 
BEGIN
    -- Add blocked column to violations if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rate_limit_violations' 
        AND column_name = 'blocked'
    ) THEN
        ALTER TABLE rate_limit_violations ADD COLUMN blocked BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add blocked_until column to violations if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rate_limit_violations' 
        AND column_name = 'blocked_until'
    ) THEN
        ALTER TABLE rate_limit_violations ADD COLUMN blocked_until TIMESTAMPTZ;
    END IF;

    -- Add violation_time column to violations if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rate_limit_violations' 
        AND column_name = 'violation_time'
    ) THEN
        ALTER TABLE rate_limit_violations ADD COLUMN violation_time TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Step 4: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_entries_lookup 
ON rate_limit_entries (identifier, identifier_type, endpoint, method, created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_lookup 
ON rate_limit_violations (identifier, identifier_type, blocked, blocked_until);

CREATE INDEX IF NOT EXISTS idx_rate_limit_tracker_lookup
ON rate_limit_tracker (identifier, identifier_type, endpoint, method, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limit_tracker_window 
ON rate_limit_tracker(window_start, window_end);

-- Step 5: Insert default rate limit configurations
INSERT INTO rate_limit_config (endpoint, method, requests_per_minute, requests_per_hour, requests_per_day) VALUES
('*', 'ALL', 50, 2000, 10000),
('/api/auth/login', 'ALL', 20, 300, 1000),
('/api/auth/register', 'ALL', 10, 100, 300),
('/api/auth/reset-password', 'ALL', 5, 30, 100),
('/api/auth/verify-otp', 'ALL', 15, 200, 500),
('/api/books', 'ALL', 100, 3000, 15000),
('/api/messages', 'ALL', 80, 2000, 8000),
('/api/upload', 'ALL', 20, 300, 1000),
('/api/notifications', 'ALL', 60, 1000, 5000),
('/api/admin', 'ALL', 30, 500, 2000)
ON CONFLICT (endpoint, method) DO UPDATE SET
    requests_per_minute = EXCLUDED.requests_per_minute,
    requests_per_hour = EXCLUDED.requests_per_hour,
    requests_per_day = EXCLUDED.requests_per_day,
    updated_at = NOW();

-- Step 6: Create the main check_rate_limit function
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
    is_blocked BOOLEAN := FALSE;
    blocked_until_time TIMESTAMPTZ := NULL;
    config_record RECORD;
    result JSON;
BEGIN
    -- Get endpoint-specific limits from config
    SELECT requests_per_minute, requests_per_hour, requests_per_day
    INTO config_record
    FROM rate_limit_config 
    WHERE (endpoint = p_endpoint OR endpoint = '*')
      AND (method = p_method OR method = 'ALL')
      AND is_active = true
    ORDER BY 
        CASE WHEN endpoint = p_endpoint THEN 1 ELSE 2 END,
        CASE WHEN method = p_method THEN 1 ELSE 2 END
    LIMIT 1;
    
    -- Use config values or defaults
    IF config_record IS NOT NULL THEN
        minute_limit := config_record.requests_per_minute;
        hour_limit := config_record.requests_per_hour;
        day_limit := config_record.requests_per_day;
    ELSE
        -- Hardcoded endpoint-specific limits as fallback
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
    END IF;

    -- Count current minute requests from rate_limit_entries
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

    -- Check if temporarily blocked from violations table
    SELECT v.blocked, v.blocked_until 
    INTO is_blocked, blocked_until_time
    FROM rate_limit_violations v
    WHERE v.identifier = p_identifier
      AND v.identifier_type = p_identifier_type
      AND v.blocked = TRUE
      AND (v.blocked_until IS NULL OR v.blocked_until > now_time)
    ORDER BY v.violation_time DESC
    LIMIT 1;

    -- Clean up blocked status if expired
    IF is_blocked IS NULL THEN 
        is_blocked := FALSE;
        blocked_until_time := NULL;
    ELSIF blocked_until_time IS NOT NULL AND blocked_until_time <= now_time THEN
        is_blocked := FALSE;
        blocked_until_time := NULL;
    END IF;

    -- Build result JSON
    result := json_build_object(
        'allowed', (
            current_minute_count < minute_limit AND
            current_hour_count < hour_limit AND
            current_day_count < day_limit AND
            NOT COALESCE(is_blocked, FALSE)
        ),
        'blocked', COALESCE(is_blocked, FALSE),
        'blocked_until', blocked_until_time,
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

-- Step 7: Create the record_request function
CREATE OR REPLACE FUNCTION record_request(
    p_identifier TEXT,
    p_identifier_type TEXT DEFAULT 'IP',
    p_endpoint TEXT DEFAULT '*',
    p_method TEXT DEFAULT 'ALL'
) RETURNS BOOLEAN AS $$
DECLARE
    current_window_start TIMESTAMPTZ := DATE_TRUNC('minute', NOW());
    current_window_end TIMESTAMPTZ := DATE_TRUNC('minute', NOW()) + INTERVAL '1 minute';
BEGIN
    -- Record in rate_limit_entries table
    INSERT INTO rate_limit_entries (identifier, identifier_type, endpoint, method)
    VALUES (p_identifier, p_identifier_type, p_endpoint, p_method);
    
    -- Also record in rate_limit_tracker for aggregation
    INSERT INTO rate_limit_tracker (
        identifier, 
        identifier_type, 
        endpoint, 
        method, 
        request_count, 
        window_start, 
        window_end
    ) VALUES (
        p_identifier, 
        p_identifier_type, 
        p_endpoint, 
        p_method, 
        1, 
        current_window_start, 
        current_window_end
    )
    ON CONFLICT (identifier, identifier_type, endpoint, method, window_start) 
    DO UPDATE SET 
        request_count = rate_limit_tracker.request_count + 1,
        updated_at = NOW();
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the request
    RAISE WARNING 'Failed to record request: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_rate_limit_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_entries INTEGER := 0;
    deleted_tracker INTEGER := 0;
    deleted_violations INTEGER := 0;
    total_deleted INTEGER := 0;
BEGIN
    -- Delete entries older than 24 hours
    DELETE FROM rate_limit_entries 
    WHERE created_at < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS deleted_entries = ROW_COUNT;
    
    -- Delete tracker entries older than 24 hours
    DELETE FROM rate_limit_tracker 
    WHERE window_start < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS deleted_tracker = ROW_COUNT;
    
    -- Delete old violation records (keep for 30 days)
    DELETE FROM rate_limit_violations 
    WHERE violation_time < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_violations = ROW_COUNT;
    
    total_deleted := deleted_entries + deleted_tracker + deleted_violations;
    
    RAISE NOTICE 'Cleaned up % entries, % tracker records, % violations (% total)', 
                 deleted_entries, deleted_tracker, deleted_violations, total_deleted;
    
    RETURN total_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Grant necessary permissions
-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_request(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_rate_limit_data() TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT ON rate_limit_entries TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON rate_limit_tracker TO anon, authenticated;
GRANT SELECT ON rate_limit_config TO anon, authenticated;
GRANT SELECT, INSERT ON rate_limit_violations TO anon, authenticated;

-- Step 10: Test the setup
DO $$
DECLARE
    test_result JSON;
BEGIN
    -- Test the check_rate_limit function
    SELECT check_rate_limit('test-setup', 'IP', '/api/test', 'GET') INTO test_result;
    RAISE NOTICE 'Setup test result: %', test_result;
    
    -- Test record_request function
    IF record_request('test-setup', 'IP', '/api/test', 'GET') THEN
        RAISE NOTICE 'Record request test: SUCCESS';
    ELSE
        RAISE NOTICE 'Record request test: FAILED';
    END IF;
    
    -- Cleanup test data
    DELETE FROM rate_limit_entries WHERE identifier = 'test-setup';
    DELETE FROM rate_limit_tracker WHERE identifier = 'test-setup';
END;
$$;

-- Final verification query
SELECT 
    'Database setup complete!' as status,
    (SELECT COUNT(*) FROM rate_limit_config) as config_records,
    (SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'check_rate_limit')) as check_function_exists,
    (SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'record_request')) as record_function_exists;

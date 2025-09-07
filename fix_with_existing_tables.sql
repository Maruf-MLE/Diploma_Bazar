-- REQUEST COUNTING FIX using existing table structure
-- Execute this in Supabase SQL Editor

-- Step 1: Add missing columns to rate_limit_violations if needed
DO $$ 
BEGIN
    -- Add blocked column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rate_limit_violations' 
        AND column_name = 'blocked'
    ) THEN
        ALTER TABLE rate_limit_violations ADD COLUMN blocked BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add blocked_until column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rate_limit_violations' 
        AND column_name = 'blocked_until'
    ) THEN
        ALTER TABLE rate_limit_violations ADD COLUMN blocked_until TIMESTAMPTZ;
    END IF;
END $$;

-- Step 2: Drop old function versions
DROP FUNCTION IF EXISTS check_rate_limit(text, text, text, text);
DROP FUNCTION IF EXISTS record_request(text, text, text, text);

-- Step 3: Create updated check_rate_limit function using existing rate_limit_tracker table
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

    -- Count current minute requests from rate_limit_tracker
    SELECT COALESCE(SUM(request_count), 0) INTO current_minute_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND window_start >= minute_start
      AND window_start < minute_start + INTERVAL '1 minute';

    -- Count current hour requests
    SELECT COALESCE(SUM(request_count), 0) INTO current_hour_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND window_start >= hour_start
      AND window_start < hour_start + INTERVAL '1 hour';

    -- Count current day requests
    SELECT COALESCE(SUM(request_count), 0) INTO current_day_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND window_start >= day_start
      AND window_start < day_start + INTERVAL '1 day';

    -- Check if temporarily blocked (if blocked columns exist)
    BEGIN
        SELECT blocked, blocked_until INTO is_blocked, blocked_until
        FROM rate_limit_violations
        WHERE identifier = p_identifier
          AND identifier_type = p_identifier_type
          AND blocked = TRUE
          AND blocked_until > now_time
        ORDER BY violation_time DESC
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        -- If blocked columns don't exist, ignore blocking logic
        is_blocked := FALSE;
        blocked_until := NULL;
    END;

    IF NOT is_blocked THEN blocked_until := NULL; END IF;

    -- Build result JSON
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

-- Step 4: Create record_request function using existing rate_limit_tracker table
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
    -- Insert or update request count in rate_limit_tracker
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
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create cleanup function to remove old entries (optional)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_entries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete entries older than 24 hours
    DELETE FROM rate_limit_tracker 
    WHERE window_start < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

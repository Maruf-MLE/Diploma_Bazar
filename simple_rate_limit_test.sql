-- Simple test function to verify limits without database dependency
-- Execute this in Supabase SQL Editor

DROP FUNCTION IF EXISTS check_rate_limit(text, text, text, text);

CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_identifier_type TEXT DEFAULT 'IP',
    p_endpoint TEXT DEFAULT '*',
    p_method TEXT DEFAULT 'ALL'
) RETURNS JSON AS $$
DECLARE
    minute_limit INTEGER := 50;  -- Default: 50/minute
    hour_limit INTEGER := 2000;  -- Default: 2000/hour  
    day_limit INTEGER := 10000;  -- Default: 10000/day
    result JSON;
BEGIN
    -- Set endpoint-specific limits
    CASE p_endpoint
        WHEN '/api/auth/login' THEN 
            minute_limit := 20; hour_limit := 300; day_limit := 1000;
        WHEN '/api/auth/register' THEN 
            minute_limit := 10; hour_limit := 100; day_limit := 300;
        WHEN '/api/auth/reset-password' THEN 
            minute_limit := 5; hour_limit := 30; day_limit := 100;
        WHEN '/api/auth/verify-otp' THEN 
            minute_limit := 15; hour_limit := 200; day_limit := 500;
        WHEN '/api/books' THEN 
            minute_limit := 100; hour_limit := 3000; day_limit := 15000;
        WHEN '/api/messages' THEN 
            minute_limit := 80; hour_limit := 2000; day_limit := 8000;
        WHEN '/api/upload' THEN 
            minute_limit := 20; hour_limit := 300; day_limit := 1000;
        WHEN '/api/notifications' THEN 
            minute_limit := 60; hour_limit := 1000; day_limit := 5000;
        WHEN '/api/admin' THEN 
            minute_limit := 30; hour_limit := 500; day_limit := 2000;
        ELSE 
            minute_limit := 50; hour_limit := 2000; day_limit := 10000;
    END CASE;

    -- Return simple result for testing (no database queries for now)
    result := json_build_object(
        'allowed', true,
        'blocked', false,
        'blocked_until', null,
        'limits', json_build_object(
            'per_minute', minute_limit,
            'per_hour', hour_limit,
            'per_day', day_limit
        ),
        'current', json_build_object(
            'minute', 0,
            'hour', 0,
            'day', 0
        ),
        'reset_times', json_build_object(
            'minute_reset', NOW() + INTERVAL '1 minute',
            'hour_reset', NOW() + INTERVAL '1 hour',
            'day_reset', NOW() + INTERVAL '1 day'
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

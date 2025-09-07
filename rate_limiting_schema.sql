-- Rate Limiting System Database Schema
-- This schema creates tables and functions for managing API rate limits

-- Table for storing rate limit configurations
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

-- Table for tracking request counts per IP/User
CREATE TABLE IF NOT EXISTS rate_limit_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- IP address or user ID
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

-- Table for storing blocked IPs/Users
CREATE TABLE IF NOT EXISTS rate_limit_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('IP', 'USER')),
    reason TEXT,
    blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_permanent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    
    UNIQUE(identifier, identifier_type)
);

-- Table for logging rate limit violations
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    identifier_type VARCHAR(20) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_count INTEGER NOT NULL,
    limit_exceeded VARCHAR(50) NOT NULL, -- 'per_minute', 'per_hour', 'per_day'
    user_agent TEXT,
    headers JSONB,
    violation_time TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default rate limit configurations
INSERT INTO rate_limit_config (endpoint, method, requests_per_minute, requests_per_hour, requests_per_day) VALUES
('*', 'ALL', 50, 1000, 10000),
('/api/auth/login', 'POST', 10, 100, 500),
('/api/auth/register', 'POST', 5, 50, 100),
('/api/auth/reset-password', 'POST', 3, 20, 50),
('/api/books', 'POST', 20, 200, 500),
('/api/messages', 'POST', 30, 500, 2000),
('/api/upload', 'POST', 10, 100, 200)
ON CONFLICT (endpoint, method) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracker_identifier ON rate_limit_tracker(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracker_window ON rate_limit_tracker(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracker_endpoint ON rate_limit_tracker(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocks_identifier ON rate_limit_blocks(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_time ON rate_limit_violations(violation_time);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier VARCHAR(255),
    p_identifier_type VARCHAR(20),
    p_endpoint VARCHAR(255),
    p_method VARCHAR(10)
) RETURNS JSONB AS $$
DECLARE
    v_config RECORD;
    v_current_minute_count INTEGER := 0;
    v_current_hour_count INTEGER := 0;
    v_current_day_count INTEGER := 0;
    v_current_time TIMESTAMP WITH TIME ZONE := now();
    v_minute_start TIMESTAMP WITH TIME ZONE := date_trunc('minute', v_current_time);
    v_hour_start TIMESTAMP WITH TIME ZONE := date_trunc('hour', v_current_time);
    v_day_start TIMESTAMP WITH TIME ZONE := date_trunc('day', v_current_time);
    v_is_blocked BOOLEAN := false;
    v_block_until TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if identifier is blocked
    SELECT blocked_until INTO v_block_until
    FROM rate_limit_blocks 
    WHERE identifier = p_identifier 
      AND identifier_type = p_identifier_type
      AND (is_permanent = true OR blocked_until > v_current_time);
    
    IF FOUND THEN
        v_is_blocked := true;
    END IF;
    
    -- Get rate limit configuration (specific endpoint first, then wildcard)
    SELECT * INTO v_config
    FROM rate_limit_config 
    WHERE (endpoint = p_endpoint OR endpoint = '*')
      AND (method = p_method OR method = 'ALL')
      AND is_active = true
    ORDER BY 
        CASE WHEN endpoint = p_endpoint THEN 1 ELSE 2 END,
        CASE WHEN method = p_method THEN 1 ELSE 2 END
    LIMIT 1;
    
    -- If no config found, use default
    IF NOT FOUND THEN
        v_config.requests_per_minute := 50;
        v_config.requests_per_hour := 1000;
        v_config.requests_per_day := 10000;
    END IF;
    
    -- Get current counts
    SELECT COALESCE(SUM(request_count), 0) INTO v_current_minute_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND window_start >= v_minute_start;
    
    SELECT COALESCE(SUM(request_count), 0) INTO v_current_hour_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND window_start >= v_hour_start;
    
    SELECT COALESCE(SUM(request_count), 0) INTO v_current_day_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND window_start >= v_day_start;
    
    -- Return status
    RETURN jsonb_build_object(
        'allowed', NOT v_is_blocked AND 
                  v_current_minute_count < v_config.requests_per_minute AND
                  v_current_hour_count < v_config.requests_per_hour AND
                  v_current_day_count < v_config.requests_per_day,
        'blocked', v_is_blocked,
        'blocked_until', v_block_until,
        'limits', jsonb_build_object(
            'per_minute', v_config.requests_per_minute,
            'per_hour', v_config.requests_per_hour,
            'per_day', v_config.requests_per_day
        ),
        'current', jsonb_build_object(
            'minute', v_current_minute_count,
            'hour', v_current_hour_count,
            'day', v_current_day_count
        ),
        'reset_times', jsonb_build_object(
            'minute_reset', v_minute_start + interval '1 minute',
            'hour_reset', v_hour_start + interval '1 hour',
            'day_reset', v_day_start + interval '1 day'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to record a request
CREATE OR REPLACE FUNCTION record_request(
    p_identifier VARCHAR(255),
    p_identifier_type VARCHAR(20),
    p_endpoint VARCHAR(255),
    p_method VARCHAR(10)
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_time TIMESTAMP WITH TIME ZONE := now();
    v_minute_start TIMESTAMP WITH TIME ZONE := date_trunc('minute', v_current_time);
    v_minute_end TIMESTAMP WITH TIME ZONE := v_minute_start + interval '1 minute';
BEGIN
    -- Insert or update request count for current minute window
    INSERT INTO rate_limit_tracker (
        identifier, identifier_type, endpoint, method, 
        request_count, window_start, window_end
    ) VALUES (
        p_identifier, p_identifier_type, p_endpoint, p_method,
        1, v_minute_start, v_minute_end
    )
    ON CONFLICT (identifier, identifier_type, endpoint, method, window_start)
    DO UPDATE SET 
        request_count = rate_limit_tracker.request_count + 1,
        updated_at = v_current_time;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old tracking data
CREATE OR REPLACE FUNCTION cleanup_rate_limit_data() RETURNS VOID AS $$
BEGIN
    -- Delete tracking data older than 1 day
    DELETE FROM rate_limit_tracker 
    WHERE window_end < now() - interval '1 day';
    
    -- Delete violation logs older than 30 days
    DELETE FROM rate_limit_violations 
    WHERE violation_time < now() - interval '30 days';
    
    -- Remove expired blocks
    DELETE FROM rate_limit_blocks 
    WHERE is_permanent = false AND blocked_until < now();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old data (runs every hour)
-- Note: This requires the pg_cron extension to be enabled
-- SELECT cron.schedule('rate-limit-cleanup', '0 * * * *', 'SELECT cleanup_rate_limit_data();');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limit_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rate_limit_tracker TO authenticated;
GRANT SELECT ON rate_limit_blocks TO authenticated;
GRANT INSERT ON rate_limit_violations TO authenticated;

-- Enable RLS
ALTER TABLE rate_limit_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to rate limit config" ON rate_limit_config
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to manage rate limit config" ON rate_limit_config
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow read access to rate limit blocks" ON rate_limit_blocks
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to manage blocks" ON rate_limit_blocks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage tracking" ON rate_limit_tracker
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage violations" ON rate_limit_violations
    FOR ALL USING (auth.role() = 'service_role');

-- Comment on tables for documentation
COMMENT ON TABLE rate_limit_config IS 'Configuration table for API rate limits per endpoint';
COMMENT ON TABLE rate_limit_tracker IS 'Tracks request counts per identifier within time windows';
COMMENT ON TABLE rate_limit_blocks IS 'Stores blocked identifiers with expiry times';
COMMENT ON TABLE rate_limit_violations IS 'Logs all rate limit violations for monitoring';

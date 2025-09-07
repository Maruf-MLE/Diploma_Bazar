-- Advanced Rate Limiting Functions
-- Additional stored procedures for enhanced rate limiting functionality

-- Function to get rate limit configuration for a specific endpoint
CREATE OR REPLACE FUNCTION get_rate_limit_config(
    p_endpoint VARCHAR(255),
    p_method VARCHAR(10) DEFAULT 'ALL'
) RETURNS JSONB AS $$
DECLARE
    v_config RECORD;
BEGIN
    -- Get specific configuration (exact match first, then wildcard)
    SELECT * INTO v_config
    FROM rate_limit_config 
    WHERE (endpoint = p_endpoint OR endpoint = '*')
      AND (method = p_method OR method = 'ALL')
      AND is_active = true
    ORDER BY 
        CASE WHEN endpoint = p_endpoint THEN 1 ELSE 2 END,
        CASE WHEN method = p_method THEN 1 ELSE 2 END
    LIMIT 1;
    
    -- Return configuration as JSON
    IF FOUND THEN
        RETURN jsonb_build_object(
            'endpoint', v_config.endpoint,
            'method', v_config.method,
            'requests_per_minute', v_config.requests_per_minute,
            'requests_per_hour', v_config.requests_per_hour,
            'requests_per_day', v_config.requests_per_day,
            'is_active', v_config.is_active
        );
    ELSE
        -- Return default configuration
        RETURN jsonb_build_object(
            'endpoint', '*',
            'method', 'ALL',
            'requests_per_minute', 50,
            'requests_per_hour', 1000,
            'requests_per_day', 10000,
            'is_active', true
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to block an identifier (IP or user)
CREATE OR REPLACE FUNCTION block_identifier(
    p_identifier VARCHAR(255),
    p_identifier_type VARCHAR(20),
    p_reason TEXT DEFAULT 'Rate limit violations',
    p_duration_minutes INTEGER DEFAULT 15,
    p_is_permanent BOOLEAN DEFAULT false,
    p_created_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate block expiry time
    IF p_is_permanent THEN
        v_blocked_until := now() + interval '100 years'; -- Effectively permanent
    ELSE
        v_blocked_until := now() + (p_duration_minutes || ' minutes')::INTERVAL;
    END IF;
    
    -- Insert or update block record
    INSERT INTO rate_limit_blocks (
        identifier, identifier_type, reason, blocked_until, is_permanent, created_by
    ) VALUES (
        p_identifier, p_identifier_type, p_reason, v_blocked_until, p_is_permanent, p_created_by
    )
    ON CONFLICT (identifier, identifier_type)
    DO UPDATE SET 
        reason = p_reason,
        blocked_until = v_blocked_until,
        is_permanent = p_is_permanent,
        created_at = now(),
        created_by = p_created_by;
    
    -- Log the blocking action
    INSERT INTO rate_limit_violations (
        identifier, identifier_type, endpoint, method, 
        request_count, limit_exceeded, user_agent
    ) VALUES (
        p_identifier, p_identifier_type, 'BLOCKED', 'ADMIN',
        0, 'manual_block', 'ADMIN_ACTION'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to unblock an identifier
CREATE OR REPLACE FUNCTION unblock_identifier(
    p_identifier VARCHAR(255),
    p_identifier_type VARCHAR(20)
) RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM rate_limit_blocks 
    WHERE identifier = p_identifier 
      AND identifier_type = p_identifier_type;
    
    -- Return true if a record was deleted
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to check if an identifier is blocked
CREATE OR REPLACE FUNCTION is_identifier_blocked(
    p_identifier VARCHAR(255),
    p_identifier_type VARCHAR(20)
) RETURNS JSONB AS $$
DECLARE
    v_block RECORD;
BEGIN
    SELECT * INTO v_block
    FROM rate_limit_blocks 
    WHERE identifier = p_identifier 
      AND identifier_type = p_identifier_type
      AND (is_permanent = true OR blocked_until > now());
    
    IF FOUND THEN
        RETURN jsonb_build_object(
            'blocked', true,
            'reason', v_block.reason,
            'blocked_until', v_block.blocked_until,
            'is_permanent', v_block.is_permanent,
            'created_at', v_block.created_at
        );
    ELSE
        RETURN jsonb_build_object('blocked', false);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get violation statistics for an identifier
CREATE OR REPLACE FUNCTION get_violation_stats(
    p_identifier VARCHAR(255),
    p_identifier_type VARCHAR(20),
    p_hours_back INTEGER DEFAULT 24
) RETURNS JSONB AS $$
DECLARE
    v_total_violations INTEGER;
    v_recent_violations INTEGER;
    v_violation_types JSONB;
BEGIN
    -- Get total violations
    SELECT COUNT(*) INTO v_total_violations
    FROM rate_limit_violations
    WHERE identifier = p_identifier 
      AND identifier_type = p_identifier_type;
    
    -- Get recent violations
    SELECT COUNT(*) INTO v_recent_violations
    FROM rate_limit_violations
    WHERE identifier = p_identifier 
      AND identifier_type = p_identifier_type
      AND violation_time >= now() - (p_hours_back || ' hours')::INTERVAL;
    
    -- Get violation types breakdown
    SELECT jsonb_object_agg(limit_exceeded, violation_count) INTO v_violation_types
    FROM (
        SELECT limit_exceeded, COUNT(*) as violation_count
        FROM rate_limit_violations
        WHERE identifier = p_identifier 
          AND identifier_type = p_identifier_type
          AND violation_time >= now() - (p_hours_back || ' hours')::INTERVAL
        GROUP BY limit_exceeded
    ) as violation_breakdown;
    
    RETURN jsonb_build_object(
        'identifier', p_identifier,
        'identifier_type', p_identifier_type,
        'total_violations', v_total_violations,
        'recent_violations', v_recent_violations,
        'hours_back', p_hours_back,
        'violation_types', COALESCE(v_violation_types, '{}'::jsonb),
        'checked_at', now()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get current request counts for an identifier
CREATE OR REPLACE FUNCTION get_current_request_counts(
    p_identifier VARCHAR(255),
    p_identifier_type VARCHAR(20),
    p_endpoint VARCHAR(255) DEFAULT '*',
    p_method VARCHAR(10) DEFAULT 'ALL'
) RETURNS JSONB AS $$
DECLARE
    v_minute_count INTEGER := 0;
    v_hour_count INTEGER := 0;
    v_day_count INTEGER := 0;
    v_current_time TIMESTAMP WITH TIME ZONE := now();
    v_minute_start TIMESTAMP WITH TIME ZONE := date_trunc('minute', v_current_time);
    v_hour_start TIMESTAMP WITH TIME ZONE := date_trunc('hour', v_current_time);
    v_day_start TIMESTAMP WITH TIME ZONE := date_trunc('day', v_current_time);
BEGIN
    -- Get minute count
    SELECT COALESCE(SUM(request_count), 0) INTO v_minute_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND (endpoint = p_endpoint OR p_endpoint = '*')
      AND (method = p_method OR p_method = 'ALL')
      AND window_start >= v_minute_start;
    
    -- Get hour count
    SELECT COALESCE(SUM(request_count), 0) INTO v_hour_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND (endpoint = p_endpoint OR p_endpoint = '*')
      AND (method = p_method OR p_method = 'ALL')
      AND window_start >= v_hour_start;
    
    -- Get day count
    SELECT COALESCE(SUM(request_count), 0) INTO v_day_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND (endpoint = p_endpoint OR p_endpoint = '*')
      AND (method = p_method OR p_method = 'ALL')
      AND window_start >= v_day_start;
    
    RETURN jsonb_build_object(
        'identifier', p_identifier,
        'identifier_type', p_identifier_type,
        'endpoint', p_endpoint,
        'method', p_method,
        'current_minute', v_minute_count,
        'current_hour', v_hour_count,
        'current_day', v_day_count,
        'reset_times', jsonb_build_object(
            'minute_reset', v_minute_start + interval '1 minute',
            'hour_reset', v_hour_start + interval '1 hour',
            'day_reset', v_day_start + interval '1 day'
        ),
        'checked_at', v_current_time
    );
END;
$$ LANGUAGE plpgsql;

-- Function to auto-block based on violation patterns
CREATE OR REPLACE FUNCTION auto_block_violators() RETURNS INTEGER AS $$
DECLARE
    v_violator RECORD;
    v_block_count INTEGER := 0;
BEGIN
    -- Find identifiers with excessive violations in the last 24 hours
    FOR v_violator IN
        SELECT 
            identifier,
            identifier_type,
            COUNT(*) as violation_count,
            MAX(violation_time) as last_violation
        FROM rate_limit_violations
        WHERE violation_time >= now() - interval '24 hours'
        GROUP BY identifier, identifier_type
        HAVING COUNT(*) >= 5  -- 5 violations threshold
        AND NOT EXISTS (
            SELECT 1 FROM rate_limit_blocks 
            WHERE rate_limit_blocks.identifier = rate_limit_violations.identifier
              AND rate_limit_blocks.identifier_type = rate_limit_violations.identifier_type
              AND (is_permanent = true OR blocked_until > now())
        )
    LOOP
        -- Determine block duration based on violation count
        DECLARE
            v_duration INTEGER;
        BEGIN
            IF v_violator.violation_count >= 20 THEN
                v_duration := 1440; -- 24 hours
            ELSIF v_violator.violation_count >= 10 THEN
                v_duration := 240;  -- 4 hours
            ELSE
                v_duration := 60;   -- 1 hour
            END IF;
            
            -- Block the violator
            PERFORM block_identifier(
                v_violator.identifier,
                v_violator.identifier_type,
                format('Auto-blocked: %s violations in 24 hours', v_violator.violation_count),
                v_duration,
                false,
                NULL
            );
            
            v_block_count := v_block_count + 1;
        END;
    END LOOP;
    
    RETURN v_block_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset request counts for an identifier (admin use)
CREATE OR REPLACE FUNCTION reset_request_counts(
    p_identifier VARCHAR(255),
    p_identifier_type VARCHAR(20),
    p_endpoint VARCHAR(255) DEFAULT '*'
) RETURNS BOOLEAN AS $$
BEGIN
    IF p_endpoint = '*' THEN
        -- Reset all endpoints for the identifier
        DELETE FROM rate_limit_tracker
        WHERE identifier = p_identifier
          AND identifier_type = p_identifier_type;
    ELSE
        -- Reset specific endpoint
        DELETE FROM rate_limit_tracker
        WHERE identifier = p_identifier
          AND identifier_type = p_identifier_type
          AND endpoint = p_endpoint;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to update rate limit configuration
CREATE OR REPLACE FUNCTION update_rate_limit_config(
    p_endpoint VARCHAR(255),
    p_method VARCHAR(10),
    p_requests_per_minute INTEGER DEFAULT NULL,
    p_requests_per_hour INTEGER DEFAULT NULL,
    p_requests_per_day INTEGER DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE rate_limit_config
    SET 
        requests_per_minute = COALESCE(p_requests_per_minute, requests_per_minute),
        requests_per_hour = COALESCE(p_requests_per_hour, requests_per_hour),
        requests_per_day = COALESCE(p_requests_per_day, requests_per_day),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = now()
    WHERE endpoint = p_endpoint AND method = p_method;
    
    -- If no rows were updated, insert a new configuration
    IF NOT FOUND THEN
        INSERT INTO rate_limit_config (
            endpoint, method, 
            requests_per_minute, requests_per_hour, requests_per_day,
            is_active
        ) VALUES (
            p_endpoint, p_method,
            COALESCE(p_requests_per_minute, 50),
            COALESCE(p_requests_per_hour, 1000),
            COALESCE(p_requests_per_day, 10000),
            COALESCE(p_is_active, true)
        );
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get rate limiting statistics
CREATE OR REPLACE FUNCTION get_rate_limit_statistics(
    p_hours_back INTEGER DEFAULT 24
) RETURNS JSONB AS $$
DECLARE
    v_total_requests INTEGER;
    v_total_violations INTEGER;
    v_blocked_identifiers INTEGER;
    v_top_violators JSONB;
    v_endpoint_stats JSONB;
BEGIN
    -- Get total requests
    SELECT COALESCE(SUM(request_count), 0) INTO v_total_requests
    FROM rate_limit_tracker
    WHERE created_at >= now() - (p_hours_back || ' hours')::INTERVAL;
    
    -- Get total violations
    SELECT COUNT(*) INTO v_total_violations
    FROM rate_limit_violations
    WHERE violation_time >= now() - (p_hours_back || ' hours')::INTERVAL;
    
    -- Get blocked identifiers count
    SELECT COUNT(*) INTO v_blocked_identifiers
    FROM rate_limit_blocks
    WHERE created_at >= now() - (p_hours_back || ' hours')::INTERVAL;
    
    -- Get top violators
    SELECT jsonb_agg(
        jsonb_build_object(
            'identifier', identifier,
            'identifier_type', identifier_type,
            'violations', violation_count
        )
    ) INTO v_top_violators
    FROM (
        SELECT identifier, identifier_type, COUNT(*) as violation_count
        FROM rate_limit_violations
        WHERE violation_time >= now() - (p_hours_back || ' hours')::INTERVAL
        GROUP BY identifier, identifier_type
        ORDER BY violation_count DESC
        LIMIT 10
    ) as top_violators;
    
    -- Get endpoint statistics
    SELECT jsonb_agg(
        jsonb_build_object(
            'endpoint', endpoint,
            'method', method,
            'requests', request_count,
            'violations', violation_count
        )
    ) INTO v_endpoint_stats
    FROM (
        SELECT 
            COALESCE(t.endpoint, v.endpoint) as endpoint,
            COALESCE(t.method, v.method) as method,
            COALESCE(SUM(t.request_count), 0) as request_count,
            COALESCE(COUNT(v.id), 0) as violation_count
        FROM rate_limit_tracker t
        FULL OUTER JOIN rate_limit_violations v ON (
            t.endpoint = v.endpoint AND t.method = v.method
            AND v.violation_time >= now() - (p_hours_back || ' hours')::INTERVAL
        )
        WHERE t.created_at >= now() - (p_hours_back || ' hours')::INTERVAL
           OR v.violation_time >= now() - (p_hours_back || ' hours')::INTERVAL
        GROUP BY t.endpoint, t.method, v.endpoint, v.method
        ORDER BY request_count DESC
        LIMIT 20
    ) as endpoint_stats;
    
    RETURN jsonb_build_object(
        'period_hours', p_hours_back,
        'total_requests', v_total_requests,
        'total_violations', v_total_violations,
        'blocked_identifiers', v_blocked_identifiers,
        'violation_rate', CASE 
            WHEN v_total_requests > 0 THEN ROUND((v_total_violations::DECIMAL / v_total_requests::DECIMAL) * 100, 2)
            ELSE 0
        END,
        'top_violators', COALESCE(v_top_violators, '[]'::jsonb),
        'endpoint_stats', COALESCE(v_endpoint_stats, '[]'::jsonb),
        'generated_at', now()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to perform maintenance tasks
CREATE OR REPLACE FUNCTION rate_limit_maintenance() RETURNS JSONB AS $$
DECLARE
    v_deleted_tracker INTEGER;
    v_deleted_violations INTEGER;
    v_deleted_blocks INTEGER;
    v_auto_blocked INTEGER;
BEGIN
    -- Clean up old tracking data (older than 7 days)
    DELETE FROM rate_limit_tracker 
    WHERE window_end < now() - interval '7 days';
    GET DIAGNOSTICS v_deleted_tracker = ROW_COUNT;
    
    -- Clean up old violation logs (older than 90 days)
    DELETE FROM rate_limit_violations 
    WHERE violation_time < now() - interval '90 days';
    GET DIAGNOSTICS v_deleted_violations = ROW_COUNT;
    
    -- Remove expired blocks
    DELETE FROM rate_limit_blocks 
    WHERE is_permanent = false AND blocked_until < now();
    GET DIAGNOSTICS v_deleted_blocks = ROW_COUNT;
    
    -- Auto-block violators
    SELECT auto_block_violators() INTO v_auto_blocked;
    
    RETURN jsonb_build_object(
        'tracker_records_deleted', v_deleted_tracker,
        'violation_records_deleted', v_deleted_violations,
        'expired_blocks_removed', v_deleted_blocks,
        'auto_blocked_count', v_auto_blocked,
        'maintenance_completed_at', now()
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_rate_limit_config TO authenticated;
GRANT EXECUTE ON FUNCTION block_identifier TO authenticated;
GRANT EXECUTE ON FUNCTION unblock_identifier TO authenticated;
GRANT EXECUTE ON FUNCTION is_identifier_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION get_violation_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_request_counts TO authenticated;
GRANT EXECUTE ON FUNCTION auto_block_violators TO authenticated;
GRANT EXECUTE ON FUNCTION reset_request_counts TO authenticated;
GRANT EXECUTE ON FUNCTION update_rate_limit_config TO authenticated;
GRANT EXECUTE ON FUNCTION get_rate_limit_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION rate_limit_maintenance TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION get_rate_limit_config IS 'Get rate limit configuration for a specific endpoint and method';
COMMENT ON FUNCTION block_identifier IS 'Block an IP address or user ID with optional reason and duration';
COMMENT ON FUNCTION unblock_identifier IS 'Remove block from an IP address or user ID';
COMMENT ON FUNCTION is_identifier_blocked IS 'Check if an identifier is currently blocked';
COMMENT ON FUNCTION get_violation_stats IS 'Get violation statistics for an identifier';
COMMENT ON FUNCTION get_current_request_counts IS 'Get current request counts for an identifier';
COMMENT ON FUNCTION auto_block_violators IS 'Automatically block identifiers with excessive violations';
COMMENT ON FUNCTION reset_request_counts IS 'Reset request counts for an identifier (admin function)';
COMMENT ON FUNCTION update_rate_limit_config IS 'Update or create rate limit configuration';
COMMENT ON FUNCTION get_rate_limit_statistics IS 'Get comprehensive rate limiting statistics';
COMMENT ON FUNCTION rate_limit_maintenance IS 'Perform maintenance tasks (cleanup and auto-blocking)';

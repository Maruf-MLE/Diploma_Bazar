// Update database rate limit function with new production limits
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔄 Updating Database Rate Limit Function');
console.log('========================================\n');

// Initialize Supabase with service key (needed for function updates)
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.log('❌ SUPABASE_SERVICE_KEY not found');
  console.log('⚠️  Cannot update database function without service key');
  console.log('📋 Manual steps required:');
  console.log('   1. Open Supabase Dashboard > SQL Editor');
  console.log('   2. Copy and execute the SQL from update_rate_limit_defaults.sql');
  console.log('   3. Run the test again');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const updateSQL = `
-- Update rate limit function to use new production limits
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
    minute_limit INTEGER := 50;  -- Updated from 10 to 50
    hour_limit INTEGER := 2000;   -- Updated from 100 to 2000
    day_limit INTEGER := 10000;   -- Updated from 500 to 10000
    now_time TIMESTAMP := NOW();
    minute_start TIMESTAMP := DATE_TRUNC('minute', now_time);
    hour_start TIMESTAMP := DATE_TRUNC('hour', now_time);
    day_start TIMESTAMP := DATE_TRUNC('day', now_time);
    is_blocked BOOLEAN := FALSE;
    blocked_until TIMESTAMP := NULL;
    result JSON;
BEGIN
    -- Set endpoint-specific limits
    CASE p_endpoint
        -- Authentication endpoints (more restrictive)
        WHEN '/api/auth/login' THEN
            minute_limit := 20;
            hour_limit := 300;
            day_limit := 1000;
        WHEN '/api/auth/register' THEN
            minute_limit := 10;
            hour_limit := 100;
            day_limit := 300;
        WHEN '/api/auth/reset-password' THEN
            minute_limit := 5;
            hour_limit := 30;
            day_limit := 100;
        WHEN '/api/auth/verify-otp' THEN
            minute_limit := 15;
            hour_limit := 200;
            day_limit := 500;
        
        -- API endpoints
        WHEN '/api/books' THEN
            minute_limit := 100;
            hour_limit := 3000;
            day_limit := 15000;
        WHEN '/api/messages' THEN
            minute_limit := 80;
            hour_limit := 2000;
            day_limit := 8000;
        WHEN '/api/upload' THEN
            minute_limit := 20;
            hour_limit := 300;
            day_limit := 1000;
        WHEN '/api/notifications' THEN
            minute_limit := 60;
            hour_limit := 1000;
            day_limit := 5000;
        
        -- Admin endpoints
        WHEN '/api/admin' THEN
            minute_limit := 30;
            hour_limit := 500;
            day_limit := 2000;
        
        -- Default limits for other endpoints
        ELSE
            minute_limit := 50;   -- New default: 50/minute
            hour_limit := 2000;   -- New default: 2000/hour
            day_limit := 10000;   -- New default: 10000/day
    END CASE;

    -- Count current requests for this minute
    SELECT COUNT(*) INTO current_minute_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND request_time >= minute_start
      AND request_time < minute_start + INTERVAL '1 minute';

    -- Count current requests for this hour
    SELECT COUNT(*) INTO current_hour_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND request_time >= hour_start
      AND request_time < hour_start + INTERVAL '1 hour';

    -- Count current requests for this day
    SELECT COUNT(*) INTO current_day_count
    FROM rate_limit_tracker
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND method = p_method
      AND request_time >= day_start
      AND request_time < day_start + INTERVAL '1 day';

    -- Check if temporarily blocked
    SELECT blocked, blocked_until INTO is_blocked, blocked_until
    FROM rate_limit_violations
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND blocked = TRUE
      AND blocked_until > now_time
    ORDER BY created_at DESC
    LIMIT 1;

    -- If not blocked, check if blocked_until should be NULL
    IF NOT is_blocked THEN
        blocked_until := NULL;
    END IF;

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
`;

async function updateDatabaseFunction() {
  console.log('🔧 Attempting to update database function...');
  
  try {
    // Execute the SQL to update the function
    const { data, error } = await supabase.rpc('sql', {
      query: updateSQL
    });
    
    if (error) {
      console.log('❌ Failed to update via RPC, trying direct execution...');
      
      // Try alternative method
      const result = await supabase
        .from('_dummy_table_that_does_not_exist')
        .select('*')
        .limit(0);
      
      // If that doesn't work, show manual instructions
      throw new Error('Cannot update function programmatically');
    }
    
    console.log('✅ Database function updated successfully!');
    return true;
    
  } catch (error) {
    console.log('⚠️  Automatic update failed:', error.message);
    console.log('\n📋 MANUAL UPDATE REQUIRED:');
    console.log('==========================');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the SQL from: update_rate_limit_defaults.sql');
    console.log('4. Execute the SQL query');
    console.log('5. Run the test again with: node test-50-limit.cjs');
    return false;
  }
}

async function testAfterUpdate() {
  console.log('\n🧪 Testing updated limits...');
  
  try {
    const testIdentifier = 'test-update-' + Date.now();
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: testIdentifier,
      p_identifier_type: 'IP',
      p_endpoint: '/api/test',
      p_method: 'GET'
    });
    
    if (error) {
      console.log('❌ Test failed:', error.message);
      return false;
    }
    
    console.log('📊 New limits detected:');
    console.log('- Per minute:', data.limits.per_minute);
    console.log('- Per hour:', data.limits.per_hour);
    console.log('- Per day:', data.limits.per_day);
    
    if (data.limits.per_minute === 50) {
      console.log('✅ Success! New 50/minute limit is active');
      return true;
    } else {
      console.log('⚠️  Expected 50/minute, got', data.limits.per_minute);
      console.log('   Manual update may be required');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

async function main() {
  const updated = await updateDatabaseFunction();
  
  if (updated) {
    const testPassed = await testAfterUpdate();
    
    if (testPassed) {
      console.log('\n🎉 RATE LIMIT UPDATE COMPLETE!');
      console.log('==============================');
      console.log('✅ Database function updated');
      console.log('✅ New limits verified');
      console.log('✅ 50 requests/minute limit active');
      console.log('\n🚀 Production ready with new limits!');
    }
  }
}

main().catch(console.error);

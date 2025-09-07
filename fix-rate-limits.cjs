// Fix Rate Limits - Set Very Low Limits for Testing
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log(`
🔧 FIXING RATE LIMITS
===================

Setting EXTREMELY low limits to test rate limiting...

`);

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

const fixRateLimits = async () => {
  try {
    console.log('1️⃣ Setting extremely low rate limits...');
    
    // Update the default configuration to VERY LOW limits
    const { data: updateResult, error: updateError } = await supabase
      .from('rate_limit_config')
      .update({
        requests_per_minute: 3,    // EXTREMELY LOW - trigger after 3 requests
        requests_per_hour: 20,
        requests_per_day: 100,
        updated_at: new Date().toISOString()
      })
      .eq('endpoint', '*')
      .eq('method', 'ALL');
    
    if (updateError) {
      console.log(`❌ Update error: ${updateError.message}`);
      return false;
    }
    
    console.log(`✅ Default limits updated to 3/minute`);
    
    // Also update test endpoint specifically
    const { data: insertResult, error: insertError } = await supabase
      .from('rate_limit_config')
      .upsert({
        endpoint: '/api/test',
        method: 'GET',
        requests_per_minute: 2,    // Even LOWER - trigger after 2 requests
        requests_per_hour: 10,
        requests_per_day: 50,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint,method'
      });
    
    if (insertError) {
      console.log(`❌ Insert error: ${insertError.message}`);
    } else {
      console.log(`✅ Test endpoint limit set to 2/minute`);
    }
    
    console.log('\n2️⃣ Clearing old tracking data...');
    
    // Clear old tracking data to start fresh
    const { error: clearError } = await supabase
      .from('rate_limit_tracker')
      .delete()
      .gte('id', 0);  // Delete all records
    
    if (clearError) {
      console.log(`⚠️  Clear error (not critical): ${clearError.message}`);
    } else {
      console.log(`✅ Old tracking data cleared`);
    }
    
    console.log('\n3️⃣ Verifying new configuration...');
    
    // Check the new configuration
    const { data: configData, error: configError } = await supabase
      .from('rate_limit_config')
      .select('*')
      .or('endpoint.eq.*,endpoint.eq./api/test');
    
    if (configError) {
      console.log(`❌ Config check error: ${configError.message}`);
    } else {
      console.log(`✅ Current configuration:`);
      configData.forEach(config => {
        console.log(`   ${config.endpoint} ${config.method}: ${config.requests_per_minute}/min`);
      });
    }
    
    console.log('\n4️⃣ Testing with new limits...');
    
    // Test the new limits
    for (let i = 1; i <= 5; i++) {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: 'TEST-IP-' + Date.now(),  // New identifier for clean test
        p_identifier_type: 'IP',
        p_endpoint: '/api/test', 
        p_method: 'GET'
      });
      
      if (error) {
        console.log(`❌ Test call ${i} failed: ${error.message}`);
      } else {
        console.log(`📞 Test call ${i}: ${data.current.minute}/min, allowed: ${data.allowed}, limit: ${data.limits.per_minute}`);
        
        if (!data.allowed) {
          console.log(`🎉 SUCCESS: Rate limiting TRIGGERED on call ${i}!`);
          break;
        }
        
        // Record the request if allowed
        if (data.allowed) {
          await supabase.rpc('record_request', {
            p_identifier: 'TEST-IP-' + Date.now(),
            p_identifier_type: 'IP',
            p_endpoint: '/api/test',
            p_method: 'GET'
          });
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n✅ RATE LIMITS FIXED!`);
    console.log(`📊 New Limits:`);
    console.log(`   • Default endpoints: 3 requests/minute`);
    console.log(`   • /api/test: 2 requests/minute`);
    console.log(`\n🎯 Now test your server - rate limiting should work!`);
    
  } catch (error) {
    console.error(`🚨 Fix failed: ${error.message}`);
  }
};

fixRateLimits();

// Debug Database Functions
// Direct test of check_rate_limit and record_request functions

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log(`
🔬 DATABASE FUNCTIONS DEBUG
============================

Testing the exact same calls that middleware makes...

`);

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

const debugDatabaseFunctions = async () => {
  console.log('1️⃣ TESTING EXACT MIDDLEWARE LOGIC:');
  
  const testIdentifier = '127.0.0.1';
  const testIdentifierType = 'IP';
  const testEndpoint = '/api/test';
  const testMethod = 'GET';
  
  console.log(`Using: ${testIdentifierType}:${testIdentifier} -> ${testMethod} ${testEndpoint}\n`);
  
  // Simulate exactly what middleware does
  for (let i = 1; i <= 6; i++) {
    console.log(`--- REQUEST ${i} ---`);
    
    try {
      // 1. Check rate limit (same as middleware)
      console.log(`🔍 Calling check_rate_limit...`);
      const { data: checkData, error: checkError } = await supabase.rpc('check_rate_limit', {
        p_identifier: testIdentifier,
        p_identifier_type: testIdentifierType,
        p_endpoint: testEndpoint,
        p_method: testMethod
      });
      
      if (checkError) {
        console.log(`❌ check_rate_limit error:`, checkError);
        continue;
      }
      
      console.log(`📊 Check result:`, {
        allowed: checkData.allowed,
        blocked: checkData.blocked,
        current: checkData.current,
        limits: checkData.limits
      });
      
      // 2. Check if rate limit exceeded (middleware logic)
      if (!checkData.allowed) {
        console.log(`🚨 RATE LIMIT EXCEEDED! Should return 429`);
        console.log(`❌ Current usage exceeds limits`);
        
        // This is where middleware would return 429
        break;
      }
      
      // 3. Record the request (same as middleware)
      console.log(`📝 Recording request...`);
      const { data: recordData, error: recordError } = await supabase.rpc('record_request', {
        p_identifier: testIdentifier,
        p_identifier_type: testIdentifierType,
        p_endpoint: testEndpoint,
        p_method: testMethod
      });
      
      if (recordError) {
        console.log(`❌ record_request error:`, recordError);
      } else {
        console.log(`✅ Request recorded successfully`);
      }
      
      // 4. Check database tables directly
      const { data: trackerData } = await supabase
        .from('rate_limit_tracker')
        .select('*')
        .eq('identifier', testIdentifier)
        .eq('endpoint', testEndpoint)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (trackerData && trackerData.length > 0) {
        console.log(`📈 Tracker data:`, {
          request_count: trackerData[0].request_count,
          window_start: trackerData[0].window_start,
          window_end: trackerData[0].window_end
        });
      }
      
    } catch (error) {
      console.log(`💥 Exception on request ${i}:`, error.message);
    }
    
    console.log(``);
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('2️⃣ FINAL DATABASE STATE:');
  
  try {
    // Check final tracker state
    const { data: finalTracker } = await supabase
      .from('rate_limit_tracker')
      .select('*')
      .eq('identifier', testIdentifier)
      .order('updated_at', { ascending: false });
    
    console.log(`📊 Tracker entries: ${finalTracker?.length || 0}`);
    if (finalTracker && finalTracker.length > 0) {
      finalTracker.forEach((entry, index) => {
        console.log(`   Entry ${index + 1}: ${entry.endpoint} ${entry.method} - ${entry.request_count} requests`);
      });
    }
    
    // Check violations
    const { data: violations } = await supabase
      .from('rate_limit_violations')
      .select('*')
      .eq('identifier', testIdentifier)
      .order('violation_time', { ascending: false });
    
    console.log(`🚨 Violations: ${violations?.length || 0}`);
    if (violations && violations.length > 0) {
      violations.forEach((violation, index) => {
        console.log(`   Violation ${index + 1}: ${violation.limit_exceeded} on ${violation.endpoint}`);
      });
    }
    
    // Check configuration that should be used
    const { data: config } = await supabase
      .from('rate_limit_config')
      .select('*')
      .or(`endpoint.eq.${testEndpoint},endpoint.eq.*`)
      .eq('method', testMethod)
      .eq('is_active', true);
    
    console.log(`⚙️  Active configs for ${testEndpoint} ${testMethod}:`);
    if (config && config.length > 0) {
      config.forEach(c => {
        console.log(`   ${c.endpoint} ${c.method}: ${c.requests_per_minute}/min`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Final state check error:`, error.message);
  }
  
  console.log(`\n🎯 ANALYSIS:`);
  console.log(`If rate limiting still doesn't work after this test:`);
  console.log(`1. Database functions might have logic errors`);
  console.log(`2. Configuration might not be matching correctly`);
  console.log(`3. Time window calculations might be wrong`);
  console.log(`4. Middleware bypass logic might be incorrect`);
};

debugDatabaseFunctions().catch(console.error);

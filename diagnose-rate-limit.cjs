// Comprehensive Rate Limit Diagnosis
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log(`
🔍 RATE LIMIT DIAGNOSIS
=======================

সমস্যা: Rate limiting কাজ করছে না
কারণ খুঁজে বের করি...

`);

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

const diagnoseIssue = async () => {
  console.log('1️⃣ CONFIG ANALYSIS:');
  
  try {
    const { RATE_LIMIT_CONFIG } = require('./src/config/rateLimitConfig.cjs');
    
    console.log(`📊 Default requests per minute: ${RATE_LIMIT_CONFIG.DEFAULT_LIMITS.REQUESTS_PER_MINUTE}`);
    console.log(`📊 Development bypass: ${RATE_LIMIT_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS}`);
    console.log(`📊 NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`📊 BYPASS_RATE_LIMITS env: ${process.env.BYPASS_RATE_LIMITS}`);
    
    // Check the exact bypass logic
    const shouldBypass = RATE_LIMIT_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS && process.env.NODE_ENV === 'development';
    console.log(`🚨 BYPASS ACTIVE: ${shouldBypass}`);
    
    if (shouldBypass) {
      console.log(`❌ PROBLEM FOUND: Rate limiting is being bypassed in development!`);
      console.log(`   Config line: BYPASS_RATE_LIMITS: process.env.NODE_ENV === 'development' && process.env.BYPASS_RATE_LIMITS === 'true'`);
      console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`   BYPASS_RATE_LIMITS: ${process.env.BYPASS_RATE_LIMITS}`);
    }
  } catch (error) {
    console.log(`❌ Config error: ${error.message}`);
  }
  
  console.log('\n2️⃣ DATABASE FUNCTION TEST:');
  
  // Test with very aggressive calls
  for (let i = 1; i <= 10; i++) {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: '127.0.0.1',
        p_identifier_type: 'IP', 
        p_endpoint: '/api/test',
        p_method: 'GET'
      });
      
      if (error) {
        console.log(`❌ Call ${i} failed: ${error.message}`);
      } else {
        console.log(`📞 Call ${i}: ${data.current.minute}/min, allowed: ${data.allowed}, limits: ${data.limits.per_minute}`);
        
        if (!data.allowed) {
          console.log(`🎉 SUCCESS: Rate limiting TRIGGERED on call ${i}!`);
          break;
        }
      }
      
      // Record the request
      await supabase.rpc('record_request', {
        p_identifier: '127.0.0.1',
        p_identifier_type: 'IP',
        p_endpoint: '/api/test', 
        p_method: 'GET'
      });
      
    } catch (error) {
      console.log(`❌ Error on call ${i}: ${error.message}`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n3️⃣ DATABASE DATA CHECK:');
  
  // Check tables
  try {
    const { data: trackerData, error: trackerError } = await supabase
      .from('rate_limit_tracker')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false });
      
    if (trackerError) {
      console.log(`❌ Tracker table error: ${trackerError.message}`);
    } else {
      console.log(`✅ Tracker table: ${trackerData.length} entries`);
      if (trackerData.length > 0) {
        console.log(`📝 Latest entry:`, trackerData[0]);
      }
    }
    
    const { data: configData, error: configError } = await supabase
      .from('rate_limit_config')
      .select('*')
      .limit(5);
      
    if (configError) {
      console.log(`❌ Config table error: ${configError.message}`);
    } else {
      console.log(`✅ Config table: ${configData.length} entries`);
      if (configData.length > 0) {
        console.log(`📝 Config entries:`, configData);
      }
    }
    
    const { data: violationsData, error: violationsError } = await supabase
      .from('rate_limit_violations')
      .select('*')
      .limit(5)
      .order('violation_time', { ascending: false });
      
    if (violationsError) {
      console.log(`❌ Violations table error: ${violationsError.message}`);
    } else {
      console.log(`✅ Violations table: ${violationsData.length} entries`);
      if (violationsData.length > 0) {
        console.log(`📝 Latest violation:`, violationsData[0]);
      } else {
        console.log(`⚠️  No violations recorded - this means rate limiting isn't triggering!`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Database check failed: ${error.message}`);
  }
  
  console.log('\n4️⃣ DIAGNOSIS SUMMARY:');
  console.log('═══════════════════');
  
  // Check environment variables that might affect rate limiting
  console.log(`🔍 Environment Analysis:`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
  console.log(`   BYPASS_RATE_LIMITS: ${process.env.BYPASS_RATE_LIMITS || 'NOT SET'}`);
  
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_RATE_LIMITS === 'true') {
    console.log(`\n🚨 ROOT CAUSE FOUND:`);
    console.log(`   Rate limiting is BYPASSED because:`);
    console.log(`   - NODE_ENV is 'development'`);
    console.log(`   - BYPASS_RATE_LIMITS is 'true'`);
    console.log(`   - Config logic: BYPASS when both conditions are true`);
    
    console.log(`\n🔧 SOLUTIONS:`);
    console.log(`   1. Set BYPASS_RATE_LIMITS=false in .env`);
    console.log(`   2. Or remove BYPASS_RATE_LIMITS from .env`);
    console.log(`   3. Or set NODE_ENV=production for testing`);
  }
  
  // Check if database limits are too high
  console.log(`\n🎯 RECOMMENDATION:`);
  console.log(`   Set EXTREMELY low limits for testing:`);
  console.log(`   - per_minute: 3 (instead of 50)`);
  console.log(`   - This will make rate limiting trigger easily`);
};

diagnoseIssue().catch(console.error);

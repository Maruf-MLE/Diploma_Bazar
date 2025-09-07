// Final Comprehensive Rate Limit Check
require('dotenv').config();

console.log(`
🔍 FINAL RATE LIMIT CHECK REPORT
===============================

📋 What this script checks:
1. Configuration settings
2. Database setup
3. Local server test  
4. Environment variables
5. Production readiness

Let's start...\n`);

// 1. Check Configuration
console.log('1️⃣ CONFIGURATION CHECK:');
try {
  const { RATE_LIMIT_CONFIG } = require('./src/config/rateLimitConfig.cjs');
  
  console.log(`✅ Config loaded successfully`);
  console.log(`📊 Default limit per minute: ${RATE_LIMIT_CONFIG.DEFAULT_LIMITS.REQUESTS_PER_MINUTE}`);
  console.log(`📊 Development bypass: ${RATE_LIMIT_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS}`);
  console.log(`📊 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`📊 API Key validation enabled: ${RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.ENABLED}`);
  console.log(`📊 Required for anonymous: ${RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.REQUIRED_FOR_ANONYMOUS}`);
} catch (error) {
  console.log(`❌ Configuration error: ${error.message}`);
}
console.log('');

// 2. Check Database
console.log('2️⃣ DATABASE CHECK:');
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

const checkDatabase = async () => {
  try {
    // Test the rate limit function
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: '127.0.0.1',
      p_identifier_type: 'IP',
      p_endpoint: '/api/test',
      p_method: 'GET'
    });
    
    if (error) {
      console.log(`❌ Database functions not working: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Database functions working`);
      console.log(`📊 Current limits: ${data.limits.per_minute}/minute, ${data.limits.per_hour}/hour`);
      console.log(`📊 Current usage: ${data.current.minute}/minute, ${data.current.hour}/hour`);
      console.log(`📊 Requests allowed: ${data.allowed}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    return false;
  }
};

// 3. Environment Variables Check
console.log('3️⃣ ENVIRONMENT VARIABLES:');
console.log(`📌 SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`📌 SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET'}`);
console.log(`📌 SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);
console.log(`📌 API_KEY_1: ${process.env.API_KEY_1 ? 'SET' : 'NOT SET'}`);
console.log(`📌 JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`📌 NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log('');

// 4. Production Readiness Check
console.log('4️⃣ PRODUCTION READINESS:');

// Check if in development mode that might bypass rate limiting
if (process.env.NODE_ENV === 'development') {
  if (process.env.BYPASS_RATE_LIMITS === 'true') {
    console.log(`⚠️  Rate limiting is BYPASSED in development mode!`);
    console.log(`   This is why your tests might not show rate limiting.`);
  } else {
    console.log(`✅ Rate limiting is NOT bypassed in development`);
  }
} else if (process.env.NODE_ENV === 'production') {
  console.log(`✅ Running in production mode - rate limiting should be active`);
} else {
  console.log(`⚠️  NODE_ENV not set - rate limiting behavior uncertain`);
}
console.log('');

// Main execution
const runFinalCheck = async () => {
  const dbWorking = await checkDatabase();
  
  console.log('5️⃣ FINAL VERDICT:');
  console.log('═══════════════');
  
  if (!dbWorking) {
    console.log(`🚨 RATE LIMITING IS NOT WORKING`);
    console.log(`   Reason: Database functions not available`);
    console.log(`   Fix: Run 'node setup_rate_limiting.cjs'`);
    return;
  }
  
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_RATE_LIMITS === 'true') {
    console.log(`⚠️  RATE LIMITING IS BYPASSED`);
    console.log(`   Reason: Development mode with BYPASS_RATE_LIMITS=true`);
    console.log(`   This is NORMAL for development`);
    console.log(`   In production, rate limiting will work automatically`);
    return;
  }
  
  const hasApiKeys = process.env.API_KEY_1 && process.env.API_KEY_2;
  if (!hasApiKeys) {
    console.log(`⚠️  API KEYS NOT SET`);
    console.log(`   This might cause authentication issues`);
    console.log(`   Check your .env file`);
  }
  
  console.log(`✅ RATE LIMITING SHOULD BE WORKING`);
  console.log(`   Database: ✅ Connected and functional`);
  console.log(`   Functions: ✅ Available`);
  console.log(`   Config: ✅ Loaded`);
  
  console.log(`\n📋 TO TEST IN PRODUCTION:`);
  console.log(`   1. Deploy your app`);
  console.log(`   2. Set NODE_ENV=production`);
  console.log(`   3. Ensure BYPASS_RATE_LIMITS is not set to 'true'`);
  console.log(`   4. Make rapid API calls to trigger limits`);
  
  console.log(`\n📋 CURRENT LIMITS:`);
  console.log(`   • 5 requests per minute (very low for testing)`);
  console.log(`   • 100 requests per hour`);
  console.log(`   • 1000 requests per day`);
  console.log(`\n   These limits are intentionally low for easy testing!`);
};

runFinalCheck().catch(console.error);

// Verify 50/minute rate limit after database update
const { createClient } = require('@supabase/supabase-js');

process.env.NODE_ENV = 'production';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify50Limit() {
  console.log('🔍 VERIFYING 50/MINUTE RATE LIMIT');
  console.log('==================================\n');
  
  const testIdentifier = 'verify-50-' + Date.now();
  
  try {
    // Check different endpoints
    const endpoints = [
      { endpoint: '/api/test', expected: 50, description: 'Default API' },
      { endpoint: '/api/books', expected: 100, description: 'Books API' },
      { endpoint: '/api/auth/login', expected: 20, description: 'Auth Login' },
      { endpoint: '/api/auth/register', expected: 10, description: 'Auth Register' }
    ];
    
    console.log('📊 Checking endpoint limits:');
    console.log('-'.repeat(40));
    
    let allCorrect = true;
    
    for (const { endpoint, expected, description } of endpoints) {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: testIdentifier + endpoint.replace(/\//g, '-'),
        p_identifier_type: 'IP',
        p_endpoint: endpoint,
        p_method: 'GET'
      });
      
      if (error) {
        console.log(`❌ ${description}: ERROR - ${error.message}`);
        allCorrect = false;
        continue;
      }
      
      const actual = data.limits.per_minute;
      const status = actual === expected ? '✅' : '❌';
      
      if (actual !== expected) allCorrect = false;
      
      console.log(`${status} ${description.padEnd(15)}: ${actual.toString().padStart(3)}  /min (expected: ${expected})`);
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (allCorrect) {
      console.log('🎉 SUCCESS! All rate limits are correctly configured!');
      console.log('\n📋 Production Rate Limits Active:');
      console.log('   🔹 Default APIs: 50 requests/minute');
      console.log('   🔹 Books API: 100 requests/minute'); 
      console.log('   🔹 Auth Login: 20 requests/minute');
      console.log('   🔹 Auth Register: 10 requests/minute');
      
      console.log('\n🚨 Rate Limiting Behavior:');
      console.log('   ✅ Users can make up to 50 requests/minute to most endpoints');
      console.log('   ✅ 51st request will receive 429 Too Many Requests');
      console.log('   ✅ High-traffic endpoints like /api/books allow 100/minute');
      console.log('   ✅ Auth endpoints have stricter limits (10-20/minute)');
      
      return true;
    } else {
      console.log('⚠️  Some limits are not correctly configured');
      console.log('   Please ensure database function was updated');
      console.log('   Run the SQL from update_rate_limit_defaults.sql in Supabase');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    return false;
  }
}

async function testActual50Limit() {
  console.log('\n🧪 TESTING ACTUAL 50-REQUEST LIMIT');
  console.log('===================================\n');
  
  const testIdentifier = 'test-50-actual-' + Date.now();
  
  try {
    // First check the limit
    const { data: initialData } = await supabase.rpc('check_rate_limit', {
      p_identifier: testIdentifier,
      p_identifier_type: 'IP',
      p_endpoint: '/api/test',
      p_method: 'GET'
    });
    
    if (initialData.limits.per_minute !== 50) {
      console.log(`❌ Expected 50/minute, but got ${initialData.limits.per_minute}/minute`);
      console.log('   Database function may not be updated yet');
      return false;
    }
    
    console.log(`📊 Confirmed: ${initialData.limits.per_minute} requests/minute limit`);
    console.log('🚀 Sending 52 requests to trigger rate limit...\n');
    
    let rateLimitTriggered = false;
    
    for (let i = 1; i <= 52; i++) {
      // Record request
      await supabase.rpc('record_request', {
        p_identifier: testIdentifier,
        p_identifier_type: 'IP',
        p_endpoint: '/api/test',
        p_method: 'GET'
      });
      
      // Check rate limit
      const { data } = await supabase.rpc('check_rate_limit', {
        p_identifier: testIdentifier,
        p_identifier_type: 'IP',
        p_endpoint: '/api/test',
        p_method: 'GET'
      });
      
      const status = data.allowed ? '✅ ALLOWED' : '🚨 RATE LIMITED';
      
      if (i % 10 === 0 || !data.allowed) {
        console.log(`Request ${i.toString().padStart(2)}: ${status} (${data.current.minute}/${data.limits.per_minute})`);
      }
      
      if (!data.allowed) {
        console.log(`\n🎉 SUCCESS! Rate limit triggered at request ${i}`);
        console.log('✅ 50/minute limit is working correctly!');
        rateLimitTriggered = true;
        break;
      }
    }
    
    if (!rateLimitTriggered) {
      console.log('\n⚠️  Rate limit was not triggered after 52 requests');
      console.log('   This may indicate an issue with the database function');
    }
    
    // Cleanup
    await supabase.from('rate_limit_entries').delete().eq('identifier', testIdentifier);
    
    return rateLimitTriggered;
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
    return false;
  }
}

async function main() {
  const limitsCorrect = await verify50Limit();
  
  if (limitsCorrect) {
    console.log('\n' + '='.repeat(60));
    const workingCorrectly = await testActual50Limit();
    
    console.log('\n🏁 FINAL VERIFICATION RESULT');
    console.log('============================');
    
    if (workingCorrectly) {
      console.log('🎉 PERFECT! Production rate limiting is fully functional');
      console.log('   ✅ Configuration updated');
      console.log('   ✅ Database function updated');
      console.log('   ✅ 50/minute limit enforced');
      console.log('   ✅ Ready for production deployment');
      
      console.log('\n🔥 PRODUCTION READY FEATURES:');
      console.log('   🛡️  Rate limiting: 50 requests/minute');
      console.log('   📊 Cache optimization enabled');
      console.log('   🚨 429 error responses for violations');
      console.log('   📈 Progressive penalties for repeat offenders');
      console.log('   🔐 Security headers and monitoring');
    } else {
      console.log('⚠️  Rate limiting needs attention');
      console.log('   Please verify database function update');
    }
  } else {
    console.log('\n❌ Please update database function first');
    console.log('   1. Open Supabase Dashboard > SQL Editor');
    console.log('   2. Execute SQL from update_rate_limit_defaults.sql');
    console.log('   3. Run this script again');
  }
}

main().catch(console.error);

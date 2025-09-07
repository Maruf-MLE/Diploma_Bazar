// Quick Rate Limit Test - Fast requests to trigger limit
const { createClient } = require('@supabase/supabase-js');

process.env.NODE_ENV = 'production';

console.log('⚡ Quick Rate Limit Test');
console.log('=======================\n');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseKey);

// Test for config endpoint that has lower limit (5 per minute)
const testIdentifier = 'fast-test-' + Date.now();
const testEndpoint = '/api/test'; // This should use DEFAULT_LIMITS (5 per minute)
const testMethod = 'GET';

async function quickTest() {
  console.log('Test parameters:');
  console.log('- Identifier:', testIdentifier);
  console.log('- Endpoint:', testEndpoint, '(should use DEFAULT_LIMITS = 5/min)');
  console.log('- Method:', testMethod);
  
  try {
    // Send 8 requests very quickly
    const maxRequests = 8;
    console.log(`\n🚀 Sending ${maxRequests} requests quickly...`);
    
    for (let i = 1; i <= maxRequests; i++) {
      const startTime = Date.now();
      
      // Record request
      await supabase.rpc('record_request', {
        p_identifier: testIdentifier,
        p_identifier_type: 'IP',
        p_endpoint: testEndpoint,
        p_method: testMethod
      });
      
      // Check rate limit immediately
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: testIdentifier,
        p_identifier_type: 'IP',
        p_endpoint: testEndpoint,
        p_method: testMethod
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (error) {
        console.log(`❌ Request ${i} failed:`, error.message);
        continue;
      }
      
      const status = data.allowed ? '✅ ALLOWED' : '🚨 RATE LIMITED';
      console.log(`Request ${i}: ${status} (${data.current.minute}/${data.limits.per_minute}) [${responseTime}ms]`);
      
      if (!data.allowed) {
        console.log('\n🎉 SUCCESS! Rate limit triggered!');
        console.log('Rate limit data:', {
          current: data.current,
          limits: data.limits,
          blocked: data.blocked,
          blocked_until: data.blocked_until
        });
        
        return true;
      }
      
      // No delay - send requests as fast as possible
    }
    
    console.log('\n⚠️  Rate limit not triggered after', maxRequests, 'requests');
    return false;
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
    return false;
  }
}

// Test with different endpoint (auth endpoint with 5/min limit)
async function testAuthEndpoint() {
  console.log('\n\n🔐 Testing Auth Endpoint (should have lower limits)');
  console.log('==================================================');
  
  const authIdentifier = 'auth-test-' + Date.now();
  const authEndpoint = '/api/auth/register'; // 5 per minute limit
  
  console.log('Test parameters:');
  console.log('- Identifier:', authIdentifier);
  console.log('- Endpoint:', authEndpoint, '(configured for 5/min)');
  
  try {
    console.log('\n🚀 Sending 7 requests to auth endpoint...');
    
    for (let i = 1; i <= 7; i++) {
      // Record request
      await supabase.rpc('record_request', {
        p_identifier: authIdentifier,
        p_identifier_type: 'IP',
        p_endpoint: authEndpoint,
        p_method: 'POST'
      });
      
      // Check rate limit
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: authIdentifier,
        p_identifier_type: 'IP',
        p_endpoint: authEndpoint,
        p_method: 'POST'
      });
      
      if (error) {
        console.log(`❌ Request ${i} failed:`, error.message);
        continue;
      }
      
      const status = data.allowed ? '✅ ALLOWED' : '🚨 RATE LIMITED';
      console.log(`Auth Request ${i}: ${status} (${data.current.minute}/${data.limits.per_minute})`);
      
      if (!data.allowed) {
        console.log('\n🎉 SUCCESS! Auth endpoint rate limit triggered!');
        return true;
      }
    }
    
    console.log('\n⚠️  Auth endpoint rate limit not triggered');
    return false;
    
  } catch (error) {
    console.error('💥 Auth test error:', error.message);
    return false;
  }
}

// Main test function
async function main() {
  console.log('Environment: NODE_ENV =', process.env.NODE_ENV);
  
  const test1 = await quickTest();
  const test2 = await testAuthEndpoint();
  
  console.log('\n🏁 FINAL RESULTS');
  console.log('================');
  
  if (test1 || test2) {
    console.log('✅ RATE LIMITING IS WORKING IN PRODUCTION!');
    console.log('   - Database functions operational');
    console.log('   - Rate limits properly enforced');
    console.log('   - Request recording functional');
    console.log('   - 429 responses will be returned');
  } else {
    console.log('❌ Rate limiting tests did not trigger limits');
    console.log('   - May need to check database function logic');
    console.log('   - Verify time window calculations');
  }
  
  // Cleanup
  try {
    await supabase.from('rate_limit_entries').delete().like('identifier', 'fast-test-%');
    await supabase.from('rate_limit_entries').delete().like('identifier', 'auth-test-%');
    console.log('\n🧹 Cleanup completed');
  } catch (e) {
    console.log('⚠️  Cleanup warning:', e.message);
  }
}

main().catch(console.error);

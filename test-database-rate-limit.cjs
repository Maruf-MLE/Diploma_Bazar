// Test database rate limiting functions directly
const { createClient } = require('@supabase/supabase-js');

// Set production mode
process.env.NODE_ENV = 'production';

console.log('🔍 Testing Database Rate Limiting Functions');
console.log('===========================================\n');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔌 Supabase Connection:');
console.log('URL:', supabaseUrl);
console.log('Key type:', supabaseServiceKey ? 'SERVICE_KEY' : 'ANON_KEY');

// Test parameters
const testIdentifier = 'test-production-' + Date.now();
const testEndpoint = '/api/books';
const testMethod = 'GET';

async function testRateLimit() {
  console.log('\n🧪 Testing Rate Limit Functions');
  console.log('Test identifier:', testIdentifier);
  console.log('Test endpoint:', testEndpoint);
  console.log('Test method:', testMethod);
  
  try {
    // Test 1: Check initial rate limit
    console.log('\n📊 Test 1: Initial rate limit check');
    const { data: initialCheck, error: initialError } = await supabase.rpc('check_rate_limit', {
      p_identifier: testIdentifier,
      p_identifier_type: 'IP',
      p_endpoint: testEndpoint,
      p_method: testMethod
    });
    
    if (initialError) {
      console.log('❌ Initial check failed:', initialError.message);
      return false;
    }
    
    console.log('✅ Initial check result:', {
      allowed: initialCheck.allowed,
      limits: initialCheck.limits,
      current: initialCheck.current
    });
    
    // Test 2: Record multiple requests to trigger rate limit
    console.log('\n📝 Test 2: Recording multiple requests');
    const requestsToMake = initialCheck.limits.per_minute + 2; // Exceed limit
    
    console.log(`Making ${requestsToMake} requests (limit: ${initialCheck.limits.per_minute})`);
    
    for (let i = 1; i <= requestsToMake; i++) {
      console.log(`Request ${i}/${requestsToMake}...`);
      
      // Record request
      const { error: recordError } = await supabase.rpc('record_request', {
        p_identifier: testIdentifier,
        p_identifier_type: 'IP',
        p_endpoint: testEndpoint,
        p_method: testMethod
      });
      
      if (recordError) {
        console.log(`❌ Request ${i} recording failed:`, recordError.message);
        continue;
      }
      
      // Check rate limit after each request
      const { data: checkData, error: checkError } = await supabase.rpc('check_rate_limit', {
        p_identifier: testIdentifier,
        p_identifier_type: 'IP',
        p_endpoint: testEndpoint,
        p_method: testMethod
      });
      
      if (checkError) {
        console.log(`❌ Check ${i} failed:`, checkError.message);
        continue;
      }
      
      console.log(`   Status: ${checkData.allowed ? '✅ Allowed' : '🚨 RATE LIMITED'} (${checkData.current.minute}/${checkData.limits.per_minute})`);
      
      // If rate limited, stop
      if (!checkData.allowed) {
        console.log('🎉 RATE LIMIT TRIGGERED SUCCESSFULLY!');
        console.log('Details:', {
          current: checkData.current,
          limits: checkData.limits,
          blocked: checkData.blocked
        });
        
        return true;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('⚠️  Rate limit was not triggered after all requests');
    return false;
    
  } catch (error) {
    console.log('💥 Test failed with error:', error.message);
    console.log('Stack:', error.stack);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Clean up rate limit entries for our test identifier
    await supabase
      .from('rate_limit_entries')
      .delete()
      .eq('identifier', testIdentifier);
    
    await supabase
      .from('rate_limit_violations')
      .delete()
      .eq('identifier', testIdentifier);
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('⚠️  Cleanup error (non-critical):', error.message);
  }
}

// Main test
async function main() {
  console.log('Environment: NODE_ENV =', process.env.NODE_ENV);
  
  const success = await testRateLimit();
  
  console.log('\n🏁 TEST SUMMARY');
  console.log('===============');
  
  if (success) {
    console.log('✅ PRODUCTION RATE LIMITING IS WORKING!');
    console.log('   - Database functions are operational');
    console.log('   - Rate limits are properly enforced');
    console.log('   - Request recording works correctly');
  } else {
    console.log('❌ RATE LIMITING NEEDS ATTENTION');
    console.log('   - Check database functions');
    console.log('   - Verify configuration');
    console.log('   - Check Supabase permissions');
  }
  
  await cleanup();
}

// Run the test
main().catch(console.error);

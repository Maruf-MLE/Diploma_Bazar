// Verify Rate Limit Enforcement
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRateLimitEnforcement() {
  console.log('🔍 RATE LIMIT ENFORCEMENT VERIFICATION');
  console.log('======================================\n');
  
  const testId = 'enforcement-test-' + Date.now();
  const testEndpoint = '/api/auth/register'; // Low limit endpoint (10/min)
  
  try {
    console.log('📋 Testing with /api/auth/register (10 req/min limit)\n');
    
    // Test with smaller limit for faster verification
    let requestCount = 0;
    let blocked = false;
    
    for (let i = 1; i <= 15; i++) {
      // Record the request
      const { data: recordData, error: recordError } = await supabase.rpc('record_request', {
        p_identifier: testId,
        p_identifier_type: 'IP',
        p_endpoint: testEndpoint,
        p_method: 'POST'
      });
      
      if (recordError) {
        console.log(`❌ Error recording request ${i}:`, recordError.message);
        continue;
      }
      
      // Check if rate limited
      const { data: checkData, error: checkError } = await supabase.rpc('check_rate_limit', {
        p_identifier: testId,
        p_identifier_type: 'IP',
        p_endpoint: testEndpoint,
        p_method: 'POST'
      });
      
      if (checkError) {
        console.log(`❌ Error checking limit:`, checkError.message);
        continue;
      }
      
      requestCount = checkData.current.minute;
      const allowed = checkData.allowed;
      const limit = checkData.limits.per_minute;
      
      const status = allowed ? '✅' : '🚫';
      console.log(`Request ${i}: ${status} (${requestCount}/${limit}) - ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
      
      if (!allowed) {
        blocked = true;
        console.log(`\n🎉 Rate limit enforced at request ${i}!`);
        break;
      }
    }
    
    if (!blocked) {
      console.log('\n⚠️  Rate limit NOT enforced properly!');
      console.log('   Request counting is working but blocking is not.');
      console.log('\nPossible issues:');
      console.log('1. The check_rate_limit function logic issue');
      console.log('2. The "allowed" calculation might be incorrect');
    }
    
    // Cleanup
    await supabase.from('rate_limit_entries').delete().eq('identifier', testId);
    
    return blocked;
    
  } catch (error) {
    console.error('💥 Test error:', error);
    return false;
  }
}

async function testDirectEnforcement() {
  console.log('\n🧪 DIRECT ENFORCEMENT TEST');
  console.log('==========================\n');
  
  const testId = 'direct-test-' + Date.now();
  
  try {
    // Insert exactly 10 requests for auth/register endpoint
    console.log('Inserting 10 requests directly...');
    
    for (let i = 1; i <= 10; i++) {
      await supabase.from('rate_limit_entries').insert({
        identifier: testId,
        identifier_type: 'IP',
        endpoint: '/api/auth/register',
        method: 'POST',
        created_at: new Date().toISOString()
      });
    }
    
    // Now check if 11th request would be blocked
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: testId,
      p_identifier_type: 'IP',
      p_endpoint: '/api/auth/register',
      p_method: 'POST'
    });
    
    if (error) {
      console.error('❌ Error checking limit:', error);
    } else {
      console.log('Current state:');
      console.log(`  Requests: ${data.current.minute}/${data.limits.per_minute}`);
      console.log(`  Allowed: ${data.allowed}`);
      console.log(`  Should be blocked: ${data.current.minute >= data.limits.per_minute}`);
      
      if (data.current.minute >= data.limits.per_minute && data.allowed) {
        console.log('\n❌ ISSUE FOUND: Count exceeds limit but still allowed!');
        console.log('   The check_rate_limit function needs fixing.');
      } else if (!data.allowed) {
        console.log('\n✅ Rate limiting is working correctly!');
      }
    }
    
    // Cleanup
    await supabase.from('rate_limit_entries').delete().eq('identifier', testId);
    
  } catch (error) {
    console.error('💥 Direct test error:', error);
  }
}

async function main() {
  await verifyRateLimitEnforcement();
  await testDirectEnforcement();
  
  console.log('\n📊 DIAGNOSIS COMPLETE');
  console.log('=====================');
  console.log('If rate limiting is not blocking properly, you need to:');
  console.log('1. Check the check_rate_limit function logic in database');
  console.log('2. Ensure the "allowed" field calculation is correct');
  console.log('3. Verify the comparison operators (< vs <=)');
}

main().catch(console.error);

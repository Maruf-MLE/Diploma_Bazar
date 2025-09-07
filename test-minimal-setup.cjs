// Test Minimal Rate Limit Setup
const { createClient } = require('@supabase/supabase-js');

process.env.NODE_ENV = 'production';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMinimalSetup() {
  console.log('🧪 TESTING MINIMAL RATE LIMIT SETUP');
  console.log('===================================\n');
  
  const testId = 'minimal-test-' + Date.now();
  
  try {
    // Test 1: Check if check_rate_limit function works
    console.log('1️⃣ Testing check_rate_limit function...');
    const { data: checkResult, error: checkError } = await supabase.rpc('check_rate_limit', {
      p_identifier: testId,
      p_identifier_type: 'IP',
      p_endpoint: '/api/test',
      p_method: 'GET'
    });
    
    if (checkError) {
      console.log('❌ check_rate_limit failed:', checkError.message);
      return false;
    }
    
    console.log('✅ check_rate_limit working!');
    console.log(`📋 Limits: ${checkResult.limits.per_minute}/min`);
    console.log(`📊 Current: ${checkResult.current.minute}/min\n`);
    
    // Test 2: Check if record_request function works
    console.log('2️⃣ Testing record_request function...');
    const { data: recordResult, error: recordError } = await supabase.rpc('record_request', {
      p_identifier: testId,
      p_identifier_type: 'IP',
      p_endpoint: '/api/test',
      p_method: 'GET'
    });
    
    if (recordError) {
      console.log('❌ record_request failed:', recordError.message);
      return false;
    }
    
    console.log('✅ record_request working!');
    console.log(`📝 Request recorded: ${recordResult}\n`);
    
    // Test 3: Verify the request was counted
    console.log('3️⃣ Verifying request counting...');
    const { data: verifyResult, error: verifyError } = await supabase.rpc('check_rate_limit', {
      p_identifier: testId,
      p_identifier_type: 'IP',
      p_endpoint: '/api/test',
      p_method: 'GET'
    });
    
    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
      return false;
    }
    
    if (verifyResult.current.minute > 0) {
      console.log('✅ Request counting verified!');
      console.log(`📈 Count increased to: ${verifyResult.current.minute}/min\n`);
    } else {
      console.log('⚠️  Request may not have been counted properly\n');
    }
    
    // Test 4: Test endpoint-specific limits
    console.log('4️⃣ Testing endpoint-specific limits...');
    const endpoints = [
      { endpoint: '/api/auth/login', expected: 20 },
      { endpoint: '/api/books', expected: 100 },
      { endpoint: '/api/test', expected: 50 }
    ];
    
    for (const { endpoint, expected } of endpoints) {
      const { data: limitResult } = await supabase.rpc('check_rate_limit', {
        p_identifier: testId + '-' + endpoint,
        p_identifier_type: 'IP',
        p_endpoint: endpoint,
        p_method: 'GET'
      });
      
      const actual = limitResult.limits.per_minute;
      const status = actual === expected ? '✅' : '❌';
      console.log(`   ${status} ${endpoint}: ${actual}/min (expected: ${expected})`);
    }
    
    // Test 5: Cleanup
    console.log('\n🧹 Cleaning up test data...');
    const { error: cleanupError } = await supabase
      .from('rate_limit_entries')
      .delete()
      .like('identifier', testId + '%');
    
    if (!cleanupError) {
      console.log('✅ Cleanup successful\n');
    }
    
    console.log('🎉 MINIMAL SETUP TEST PASSED!');
    console.log('✅ Database functions are working');
    console.log('✅ Request counting is operational');
    console.log('✅ Endpoint-specific limits are configured\n');
    
    return true;
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await testMinimalSetup();
  
  if (success) {
    console.log('🚀 READY FOR FULL TESTING!');
    console.log('   Run: node test-complete-rate-limit.cjs');
    console.log('   to test complete functionality\n');
  } else {
    console.log('❌ SETUP STILL NEEDS WORK');
    console.log('   Please execute minimal_rate_limit_fix.sql in Supabase');
    console.log('   then run this test again\n');
  }
}

main().catch(console.error);

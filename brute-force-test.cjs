// Brute Force Rate Limit Test - 20 requests quickly
const { createClient } = require('@supabase/supabase-js');

process.env.NODE_ENV = 'production';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseKey);

async function bruteForceTest() {
  const testIdentifier = 'brute-' + Date.now();
  const testEndpoint = '/api/test';
  
  console.log('💥 BRUTE FORCE RATE LIMIT TEST');
  console.log('===============================');
  console.log('Identifier:', testIdentifier);
  console.log('Endpoint:', testEndpoint);
  console.log('Sending 20 requests as fast as possible...\n');
  
  for (let i = 1; i <= 20; i++) {
    try {
      // Record request
      await supabase.rpc('record_request', {
        p_identifier: testIdentifier,
        p_identifier_type: 'IP',
        p_endpoint: testEndpoint,
        p_method: 'GET'
      });
      
      // Check rate limit
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: testIdentifier,
        p_identifier_type: 'IP',
        p_endpoint: testEndpoint,
        p_method: 'GET'
      });
      
      if (error) {
        console.log(`Request ${i}: ❌ ERROR - ${error.message}`);
        continue;
      }
      
      const status = data.allowed ? '✅ ALLOWED' : '🚨 RATE LIMITED';
      console.log(`Request ${i}: ${status} (${data.current.minute}/${data.limits.per_minute})`);
      
      if (!data.allowed) {
        console.log('\n🎉 SUCCESS! RATE LIMIT TRIGGERED!');
        console.log('🔥 Production rate limiting is WORKING!');
        console.log('Details:');
        console.log('  - Requests sent:', i);
        console.log('  - Current count:', data.current.minute);
        console.log('  - Limit:', data.limits.per_minute);
        console.log('  - Blocked:', data.blocked);
        
        // Cleanup
        await supabase.from('rate_limit_entries').delete().eq('identifier', testIdentifier);
        
        return;
      }
      
    } catch (error) {
      console.log(`Request ${i}: ❌ EXCEPTION - ${error.message}`);
    }
  }
  
  console.log('\n⚠️  Rate limit not triggered after 20 requests');
  console.log('This may indicate:');
  console.log('- Database function logic needs review');
  console.log('- Time windows are resetting');
  console.log('- Limits are higher than expected');
  
  // Cleanup
  await supabase.from('rate_limit_entries').delete().eq('identifier', testIdentifier);
}

bruteForceTest().catch(console.error);

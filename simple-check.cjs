// Simple check to see current status
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseKey);

async function quickCheck() {
  console.log('🔍 Quick Function Check');
  console.log('=======================\n');
  
  try {
    const testId = 'quick-' + Date.now();
    
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: testId,
      p_identifier_type: 'IP',
      p_endpoint: '/api/test',
      p_method: 'GET'
    });
    
    if (error) {
      console.log('❌ Function Error:', error.message);
      console.log('\n📋 Next Steps:');
      console.log('1. Copy SQL from fix_rate_limit_function.sql');
      console.log('2. Execute in Supabase SQL Editor');
      console.log('3. Run this script again');
      return;
    }
    
    console.log('✅ Function is working!');
    console.log('📊 Current limits:');
    console.log('- Per minute:', data.limits.per_minute);
    console.log('- Per hour:', data.limits.per_hour);
    console.log('- Per day:', data.limits.per_day);
    
    if (data.limits.per_minute === 50) {
      console.log('\n🎉 SUCCESS! 50/minute limit is active!');
      console.log('✅ Database function updated correctly');
      console.log('✅ Ready for full verification test');
      
      console.log('\n🚀 Run full test: node verify-50-limit.cjs');
    } else {
      console.log(`\n⚠️  Expected 50/minute, got ${data.limits.per_minute}/minute`);
      console.log('   Function may need to be updated');
    }
    
  } catch (error) {
    console.log('💥 Error:', error.message);
  }
}

quickCheck();

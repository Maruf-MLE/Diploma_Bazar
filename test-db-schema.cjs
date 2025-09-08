// Test Database Schema and Setup
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Testing Database Schema...');
console.log('Supabase URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('Service Key:', supabaseServiceKey ? 'SET' : 'MISSING');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseSchema() {
  try {
    // Test 1: Check if tables exist
    console.log('\n📋 Testing tables...');
    
    const tables = [
      'rate_limit_config',
      'rate_limit_tracker', 
      'rate_limit_blocks',
      'rate_limit_violations'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: EXISTS`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    // Test 2: Check functions
    console.log('\n⚙️  Testing functions...');
    
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: '127.0.0.1',
        p_identifier_type: 'IP',
        p_endpoint: '/test',
        p_method: 'GET'
      });
      
      if (error) {
        console.log('❌ Function check_rate_limit:', error.message);
      } else {
        console.log('✅ Function check_rate_limit: WORKS');
        console.log('   Result:', JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.log('❌ Function check_rate_limit:', err.message);
    }
    
    try {
      const { data, error } = await supabase.rpc('record_request', {
        p_identifier: '127.0.0.1',
        p_identifier_type: 'IP', 
        p_endpoint: '/test',
        p_method: 'GET'
      });
      
      if (error) {
        console.log('❌ Function record_request:', error.message);
      } else {
        console.log('✅ Function record_request: WORKS');
      }
    } catch (err) {
      console.log('❌ Function record_request:', err.message);
    }
    
    // Test 3: Rate limiting flow
    console.log('\n🚀 Testing rate limiting flow...');
    
    for (let i = 1; i <= 5; i++) {
      const checkResult = await supabase.rpc('check_rate_limit', {
        p_identifier: 'test-ip',
        p_identifier_type: 'IP',
        p_endpoint: '/api/test',
        p_method: 'GET'
      });
      
      if (checkResult.data?.allowed) {
        console.log(`✅ Request ${i}: ALLOWED (${checkResult.data.current.minute}/50)`);
        
        await supabase.rpc('record_request', {
          p_identifier: 'test-ip',
          p_identifier_type: 'IP',
          p_endpoint: '/api/test', 
          p_method: 'GET'
        });
      } else {
        console.log(`🚫 Request ${i}: BLOCKED`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Database schema test completed!');
    
  } catch (error) {
    console.error('💥 Database test failed:', error);
  }
}

testDatabaseSchema();

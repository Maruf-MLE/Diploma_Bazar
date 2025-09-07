// Test Database Rate Limiting Directly
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const testDatabaseRateLimit = async () => {
  console.log('🔬 DIRECT DATABASE RATE LIMIT TEST');
  console.log('====================================\n');
  
  const identifier = '::1';
  const identifierType = 'IP';
  const endpoint = '/api/test';
  const method = 'GET';
  
  console.log(`Testing: ${identifierType}:${identifier} -> ${method} ${endpoint}\n`);
  
  // Clear any existing data first
  await supabase.from('rate_limit_tracker').delete().eq('identifier', identifier);
  
  for (let i = 1; i <= 5; i++) {
    console.log(`--- REQUEST ${i} ---`);
    
    // Check rate limit
    const { data: checkData, error: checkError } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_endpoint: endpoint,
      p_method: method
    });
    
    if (checkError) {
      console.log(`❌ Check error:`, checkError);
      continue;
    }
    
    console.log(`📊 Check result: allowed=${checkData.allowed}, current=${JSON.stringify(checkData.current)}, limits=${JSON.stringify(checkData.limits)}`);
    
    if (!checkData.allowed) {
      console.log(`🚨 RATE LIMITED on request ${i}!`);
      break;
    }
    
    // Record the request  
    const { error: recordError } = await supabase.rpc('record_request', {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_endpoint: endpoint,
      p_method: method
    });
    
    if (recordError) {
      console.log(`❌ Record error:`, recordError);
    } else {
      console.log(`✅ Request recorded`);
    }
    
    // Check tracker table
    const { data: trackerData } = await supabase
      .from('rate_limit_tracker')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (trackerData && trackerData.length > 0) {
      console.log(`📈 Tracker: ${trackerData[0].request_count} requests, window: ${trackerData[0].window_start} to ${trackerData[0].window_end}`);
    }
    
    console.log('');
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('🏁 Test completed!');
};

testDatabaseRateLimit().catch(console.error);

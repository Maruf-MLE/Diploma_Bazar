// Debug Rate Limiting Script
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const http = require('http');

// Initialize Supabase client same as middleware
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Debug Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('BYPASS_RATE_LIMITS:', process.env.BYPASS_RATE_LIMITS);
console.log('Using Service Key:', !!process.env.SUPABASE_SERVICE_KEY);
console.log('Supabase URL:', supabaseUrl);

async function testDatabaseDirectly() {
  console.log('\n🔍 Testing database functions directly...');
  
  try {
    // Test check_rate_limit function
    console.log('Testing check_rate_limit...');
    const { data: checkResult, error: checkError } = await supabase.rpc('check_rate_limit', {
      p_identifier: '127.0.0.1',
      p_identifier_type: 'IP', 
      p_endpoint: '/api/test',
      p_method: 'GET'
    });
    
    if (checkError) {
      console.log('❌ check_rate_limit failed:', checkError);
      return false;
    }
    
    console.log('✅ check_rate_limit result:', checkResult);
    
    // Test record_request function
    console.log('\nTesting record_request...');
    const { data: recordResult, error: recordError } = await supabase.rpc('record_request', {
      p_identifier: '127.0.0.1',
      p_identifier_type: 'IP',
      p_endpoint: '/api/test', 
      p_method: 'GET'
    });
    
    if (recordError) {
      console.log('❌ record_request failed:', recordError);
      return false;
    }
    
    console.log('✅ record_request successful');
    
    // Check current count after recording
    console.log('\nChecking count after recording...');
    const { data: afterRecord, error: afterError } = await supabase.rpc('check_rate_limit', {
      p_identifier: '127.0.0.1',
      p_identifier_type: 'IP',
      p_endpoint: '/api/test',
      p_method: 'GET'
    });
    
    if (!afterError) {
      console.log('✅ After recording:', afterRecord);
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Database test failed:', error);
    return false;
  }
}

async function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testServerRequests() {
  console.log('\n🌐 Testing server requests...');
  
  // Test if server is running
  try {
    const healthResponse = await makeHttpRequest('http://localhost:3001/health');
    console.log('✅ Server is running, health check:', healthResponse.statusCode);
  } catch (error) {
    console.log('❌ Server not running:', error.message);
    return false;
  }
  
  // Make rapid requests to trigger rate limiting
  console.log('\n🔥 Making rapid requests to trigger rate limiting...');
  
  for (let i = 1; i <= 55; i++) {  // 55 requests to approach the 50/min limit
    try {
      const response = await makeHttpRequest('http://localhost:3001/api/test');
      const hasRateHeaders = Object.keys(response.headers).some(h => h.toLowerCase().includes('ratelimit'));
      
      console.log(`Request ${i}: Status ${response.statusCode}, Rate Headers: ${hasRateHeaders}`);
      
      if (response.statusCode === 429) {
        console.log('🚫 Rate limited at request', i);
        console.log('Headers:', response.headers);
        break;
      }
      
      if (hasRateHeaders) {
        const remaining = response.headers['x-ratelimit-remaining'];
        if (remaining !== undefined) {
          console.log(`   Remaining: ${remaining}`);
        }
      }
      
      // Small delay to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.log(`Request ${i} failed:`, error.message);
    }
  }
  
  return true;
}

async function main() {
  console.log('🚀 Starting Rate Limiting Debug...');
  
  // First test database directly
  const dbWorking = await testDatabaseDirectly();
  
  if (!dbWorking) {
    console.log('❌ Database functions not working properly');
    return;
  }
  
  console.log('✅ Database functions working');
  
  // Now test server
  await testServerRequests();
  
  console.log('\n🏁 Debug complete');
}

main().catch(console.error);

// Advanced Production Debugging Script
// আপনার production server এর rate limiting issue debug করব

const https = require('https');

console.log('🔍 PRODUCTION RATE LIMITING DEBUG');
console.log('='.repeat(60));

// Function to get detailed headers
function getDetailedResponse(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'ProductionDebugger/1.0',
        'Accept': 'application/json',
        'X-Debug': 'rate-limiting'
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          success: true
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        error: error.message,
        success: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        error: 'Request timeout',
        success: false
      });
    });
    
    req.end();
  });
}

// Test different endpoints with header analysis
async function debugEndpoint(url, endpointName) {
  console.log(`\n🔍 Testing ${endpointName}: ${url}`);
  console.log('-'.repeat(40));
  
  const response = await getDetailedResponse(url);
  
  if (!response.success) {
    console.log(`❌ Error: ${response.error}`);
    return null;
  }
  
  console.log(`📊 Status Code: ${response.statusCode}`);
  
  // Check for rate limiting headers
  const rateLimitHeaders = {};
  const middlewareHeaders = {};
  const debugHeaders = {};
  
  Object.keys(response.headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('ratelimit') || lowerKey.includes('rate-limit')) {
      rateLimitHeaders[key] = response.headers[key];
    }
    if (lowerKey.includes('x-') || lowerKey.includes('middleware') || lowerKey.includes('auth')) {
      middlewareHeaders[key] = response.headers[key];
    }
    if (lowerKey.includes('debug') || lowerKey.includes('error') || lowerKey.includes('bypass')) {
      debugHeaders[key] = response.headers[key];
    }
  });
  
  // Rate limiting headers analysis
  if (Object.keys(rateLimitHeaders).length > 0) {
    console.log('✅ Rate Limiting Headers Found:');
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
  } else {
    console.log('❌ No Rate Limiting Headers Found');
  }
  
  // Middleware headers analysis
  if (Object.keys(middlewareHeaders).length > 0) {
    console.log('🔧 Middleware Headers:');
    Object.entries(middlewareHeaders).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
  }
  
  // Debug headers
  if (Object.keys(debugHeaders).length > 0) {
    console.log('🐛 Debug Headers:');
    Object.entries(debugHeaders).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
  }
  
  // Response body analysis for errors
  if (response.data) {
    try {
      const jsonData = JSON.parse(response.data);
      if (jsonData.error || jsonData.message) {
        console.log('📝 Response Data:');
        if (jsonData.error) console.log(`   Error: ${jsonData.error}`);
        if (jsonData.message) console.log(`   Message: ${jsonData.message}`);
        if (jsonData.rateLimiting !== undefined) console.log(`   Rate Limiting: ${jsonData.rateLimiting}`);
        if (jsonData.identifier) console.log(`   Identifier: ${jsonData.identifier}`);
        if (jsonData.ip) console.log(`   IP: ${jsonData.ip}`);
      }
    } catch (e) {
      console.log('📝 Raw Response (first 200 chars):');
      console.log(`   ${response.data.substring(0, 200)}`);
    }
  }
  
  return response;
}

// Test rapid requests with detailed logging
async function testRapidRequests(url, count = 10) {
  console.log(`\n🚀 RAPID REQUEST TEST (${count} requests)`);
  console.log('='.repeat(50));
  
  const results = [];
  let rateLimitTriggered = false;
  
  for (let i = 1; i <= count; i++) {
    const startTime = Date.now();
    const response = await getDetailedResponse(url);
    const responseTime = Date.now() - startTime;
    
    if (!response.success) {
      console.log(`❌ Request ${i}: Error - ${response.error}`);
      continue;
    }
    
    const hasRateLimitHeaders = Object.keys(response.headers).some(key => 
      key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('rate-limit')
    );
    
    console.log(`Request ${i}: Status=${response.statusCode}, Time=${responseTime}ms, RateHeaders=${hasRateLimitHeaders ? '✅' : '❌'}`);
    
    // Check for specific rate limit info
    if (response.headers['x-ratelimit-remaining']) {
      const remaining = parseInt(response.headers['x-ratelimit-remaining']);
      console.log(`   ⚠️  Remaining: ${remaining}`);
      if (remaining === 0) {
        console.log(`   🚫 Next request should be rate limited!`);
      }
    }
    
    if (response.statusCode === 429) {
      rateLimitTriggered = true;
      console.log(`   🎯 RATE LIMIT TRIGGERED!`);
      break;
    }
    
    results.push({
      requestNum: i,
      statusCode: response.statusCode,
      hasRateLimitHeaders,
      responseTime
    });
    
    // Small delay to prevent too fast requests
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n📊 Rapid Test Summary:');
  console.log(`   Total Requests: ${results.length}`);
  console.log(`   Rate Limit Triggered: ${rateLimitTriggered ? 'YES ✅' : 'NO ❌'}`);
  console.log(`   Headers Present: ${results.filter(r => r.hasRateLimitHeaders).length}/${results.length}`);
  
  return { results, rateLimitTriggered };
}

// Main debugging function
async function runAdvancedDebug() {
  const baseUrl = 'https://diplomabazar.vercel.app';
  
  // Test different endpoints
  await debugEndpoint(`${baseUrl}/health`, 'Health Check');
  await debugEndpoint(`${baseUrl}/api/test`, 'Test API');
  await debugEndpoint(`${baseUrl}/api/rate-limit/status`, 'Rate Limit Status');
  
  // Test rapid requests on test endpoint
  await testRapidRequests(`${baseUrl}/api/test`, 15);
  
  // Test with different user agents
  console.log('\n🤖 Testing Different User Agents:');
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'PostmanRuntime/7.28.4',
    'curl/7.68.0',
    'RateLimitTester/1.0'
  ];
  
  for (let i = 0; i < userAgents.length; i++) {
    const ua = userAgents[i];
    console.log(`\n🔍 User-Agent: ${ua.substring(0, 40)}...`);
    
    const response = await new Promise((resolve) => {
      const options = {
        hostname: 'diplomabazar.vercel.app',
        path: '/api/test',
        method: 'GET',
        headers: {
          'User-Agent': ua,
          'Accept': 'application/json'
        },
        timeout: 5000
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          hasRateHeaders: Object.keys(res.headers).some(key => 
            key.toLowerCase().includes('ratelimit')
          )
        }));
      });
      
      req.on('error', () => resolve({ error: true }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ timeout: true });
      });
      
      req.end();
    });
    
    if (response.error || response.timeout) {
      console.log(`   ❌ Failed`);
    } else {
      console.log(`   Status: ${response.statusCode}, Rate Headers: ${response.hasRateHeaders ? '✅' : '❌'}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 ADVANCED DEBUG COMPLETED');
  console.log('='.repeat(60));
  
  console.log('\n💡 Summary of Findings:');
  console.log('   • Check the output above for missing rate limit headers');
  console.log('   • Look for middleware execution indicators');
  console.log('   • Note any error messages in responses');
  console.log('   • Compare with your local working version');
}

// Run the debug
runAdvancedDebug().catch(console.error);

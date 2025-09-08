// Live Production Rate Limiting Test
// আপনার deployed site এর rate limiting check করব

const https = require('https');
const http = require('http');

// Possible deployed URLs (আপনার site এর URL এখানে add করুন)
const POSSIBLE_URLS = [
  'https://diplomabazar.vercel.app/',
   
  'https://your-custom-domain.com', // আপনার domain হলে
  // আরো URLs add করতে পারেন
];

console.log('🌐 LIVE PRODUCTION RATE LIMIT TEST');
console.log('='.repeat(60));

// HTTP request function
function makeRequest(url, requestNum, apiKey = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const headers = {
      'User-Agent': 'LiveRateLimitTester/1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: headers,
      timeout: 10000
    };

    const startTime = Date.now();
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          requestNum,
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime: responseTime,
          success: true
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        requestNum,
        error: error.message,
        success: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        requestNum,
        error: 'Request timeout',
        success: false
      });
    });
    
    req.end();
  });
}

// Check if URL is accessible
async function checkSiteAvailability(url) {
  console.log(`🔍 Checking: ${url}`);
  
  const result = await makeRequest(url, 0);
  
  if (!result.success) {
    console.log(`❌ Site not accessible: ${result.error}`);
    return false;
  }
  
  console.log(`✅ Site accessible - Status: ${result.statusCode}`);
  console.log(`   Response time: ${result.responseTime}ms`);
  
  return true;
}

// Test rate limiting on specific endpoint
async function testRateLimiting(baseUrl, endpoint = '/api/test') {
  // Fix URL concatenation to avoid double slashes
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const testUrl = cleanBaseUrl + endpoint;
  console.log(`\n🔥 Testing rate limiting on: ${testUrl}`);
  console.log('-'.repeat(50));
  
  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;
  let rateLimitHeaders = null;
  let rateLimitTriggered = false;
  
  // Send 55 requests rapidly
  for (let i = 1; i <= 55; i++) {
    const result = await makeRequest(testUrl, i);
    
    if (!result.success) {
      errorCount++;
      console.log(`❌ Request ${i}: ERROR - ${result.error}`);
      continue;
    }
    
    // Check for rate limit headers in first successful response
    if (!rateLimitHeaders && result.headers) {
      const headers = {};
      Object.keys(result.headers).forEach(key => {
        if (key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('rate-limit')) {
          headers[key] = result.headers[key];
        }
      });
      if (Object.keys(headers).length > 0) {
        rateLimitHeaders = headers;
      }
    }
    
    if (result.statusCode === 200) {
      successCount++;
      process.stdout.write('✅');
      
      // Show remaining requests if available
      if (result.headers['x-ratelimit-remaining']) {
        const remaining = parseInt(result.headers['x-ratelimit-remaining']);
        if (remaining <= 5 && remaining >= 0) {
          console.log(`\\n⚠️  Only ${remaining} requests remaining!`);
        }
      }
      
    } else if (result.statusCode === 429) {
      rateLimitedCount++;
      rateLimitTriggered = true;
      console.log(`\\n🚫 Request ${i}: RATE LIMITED! (429)`);
      console.log(`   Response: ${result.data.substring(0, 150)}...`);
      
      // Show rate limit headers from 429 response
      if (result.headers) {
        console.log(`   Headers:`);
        Object.keys(result.headers).forEach(key => {
          if (key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('rate-limit')) {
            console.log(`     ${key}: ${result.headers[key]}`);
          }
        });
      }
      
      break; // Stop after first rate limit
      
    } else {
      errorCount++;
      console.log(`\\n❌ Request ${i}: HTTP ${result.statusCode}`);
    }
    
    // Progress indicator
    if (i % 10 === 0) console.log(` [${i}]`);
    
    // Small delay between requests (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Test Results
  console.log('\\n\\n' + '='.repeat(50));
  console.log('📊 LIVE TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Successful Requests: ${successCount}`);
  console.log(`🚫 Rate Limited Requests: ${rateLimitedCount}`);
  console.log(`❌ Error Requests: ${errorCount}`);
  
  // Rate limit analysis
  if (rateLimitTriggered) {
    console.log('\\n✅✅✅ RATE LIMITING IS WORKING ON PRODUCTION! ✅✅✅');
    console.log(`🛡️  Rate limit triggered after ${successCount} successful requests`);
    console.log('📈 Your live API is protected against abuse!');
  } else {
    console.log('\\n⚠️  Rate limiting not triggered in this test');
    console.log('🤔 This could mean:');
    console.log('   • Rate limits are higher than test volume');
    console.log('   • Rate limiting not deployed yet'); 
    console.log('   • Requests spread across multiple minutes');
    console.log('   • Different endpoint rate limits');
  }
  
  // Headers analysis
  if (rateLimitHeaders) {
    console.log('\\n📋 Rate Limit Headers Found:');
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('✅ Rate limiting middleware is active');
  } else {
    console.log('\\n❌ No rate limit headers detected');
    console.log('⚠️  Rate limiting middleware may not be active');
  }
  
  return {
    rateLimitTriggered,
    successCount,
    rateLimitedCount,
    hasHeaders: !!rateLimitHeaders
  };
}

// Test different endpoints
async function testMultipleEndpoints(baseUrl) {
  const endpoints = [
    '/api/test',
    '/api/books', 
    '/api/messages',
    '/health'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    console.log(`\\n🔍 Testing endpoint: ${endpoint}`);
    
    try {
      // Fix URL concatenation
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const testResult = await makeRequest(cleanBaseUrl + endpoint, 1);
      
      if (testResult.success) {
        results[endpoint] = {
          accessible: true,
          statusCode: testResult.statusCode
        };
        console.log(`✅ ${endpoint}: ${testResult.statusCode}`);
      } else {
        results[endpoint] = {
          accessible: false,
          error: testResult.error
        };
        console.log(`❌ ${endpoint}: ${testResult.error}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
    
    // Small delay between endpoint tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Main test function
async function runLiveTest() {
  console.log('🎯 Finding your deployed site...');
  
  let workingUrl = null;
  
  // Check each possible URL
  for (const url of POSSIBLE_URLS) {
    const isAccessible = await checkSiteAvailability(url);
    if (isAccessible) {
      workingUrl = url;
      break;
    }
  }
  
  if (!workingUrl) {
    console.log('\\n❌ No accessible site found!');
    console.log('\\n💡 Please provide your deployed site URL:');
    console.log('   Example: https://your-app.vercel.app');
    console.log('\\n   Or update POSSIBLE_URLS in this script');
    return;
  }
  
  console.log(`\\n🎉 Found working site: ${workingUrl}`);
  
  // Test available endpoints first
  console.log('\\n📍 Checking available endpoints...');
  const endpointResults = await testMultipleEndpoints(workingUrl);
  
  // Find best endpoint to test rate limiting
  let testEndpoint = '/api/test';
  if (!endpointResults['/api/test']?.accessible) {
    if (endpointResults['/api/books']?.accessible) {
      testEndpoint = '/api/books';
    } else if (endpointResults['/api/messages']?.accessible) {
      testEndpoint = '/api/messages';
    } else {
      console.log('\\n⚠️  No API endpoints accessible for rate limit testing');
      console.log('Available endpoints:', Object.keys(endpointResults).filter(e => endpointResults[e].accessible));
      return;
    }
  }
  
  // Run rate limiting test
  await testRateLimiting(workingUrl, testEndpoint);
  
  console.log('\\n' + '='.repeat(60));
  console.log('🏁 Live production test completed!');
  console.log('🌐 Tested URL:', workingUrl);
  console.log('📝 Check the results above to see if rate limiting is active');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('\\n💥 Unexpected error:', error.message);
});

// Manual URL input option
if (process.argv.length > 2) {
  const customUrl = process.argv[2];
  console.log(`🔗 Testing custom URL: ${customUrl}`);
  POSSIBLE_URLS.unshift(customUrl);
}

console.log('💡 Usage: node live-rate-test.cjs [your-site-url]');
console.log('📝 Example: node live-rate-test.cjs https://your-app.vercel.app');
console.log('\\nStarting live test...\\n');

runLiveTest().catch(console.error);

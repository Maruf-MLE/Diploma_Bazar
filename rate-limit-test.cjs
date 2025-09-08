// Rate Limiting Test Script
// Test করবে যে production level এ rate limiting properly কাজ করছে কিনা

const https = require('https');
const http = require('http');

// Configuration
const config = {
  // আপনার production site URL এখানে দিন
  baseUrl: 'http://localhost:3001', // Local server for testing
  
  // Test endpoints
  endpoints: {
    test: '/api/test',           // Default limit: 50/min
    books: '/api/books',         // Limit: 100/min  
    messages: '/api/messages',   // Limit: 80/min
    health: '/health'            // No rate limit (skipped)
  },
  
  // Test parameters
  totalRequests: 60,
  requestInterval: 100,  // 100ms between requests (600 requests/minute theoretical)
  
  // API Key from your .env
  apiKey: 'prod-DiplomaBazar-11fdfe4fa5bfe8e6ae569a79cef1cbfd9ba54430'
};

// Results tracking
const results = {
  successful: 0,
  rateLimited: 0,
  errors: 0,
  responses: [],
  timing: {
    start: null,
    end: null
  }
};

// Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'RateLimitTester/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test single endpoint
async function testEndpoint(endpoint, requestNumber) {
  const url = `${config.baseUrl}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(url);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const result = {
      requestNumber,
      endpoint,
      statusCode: response.statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
      rateLimitHeaders: {
        remaining: response.headers['x-ratelimit-remaining'],
        limit: response.headers['x-ratelimit-limit'],
        reset: response.headers['x-ratelimit-reset']
      }
    };
    
    // Parse response data
    try {
      result.data = JSON.parse(response.data);
    } catch (e) {
      result.data = response.data;
    }
    
    if (response.statusCode === 200) {
      results.successful++;
      console.log(`✅ Request ${requestNumber}: SUCCESS (${responseTime}ms) - ${endpoint}`);
    } else if (response.statusCode === 429) {
      results.rateLimited++;
      console.log(`🚫 Request ${requestNumber}: RATE LIMITED - ${endpoint}`);
    } else {
      results.errors++;
      console.log(`❌ Request ${requestNumber}: ERROR ${response.statusCode} - ${endpoint}`);
    }
    
    results.responses.push(result);
    return result;
    
  } catch (error) {
    const result = {
      requestNumber,
      endpoint,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    results.errors++;
    results.responses.push(result);
    console.log(`❌ Request ${requestNumber}: ERROR - ${error.message} - ${endpoint}`);
    return result;
  }
}

// Main test function
async function runRateLimitTest() {
  console.log('🚀 Starting Rate Limit Test for Diploma Bazar');
  console.log('='.repeat(60));
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Total Requests: ${config.totalRequests}`);
  console.log(`Request Interval: ${config.requestInterval}ms`);
  console.log(`Expected Rate Limits:`);
  console.log(`  - /api/test: 50 req/min`);
  console.log(`  - /api/books: 100 req/min`);
  console.log(`  - /api/messages: 80 req/min`);
  console.log('='.repeat(60));
  
  results.timing.start = Date.now();
  
  // Test different endpoints
  const testEndpoints = [
    config.endpoints.test,
    config.endpoints.books,
    config.endpoints.messages
  ];
  
  for (let i = 1; i <= config.totalRequests; i++) {
    // Rotate through endpoints
    const endpoint = testEndpoints[(i - 1) % testEndpoints.length];
    
    await testEndpoint(endpoint, i);
    
    // Wait before next request (except for last request)
    if (i < config.totalRequests) {
      await new Promise(resolve => setTimeout(resolve, config.requestInterval));
    }
    
    // Show progress every 10 requests
    if (i % 10 === 0) {
      console.log(`\n📊 Progress: ${i}/${config.totalRequests} requests completed`);
      console.log(`   Success: ${results.successful}, Rate Limited: ${results.rateLimited}, Errors: ${results.errors}`);
    }
  }
  
  results.timing.end = Date.now();
  
  // Generate final report
  generateReport();
}

// Generate test report
function generateReport() {
  const duration = (results.timing.end - results.timing.start) / 1000;
  const requestsPerSecond = config.totalRequests / duration;
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 RATE LIMITING TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n🕒 Test Duration: ${duration.toFixed(2)} seconds`);
  console.log(`📈 Average Rate: ${requestsPerSecond.toFixed(2)} requests/second`);
  console.log(`📊 Total Requests: ${config.totalRequests}`);
  
  console.log(`\n✅ Successful Requests: ${results.successful}`);
  console.log(`🚫 Rate Limited Requests: ${results.rateLimited}`);
  console.log(`❌ Error Requests: ${results.errors}`);
  
  // Analyze by endpoint
  console.log(`\n📍 Results by Endpoint:`);
  const endpointStats = {};
  
  results.responses.forEach(response => {
    if (!endpointStats[response.endpoint]) {
      endpointStats[response.endpoint] = {
        total: 0,
        success: 0,
        rateLimited: 0,
        errors: 0
      };
    }
    
    endpointStats[response.endpoint].total++;
    
    if (response.statusCode === 200) {
      endpointStats[response.endpoint].success++;
    } else if (response.statusCode === 429) {
      endpointStats[response.endpoint].rateLimited++;
    } else {
      endpointStats[response.endpoint].errors++;
    }
  });
  
  Object.entries(endpointStats).forEach(([endpoint, stats]) => {
    console.log(`   ${endpoint}:`);
    console.log(`     Total: ${stats.total}, Success: ${stats.success}, Rate Limited: ${stats.rateLimited}, Errors: ${stats.errors}`);
  });
  
  // Rate limiting effectiveness analysis
  console.log(`\n🔒 Rate Limiting Analysis:`);
  
  if (results.rateLimited > 0) {
    console.log(`   ✅ Rate limiting is WORKING correctly!`);
    console.log(`   🛡️ ${results.rateLimited} requests were properly blocked`);
    const effectivenessPercent = ((results.rateLimited / config.totalRequests) * 100).toFixed(1);
    console.log(`   📊 Rate limit effectiveness: ${effectivenessPercent}%`);
  } else {
    console.log(`   ⚠️  No rate limiting detected - this might indicate:`);
    console.log(`      • Rate limits are too high for this test`);
    console.log(`      • Rate limiting is disabled`);
    console.log(`      • Request interval is too slow`);
  }
  
  // Recommendations
  console.log(`\n💡 Recommendations:`);
  
  if (results.rateLimited === 0) {
    console.log(`   • Increase test request rate or volume`);
    console.log(`   • Check if rate limiting is enabled in production`);
    console.log(`   • Verify rate limit configuration`);
  } else {
    console.log(`   • Rate limiting is working as expected`);
    console.log(`   • Monitor production logs for rate limit violations`);
    console.log(`   • Consider adjusting limits based on actual usage`);
  }
  
  // Performance insights
  const avgResponseTime = results.responses
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.responses.filter(r => r.responseTime).length;
  
  console.log(`\n⚡ Performance Insights:`);
  console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  if (avgResponseTime > 1000) {
    console.log(`   ⚠️  High response times detected - consider optimizing`);
  } else if (avgResponseTime < 200) {
    console.log(`   ✅ Excellent response times!`);
  } else {
    console.log(`   ✅ Good response times`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Test completed successfully!');
  
  // Save results to file
  const reportData = {
    config,
    results,
    endpointStats,
    summary: {
      duration,
      requestsPerSecond,
      avgResponseTime: Math.round(avgResponseTime),
      rateLimitingEffective: results.rateLimited > 0
    }
  };
  
  require('fs').writeFileSync(
    'rate-limit-test-results.json',
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('💾 Detailed results saved to: rate-limit-test-results.json');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Start the test
if (require.main === module) {
  runRateLimitTest().catch(console.error);
}

module.exports = { runRateLimitTest, config };

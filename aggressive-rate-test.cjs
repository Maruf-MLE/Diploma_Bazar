// Aggressive Rate Limiting Test Script
// This will send 60 requests very quickly to trigger rate limiting

const https = require('https');
const http = require('http');

// Configuration
const config = {
  baseUrl: 'http://localhost:3001',
  endpoint: '/api/test', // Focus only on this working endpoint
  totalRequests: 60,
  requestInterval: 50, // Faster: 50ms between requests (1200 requests/minute theoretical)
  concurrentBatch: 10, // Send 10 requests at once
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
        'User-Agent': 'AggressiveRateLimitTester/1.0',
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

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test single request
async function testRequest(requestNumber) {
  const url = `${config.baseUrl}${config.endpoint}`;
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(url);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const result = {
      requestNumber,
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
      console.log(`✅ Request ${requestNumber}: SUCCESS (${responseTime}ms)`);
    } else if (response.statusCode === 429) {
      results.rateLimited++;
      console.log(`🚫 Request ${requestNumber}: RATE LIMITED (${responseTime}ms)`);
    } else {
      results.errors++;
      console.log(`❌ Request ${requestNumber}: ERROR ${response.statusCode} (${responseTime}ms)`);
    }
    
    results.responses.push(result);
    return result;
    
  } catch (error) {
    const result = {
      requestNumber,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    results.errors++;
    results.responses.push(result);
    console.log(`❌ Request ${requestNumber}: ERROR - ${error.message}`);
    return result;
  }
}

// Test batch of concurrent requests
async function testBatch(startNumber, batchSize) {
  const promises = [];
  
  for (let i = 0; i < batchSize; i++) {
    promises.push(testRequest(startNumber + i));
  }
  
  return Promise.all(promises);
}

// Main test function
async function runAggressiveRateLimitTest() {
  console.log('🚀 Starting AGGRESSIVE Rate Limit Test for Diploma Bazar');
  console.log('='.repeat(70));
  console.log(`Target URL: ${config.baseUrl}${config.endpoint}`);
  console.log(`Total Requests: ${config.totalRequests}`);
  console.log(`Request Interval: ${config.requestInterval}ms`);
  console.log(`Concurrent Batch Size: ${config.concurrentBatch}`);
  console.log(`Expected Rate Limit: 50 requests/minute`);
  console.log(`Theoretical Rate: ${Math.round(60000 / config.requestInterval)} requests/minute`);
  console.log('='.repeat(70));
  
  results.timing.start = Date.now();
  
  // First, send batches of concurrent requests to overwhelm rate limiting
  const numBatches = Math.ceil(config.totalRequests / config.concurrentBatch);
  
  for (let batch = 0; batch < numBatches; batch++) {
    const startNumber = batch * config.concurrentBatch + 1;
    const batchSize = Math.min(config.concurrentBatch, config.totalRequests - batch * config.concurrentBatch);
    
    console.log(`\\n🔥 Sending batch ${batch + 1}/${numBatches} (${batchSize} concurrent requests)...`);
    
    await testBatch(startNumber, batchSize);
    
    // Show progress
    console.log(`📊 Progress: ${startNumber + batchSize - 1}/${config.totalRequests} requests completed`);
    console.log(`   Success: ${results.successful}, Rate Limited: ${results.rateLimited}, Errors: ${results.errors}`);
    
    // Small delay between batches (except for last batch)
    if (batch < numBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, config.requestInterval));
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
  const requestsPerMinute = requestsPerSecond * 60;
  
  console.log('\\n' + '='.repeat(70));
  console.log('📋 AGGRESSIVE RATE LIMITING TEST RESULTS');
  console.log('='.repeat(70));
  
  console.log(`\\n🕒 Test Duration: ${duration.toFixed(2)} seconds`);
  console.log(`📈 Actual Rate: ${requestsPerSecond.toFixed(2)} requests/second`);
  console.log(`📈 Actual Rate: ${requestsPerMinute.toFixed(0)} requests/minute`);
  console.log(`📊 Total Requests: ${config.totalRequests}`);
  
  console.log(`\\n✅ Successful Requests: ${results.successful}`);
  console.log(`🚫 Rate Limited Requests: ${results.rateLimited}`);
  console.log(`❌ Error Requests: ${results.errors}`);
  
  // Rate limiting effectiveness analysis
  console.log(`\\n🔒 Rate Limiting Analysis:`);
  
  if (results.rateLimited > 0) {
    console.log(`   ✅ Rate limiting is WORKING correctly!`);
    console.log(`   🛡️ ${results.rateLimited} requests were properly blocked`);
    const effectivenessPercent = ((results.rateLimited / config.totalRequests) * 100).toFixed(1);
    console.log(`   📊 Rate limit effectiveness: ${effectivenessPercent}%`);
    
    // Find when rate limiting started
    const firstRateLimited = results.responses.find(r => r.statusCode === 429);
    if (firstRateLimited) {
      console.log(`   ⏰ Rate limiting triggered at request #${firstRateLimited.requestNumber}`);
    }
  } else {
    console.log(`   ⚠️  No rate limiting detected!`);
    console.log(`   🤔 This could mean:`);
    console.log(`      • Rate limits are higher than ${requestsPerMinute.toFixed(0)} requests/minute`);
    console.log(`      • Rate limiting is disabled in development mode`);
    console.log(`      • Rate limiting middleware is not working`);
  }
  
  // Performance insights
  const avgResponseTime = results.responses
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.responses.filter(r => r.responseTime).length;
  
  console.log(`\\n⚡ Performance Analysis:`);
  console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  const responseTimes = results.responses.filter(r => r.responseTime).map(r => r.responseTime);
  if (responseTimes.length > 0) {
    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);
    console.log(`   Fastest Response: ${minTime}ms`);
    console.log(`   Slowest Response: ${maxTime}ms`);
  }
  
  // Rate limit headers analysis
  console.log(`\\n📊 Rate Limit Headers Analysis:`);
  const headersFound = results.responses.filter(r => r.rateLimitHeaders && r.rateLimitHeaders.limit);
  
  if (headersFound.length > 0) {
    console.log(`   ✅ Rate limit headers found in ${headersFound.length} responses`);
    const sampleHeaders = headersFound[0].rateLimitHeaders;
    console.log(`   📋 Sample headers: Limit=${sampleHeaders.limit}, Remaining=${sampleHeaders.remaining}`);
  } else {
    console.log(`   ⚠️  No rate limit headers found`);
    console.log(`   💡 Consider adding rate limit headers to responses`);
  }
  
  // Final verdict
  console.log(`\\n🎯 FINAL VERDICT:`);
  
  if (results.rateLimited > 0) {
    console.log(`   ✅ PRODUCTION-READY: Rate limiting is working correctly!`);
    console.log(`   🛡️ Your API is protected against abuse`);
    console.log(`   📈 ${results.rateLimited} out of ${config.totalRequests} requests were blocked`);
  } else if (results.successful === config.totalRequests) {
    console.log(`   ⚠️  ATTENTION: All requests succeeded`);
    console.log(`   🔧 Rate limits may need to be lowered for production`);
    console.log(`   💭 Consider testing with higher request rates`);
  } else {
    console.log(`   ❌ ISSUES DETECTED: ${results.errors} requests failed`);
    console.log(`   🔧 Check server logs and configuration`);
  }
  
  console.log('\\n' + '='.repeat(70));
  console.log('🏁 Aggressive test completed!');
  
  // Save results to file
  const reportData = {
    config,
    results,
    summary: {
      duration,
      requestsPerSecond,
      requestsPerMinute,
      avgResponseTime: Math.round(avgResponseTime),
      rateLimitingEffective: results.rateLimited > 0,
      productionReady: results.rateLimited > 0
    }
  };
  
  require('fs').writeFileSync(
    'aggressive-rate-test-results.json',
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('💾 Detailed results saved to: aggressive-rate-test-results.json');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Start the test
if (require.main === module) {
  runAggressiveRateLimitTest().catch(console.error);
}

module.exports = { runAggressiveRateLimitTest, config };

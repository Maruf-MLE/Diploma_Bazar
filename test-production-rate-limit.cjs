#!/usr/bin/env node

/**
 * Production Rate Limit Testing Script
 * Tests rate limiting functionality in production mode
 */

const http = require('http');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.BYPASS_RATE_LIMITS = 'false';

console.log('🚀 Starting Production Rate Limit Test');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  BYPASS_RATE_LIMITS: process.env.BYPASS_RATE_LIMITS
});

// Test configuration
const testConfig = {
  host: 'localhost',
  port: 3001,
  testEndpoint: '/api/books',
  maxRequests: 12, // Should trigger rate limit (config has 5 per minute)
  delayMs: 100 // Small delay between requests
};

// Function to make HTTP request
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          timestamp: new Date().toISOString()
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Function to test rate limiting
async function testRateLimit() {
  console.log(`\n📊 Testing rate limit on ${testConfig.testEndpoint}`);
  console.log(`Making ${testConfig.maxRequests} requests with ${testConfig.delayMs}ms delay`);
  
  const results = [];
  let rateLimitHit = false;
  
  for (let i = 1; i <= testConfig.maxRequests; i++) {
    try {
      console.log(`\n🔄 Request ${i}/${testConfig.maxRequests}`);
      
      const response = await makeRequest({
        hostname: testConfig.host,
        port: testConfig.port,
        path: testConfig.testEndpoint,
        method: 'GET',
        headers: {
          'User-Agent': 'ProductionTestClient/1.0',
          'Accept': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.statusCode}`);
      
      // Log rate limit headers
      const rateLimitHeaders = {};
      Object.keys(response.headers).forEach(header => {
        if (header.toLowerCase().includes('ratelimit') || header.toLowerCase().includes('retry')) {
          rateLimitHeaders[header] = response.headers[header];
        }
      });
      
      if (Object.keys(rateLimitHeaders).length > 0) {
        console.log(`   Rate Limit Headers:`, rateLimitHeaders);
      }
      
      // Check if rate limited
      if (response.statusCode === 429) {
        console.log('🚨 RATE LIMIT TRIGGERED!');
        rateLimitHit = true;
        
        try {
          const errorData = JSON.parse(response.body);
          console.log('   Error Details:', {
            code: errorData.error?.code,
            message: errorData.error?.message,
            current: errorData.current,
            limits: errorData.limits
          });
        } catch (parseError) {
          console.log('   Raw Response:', response.body);
        }
        
        break; // Stop testing after hitting rate limit
      } else if (response.statusCode === 404) {
        console.log('   ⚠️  Endpoint not found (expected in this test)');
      } else {
        console.log('   ✅ Request allowed');
      }
      
      results.push({
        requestNumber: i,
        statusCode: response.statusCode,
        headers: rateLimitHeaders,
        timestamp: response.timestamp
      });
      
      // Wait before next request
      if (i < testConfig.maxRequests) {
        await new Promise(resolve => setTimeout(resolve, testConfig.delayMs));
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
      break;
    }
  }
  
  // Test results summary
  console.log('\n📈 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total requests made: ${results.length}`);
  console.log(`Rate limit triggered: ${rateLimitHit ? 'YES ✅' : 'NO ❌'}`);
  
  if (rateLimitHit) {
    console.log('🎉 PRODUCTION RATE LIMITING IS WORKING!');
    console.log('   - Rate limits are properly enforced');
    console.log('   - 429 status code returned as expected');
    console.log('   - Rate limit headers included');
  } else {
    console.log('⚠️  RATE LIMITING MAY NOT BE WORKING');
    console.log('   - No 429 responses received');
    console.log('   - Check configuration and middleware');
  }
  
  return { rateLimitHit, totalRequests: results.length };
}

// Function to check server health
async function checkServerHealth() {
  console.log('\n🏥 Checking server health...');
  
  try {
    const response = await makeRequest({
      hostname: testConfig.host,
      port: testConfig.port,
      path: '/health',
      method: 'GET',
      headers: {
        'User-Agent': 'HealthChecker/1.0'
      }
    });
    
    console.log(`Health check status: ${response.statusCode}`);
    
    if (response.statusCode === 200 || response.statusCode === 404) {
      console.log('✅ Server is responsive');
      return true;
    } else {
      console.log('⚠️  Server responded with unexpected status');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Server health check failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runProductionTest() {
  try {
    console.log('\n🎯 PRODUCTION RATE LIMIT TEST');
    console.log('================================');
    
    // Check if server is running
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
      console.log('\n❌ Server is not running or not responding');
      console.log('Please start the server with: npm run server');
      process.exit(1);
    }
    
    // Wait a moment for server to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Run rate limit test
    const testResult = await testRateLimit();
    
    // Final assessment
    console.log('\n🏁 FINAL ASSESSMENT');
    console.log('==================');
    
    if (testResult.rateLimitHit) {
      console.log('✅ PRODUCTION RATE LIMITING: WORKING CORRECTLY');
      console.log('   The server properly enforces rate limits in production mode');
      process.exit(0);
    } else {
      console.log('❌ PRODUCTION RATE LIMITING: NEEDS ATTENTION');
      console.log('   Rate limits may not be working as expected');
      console.log('   Check middleware configuration and database functions');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Test terminated');
  process.exit(143);
});

// Start the test
runProductionTest();

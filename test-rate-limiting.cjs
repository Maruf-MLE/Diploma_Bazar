// Rate Limiting Test Script
// This script tests the rate limiting functionality by sending multiple requests

const http = require('http');
const https = require('https');

// Configuration
const TEST_CONFIG = {
  host: 'localhost',
  port: 3001,
  protocol: 'http:',
  paths: [
    '/health',
    '/api/rate-limit/status',
    '/api/books',
    '/api/auth/login'
  ],
  // Test scenarios
  scenarios: {
    normal: {
      requests: 10,
      interval: 100, // ms between requests
      description: 'Normal load test - should pass'
    },
    burst: {
      requests: 60, // More than per-minute limit (50)
      interval: 50,
      description: 'Burst test - should trigger rate limiting'
    },
    sustained: {
      requests: 30,
      interval: 2000, // 2 seconds between requests
      description: 'Sustained test - should pass'
    }
  }
};

// Helper function to make HTTP request
const makeRequest = (path, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TEST_CONFIG.host,
      port: TEST_CONFIG.port,
      path: path,
      method: method,
      headers: {
        'User-Agent': 'Rate-Limit-Test-Client/1.0',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        let parsedData = null;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = data;
        }
        
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: parsedData,
          responseTime,
          timestamp: new Date().toISOString()
        });
      });
    });

    req.on('error', (err) => {
      reject({
        error: err.message,
        timestamp: new Date().toISOString()
      });
    });

    req.setTimeout(5000, () => {
      req.abort();
      reject({
        error: 'Request timeout',
        timestamp: new Date().toISOString()
      });
    });

    req.end();
  });
};

// Run test scenario
const runScenario = async (scenarioName, scenario, path = '/api/rate-limit/status') => {
  console.log(`\n🧪 Running scenario: ${scenarioName}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log(`🔢 Requests: ${scenario.requests}, Interval: ${scenario.interval}ms`);
  console.log(`🎯 Path: ${path}`);
  console.log('─'.repeat(60));

  const results = [];
  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < scenario.requests; i++) {
    try {
      const result = await makeRequest(path);
      results.push(result);

      // Log every 10th request or important status codes
      if (i % 10 === 0 || result.statusCode !== 200) {
        console.log(`Request ${i + 1}/${scenario.requests}: ${result.statusCode} ${result.statusMessage} (${result.responseTime}ms)`);
        
        // Show rate limit headers if present
        if (result.headers['x-ratelimit-limit']) {
          console.log(`  Rate Limit: ${result.headers['x-ratelimit-remaining']}/${result.headers['x-ratelimit-limit']} remaining`);
        }
        
        // Show rate limit details for 429 responses
        if (result.statusCode === 429 && result.data) {
          console.log(`  Rate Limited: ${result.data.details || 'Too many requests'}`);
          if (result.data.retry_after) {
            console.log(`  Retry After: ${result.data.retry_after} seconds`);
          }
        }
      }

      // Count results
      if (result.statusCode === 200) {
        successCount++;
      } else if (result.statusCode === 429) {
        rateLimitedCount++;
      } else {
        errorCount++;
      }

    } catch (error) {
      console.log(`Request ${i + 1}/${scenario.requests}: ERROR - ${error.error}`);
      errorCount++;
      results.push(error);
    }

    // Wait before next request
    if (i < scenario.requests - 1) {
      await new Promise(resolve => setTimeout(resolve, scenario.interval));
    }
  }

  // Summary
  console.log('\n📊 Results Summary:');
  console.log(`✅ Successful: ${successCount}/${scenario.requests} (${((successCount/scenario.requests)*100).toFixed(1)}%)`);
  console.log(`⚠️  Rate Limited: ${rateLimitedCount}/${scenario.requests} (${((rateLimitedCount/scenario.requests)*100).toFixed(1)}%)`);
  console.log(`❌ Errors: ${errorCount}/${scenario.requests} (${((errorCount/scenario.requests)*100).toFixed(1)}%)`);

  // Response time stats
  const responseTimes = results
    .filter(r => r.responseTime)
    .map(r => r.responseTime);
  
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`⏱️  Response Time: ${avgResponseTime.toFixed(1)}ms avg, ${minResponseTime}ms min, ${maxResponseTime}ms max`);
  }

  return {
    scenario: scenarioName,
    results,
    summary: {
      total: scenario.requests,
      successful: successCount,
      rateLimited: rateLimitedCount,
      errors: errorCount,
      successRate: (successCount/scenario.requests)*100,
      rateLimitRate: (rateLimitedCount/scenario.requests)*100
    }
  };
};

// Test server connectivity
const testConnectivity = async () => {
  console.log('🔍 Testing server connectivity...');
  try {
    const result = await makeRequest('/health');
    if (result.statusCode === 200) {
      console.log('✅ Server is running and accessible');
      console.log(`📍 Server info: ${JSON.stringify(result.data, null, 2)}`);
      return true;
    } else {
      console.log(`❌ Server responded with status ${result.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Cannot connect to server: ${error.error}`);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Rate Limiting Test Suite');
  console.log('=' .repeat(60));
  
  // Test connectivity first
  const isConnected = await testConnectivity();
  if (!isConnected) {
    console.log('\n❌ Cannot proceed with tests - server is not accessible');
    process.exit(1);
  }

  const allResults = [];

  // Run each scenario
  for (const [scenarioName, scenario] of Object.entries(TEST_CONFIG.scenarios)) {
    const result = await runScenario(scenarioName, scenario);
    allResults.push(result);
    
    // Wait between scenarios
    console.log('\n⏳ Waiting 5 seconds before next scenario...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Overall summary
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 OVERALL TEST RESULTS');
  console.log('=' .repeat(60));

  allResults.forEach(result => {
    const { scenario, summary } = result;
    console.log(`\n📋 ${scenario.toUpperCase()}:`);
    console.log(`   ✅ Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`   ⚠️  Rate Limit Rate: ${summary.rateLimitRate.toFixed(1)}%`);
    console.log(`   📊 ${summary.successful}/${summary.total} requests successful`);
  });

  // Test evaluation
  console.log('\n🔍 Rate Limiting System Evaluation:');
  
  const burstResult = allResults.find(r => r.scenario === 'burst');
  const normalResult = allResults.find(r => r.scenario === 'normal');
  const sustainedResult = allResults.find(r => r.scenario === 'sustained');

  let score = 0;
  let maxScore = 0;

  // Check if rate limiting is working (burst should be limited)
  maxScore += 40;
  if (burstResult && burstResult.summary.rateLimitRate > 10) {
    score += 40;
    console.log('✅ Rate limiting is WORKING - burst requests were properly limited');
  } else {
    console.log('❌ Rate limiting may NOT be working - burst requests were not limited');
  }

  // Check if normal traffic passes
  maxScore += 30;
  if (normalResult && normalResult.summary.successRate > 80) {
    score += 30;
    console.log('✅ Normal traffic is ALLOWED - good request handling');
  } else {
    console.log('❌ Normal traffic is being blocked - may be too restrictive');
  }

  // Check if sustained traffic is handled well
  maxScore += 30;
  if (sustainedResult && sustainedResult.summary.successRate > 90) {
    score += 30;
    console.log('✅ Sustained traffic is handled WELL - proper rate limiting');
  } else {
    console.log('❌ Sustained traffic has issues - check rate limiting configuration');
  }

  const finalScore = (score / maxScore) * 100;
  console.log(`\n🏆 FINAL SCORE: ${finalScore.toFixed(1)}% (${score}/${maxScore})`);

  if (finalScore >= 80) {
    console.log('🎉 EXCELLENT: Rate limiting system is working perfectly!');
  } else if (finalScore >= 60) {
    console.log('👍 GOOD: Rate limiting system is working with minor issues');
  } else if (finalScore >= 40) {
    console.log('⚠️  FAIR: Rate limiting system needs improvements');
  } else {
    console.log('❌ POOR: Rate limiting system has significant issues');
  }
};

// Run the tests
runTests().catch(console.error);

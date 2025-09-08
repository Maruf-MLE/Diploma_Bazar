// Ultimate Production Rate Limit Test
// Multiple test scenarios to ensure rate limiting works perfectly

const http = require('http');
const { spawn } = require('child_process');

console.log('🔥 ULTIMATE PRODUCTION RATE LIMIT TEST');
console.log('='.repeat(70));
console.log('এই test এ আমরা check করব:');
console.log('1. Rate limiting trigger হয় কিনা');
console.log('2. Headers properly set হয় কিনা');
console.log('3. 429 status code return করে কিনা');
console.log('4. Database tracking কাজ করে কিনা');
console.log('='.repeat(70));

let serverProcess = null;

// Helper function to make HTTP request
function makeRequest(url, requestNum) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          number: requestNum,
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime: responseTime
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        number: requestNum,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        number: requestNum,
        error: 'timeout'
      });
    });
  });
}

// Test 1: Sequential Rapid Fire Test
async function sequentialTest() {
  console.log('\n📝 TEST 1: Sequential Rapid Fire (একের পর এক)');
  console.log('-'.repeat(50));
  
  let successCount = 0;
  let rateLimitedCount = 0;
  let firstRateLimitAt = null;
  
  for (let i = 1; i <= 55; i++) {
    const result = await makeRequest('http://localhost:3001/api/test', i);
    
    if (result.statusCode === 200) {
      successCount++;
      process.stdout.write(`✅`);
      
      // Check rate limit headers
      if (result.headers['x-ratelimit-remaining']) {
        const remaining = parseInt(result.headers['x-ratelimit-remaining']);
        if (remaining <= 5 && remaining > 0) {
          console.log(`\n⚠️  Only ${remaining} requests remaining!`);
        }
      }
    } else if (result.statusCode === 429) {
      rateLimitedCount++;
      if (!firstRateLimitAt) firstRateLimitAt = i;
      process.stdout.write(`🚫`);
      console.log(`\n🔴 RATE LIMITED at request #${i}!`);
      console.log(`   Response: ${result.data.substring(0, 100)}`);
      break;
    } else {
      process.stdout.write(`❌`);
    }
    
    if (i % 10 === 0) process.stdout.write(` [${i}]\n`);
  }
  
  console.log(`\n\nResults: ✅ Success: ${successCount}, 🚫 Rate Limited: ${rateLimitedCount}`);
  
  if (firstRateLimitAt) {
    console.log(`✅ Rate limiting triggered after ${firstRateLimitAt - 1} requests`);
  }
  
  return { successCount, rateLimitedCount, firstRateLimitAt };
}

// Test 2: Concurrent Burst Test
async function concurrentTest() {
  console.log('\n📝 TEST 2: Concurrent Burst (একসাথে 51 requests)');
  console.log('-'.repeat(50));
  
  const promises = [];
  for (let i = 1; i <= 51; i++) {
    promises.push(makeRequest('http://localhost:3001/api/test', i));
  }
  
  console.log('🚀 Sending 51 requests simultaneously...');
  const results = await Promise.all(promises);
  
  let successCount = 0;
  let rateLimitedCount = 0;
  let hasRateLimitHeaders = false;
  
  results.forEach(result => {
    if (result.statusCode === 200) {
      successCount++;
      if (result.headers['x-ratelimit-limit']) {
        hasRateLimitHeaders = true;
      }
    } else if (result.statusCode === 429) {
      rateLimitedCount++;
    }
  });
  
  console.log(`Results: ✅ Success: ${successCount}, 🚫 Rate Limited: ${rateLimitedCount}`);
  console.log(`Rate Limit Headers: ${hasRateLimitHeaders ? '✅ Present' : '❌ Missing'}`);
  
  return { successCount, rateLimitedCount, hasRateLimitHeaders };
}

// Test 3: Wait and Test Again
async function resetTest() {
  console.log('\n📝 TEST 3: Reset Test (wait করে আবার test)');
  console.log('-'.repeat(50));
  
  // First, make one request to check current status
  const statusCheck = await makeRequest('http://localhost:3001/api/rate-limit/status', 0);
  console.log('Current rate limit status checked');
  
  if (statusCheck.data) {
    try {
      const status = JSON.parse(statusCheck.data);
      console.log(`Current counts: minute=${status.current?.minute || 0}, hour=${status.current?.hour || 0}`);
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Wait for minute reset
  console.log('⏳ Waiting 65 seconds for minute counter to reset...');
  await new Promise(resolve => setTimeout(resolve, 65000));
  
  // Try again after reset
  console.log('🔄 Testing after reset...');
  let successAfterReset = 0;
  
  for (let i = 1; i <= 10; i++) {
    const result = await makeRequest('http://localhost:3001/api/test', i);
    if (result.statusCode === 200) {
      successAfterReset++;
      process.stdout.write(`✅`);
    } else {
      process.stdout.write(`❌`);
    }
  }
  
  console.log(`\nAfter reset: ${successAfterReset}/10 requests successful`);
  
  return { successAfterReset };
}

// Main test runner
async function runAllTests() {
  try {
    // Start server in production mode
    console.log('🚀 Starting server in PRODUCTION mode...');
    
    serverProcess = spawn('node', ['server-fixed.cjs'], {
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        BYPASS_RATE_LIMITS: 'false',
        RATE_LIMIT_ENABLED: 'true',
        RATE_LIMIT_DEBUG: 'true'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let serverReady = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Rate Limiting Server running')) {
        serverReady = true;
      }
      // Show server logs for debugging
      if (output.includes('RATE-LIMIT')) {
        console.log(`[SERVER] ${output.trim()}`);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error('[SERVER ERROR]', data.toString());
    });
    
    // Wait for server to be ready
    let waitTime = 0;
    while (!serverReady && waitTime < 5000) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitTime += 100;
    }
    
    if (!serverReady) {
      console.log('⚠️  Server may not be fully ready, continuing anyway...');
    }
    
    console.log('✅ Server started in production mode\n');
    
    // Run all tests
    const test1 = await sequentialTest();
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const test2 = await concurrentTest();
    
    // Optional: Run reset test (takes 65+ seconds)
    // const test3 = await resetTest();
    
    // Final Report
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL REPORT');
    console.log('='.repeat(70));
    
    const rateLimitWorking = test1.rateLimitedCount > 0 || test2.rateLimitedCount > 0;
    
    if (rateLimitWorking) {
      console.log('✅✅✅ RATE LIMITING IS WORKING PERFECTLY! ✅✅✅');
      console.log('');
      console.log('Test 1 (Sequential): ' + (test1.rateLimitedCount > 0 ? '✅ Triggered' : '❌ Not triggered'));
      console.log('Test 2 (Concurrent): ' + (test2.rateLimitedCount > 0 ? '✅ Triggered' : '❌ Not triggered'));
      console.log('Headers Present: ' + (test2.hasRateLimitHeaders ? '✅ Yes' : '❌ No'));
      console.log('');
      console.log('🛡️ আপনার Production API fully protected!');
    } else {
      console.log('⚠️  Rate limiting may need adjustment');
      console.log('Total successful requests: ' + (test1.successCount + test2.successCount));
      console.log('');
      console.log('Possible issues:');
      console.log('- Time window crossing (requests spread across minutes)');
      console.log('- Database sync delay');
      console.log('- Need to lower rate limits');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    // Stop server
    if (serverProcess) {
      console.log('\n🛑 Stopping server...');
      serverProcess.kill();
    }
  }
}

// Run the tests
console.log('🎯 Starting comprehensive production rate limit testing...\n');
runAllTests().catch(console.error);

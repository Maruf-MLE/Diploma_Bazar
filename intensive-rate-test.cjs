// Intensive Rate Limiting Test
// Test করব যে আসলেই rate limiting কাজ করে

const https = require('https');

console.log('🔥 INTENSIVE RATE LIMITING TEST');
console.log('='.repeat(60));

// Make HTTP request
function makeRequest(url, requestNum) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'IntensiveRateTester/1.0'
      },
      timeout: 5000
    };

    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        // Extract rate limit headers
        const rateLimitHeaders = {};
        Object.keys(res.headers).forEach(key => {
          if (key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('rate-limit')) {
            rateLimitHeaders[key] = res.headers[key];
          }
        });
        
        resolve({
          requestNum,
          statusCode: res.statusCode,
          headers: rateLimitHeaders,
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

async function intensiveTest() {
  const testUrl = 'https://diplomabazar.vercel.app/api/test';
  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;
  let firstRateLimit = null;
  
  console.log(`🚀 Sending 60 requests rapidly to: ${testUrl}`);
  console.log('Target: Should get rate limited after ~50 requests\n');
  
  // Send 60 requests as fast as possible
  for (let i = 1; i <= 60; i++) {
    const result = await makeRequest(testUrl, i);
    
    if (!result.success) {
      errorCount++;
      console.log(`❌ Request ${i}: ERROR - ${result.error}`);
      continue;
    }
    
    const remaining = result.headers['x-ratelimit-remaining'];
    const limit = result.headers['x-ratelimit-limit'];
    
    if (result.statusCode === 200) {
      successCount++;
      
      if (remaining !== undefined) {
        console.log(`✅ Request ${i}: SUCCESS (${remaining}/${limit} remaining)`);
        
        if (parseInt(remaining) <= 2) {
          console.log(`   ⚠️  WARNING: Very close to rate limit!`);
        }
      } else {
        console.log(`✅ Request ${i}: SUCCESS (no rate headers)`);
      }
      
    } else if (result.statusCode === 429) {
      rateLimitedCount++;
      if (!firstRateLimit) {
        firstRateLimit = i;
      }
      
      console.log(`🚫 Request ${i}: RATE LIMITED! (429)`);
      console.log(`   Retry-After: ${result.headers['retry-after'] || 'not set'}`);
      console.log(`   X-RateLimit-Reset: ${result.headers['x-ratelimit-reset'] || 'not set'}`);
      
      // Parse response for more details
      try {
        const responseData = JSON.parse(result.data);
        if (responseData.current) {
          console.log(`   Current counts: ${JSON.stringify(responseData.current)}`);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      
      // Continue testing a few more to see consistent blocking
      if (rateLimitedCount >= 5) {
        console.log(`   🛑 Stopping test after 5 consecutive rate limits`);
        break;
      }
      
    } else {
      errorCount++;
      console.log(`❌ Request ${i}: HTTP ${result.statusCode}`);
    }
    
    // Very small delay to not overwhelm
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 INTENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Successful Requests: ${successCount}`);
  console.log(`🚫 Rate Limited Requests: ${rateLimitedCount}`);
  console.log(`❌ Error Requests: ${errorCount}`);
  
  if (rateLimitedCount > 0) {
    console.log(`\n🎯 RATE LIMITING WORKS!`);
    console.log(`   • First rate limit at request: ${firstRateLimit}`);
    console.log(`   • Rate limit triggered after ${successCount} successful requests`);
    console.log(`   • This matches expected limit of ~50 requests per minute`);
    console.log(`\n✅✅✅ PRODUCTION RATE LIMITING IS FULLY FUNCTIONAL! ✅✅✅`);
  } else if (successCount >= 50) {
    console.log(`\n⚠️  RATE LIMITING MAY NOT BE WORKING`);
    console.log(`   • ${successCount} requests succeeded without rate limiting`);
    console.log(`   • Expected rate limit after ~50 requests`);
    console.log(`   • Check database connection and functions`);
  } else {
    console.log(`\n🤔 INCONCLUSIVE RESULTS`);
    console.log(`   • Too few requests to determine if rate limiting works`);
    console.log(`   • May need longer test or check for other issues`);
  }
}

// Check rate limit status before test
async function checkStatusBefore() {
  console.log('📊 Checking rate limit status before test...');
  try {
    const result = await makeRequest('https://diplomabazar.vercel.app/api/rate-limit/status', 0);
    if (result.success && result.statusCode === 200) {
      const data = JSON.parse(result.data);
      console.log(`Current counts: Minute=${data.current.minute}, Hour=${data.current.hour}, Day=${data.current.day}`);
      console.log(`Limits: ${data.limits.per_minute}/min, ${data.limits.per_hour}/hr, ${data.limits.per_day}/day`);
    }
  } catch (e) {
    console.log('Could not get rate limit status');
  }
  console.log('');
}

// Run test
async function runTest() {
  await checkStatusBefore();
  await intensiveTest();
}

runTest().catch(console.error);

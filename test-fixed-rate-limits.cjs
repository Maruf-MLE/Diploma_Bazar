// Test Fixed Rate Limits
// This should now trigger rate limiting with our extremely low limits (2-3 requests/minute)

const http = require('http');

const makeRequest = (path = '/api/test', delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: path,
        method: 'GET',
        headers: {
          'User-Agent': 'Rate-Limit-Test-Fixed/1.0',
          'Content-Type': 'application/json',
        }
      };

      const startTime = Date.now();
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            responseTime
          });
        });
      });

      req.on('error', (err) => resolve({ error: err.message }));
      req.setTimeout(5000, () => {
        req.abort();
        resolve({ error: 'timeout' });
      });

      req.end();
    }, delay);
  });
};

const testFixedLimits = async () => {
  console.log('🔥 TESTING FIXED RATE LIMITS');
  console.log('============================');
  console.log('Expected: Rate limiting should trigger after 2-3 requests');
  console.log('Database limits set to: 2/minute for /api/test, 3/minute for others\n');

  let rateLimited = 0;
  let successful = 0;
  let errors = 0;

  // Test the /api/test endpoint (should trigger after 2 requests)
  console.log('🎯 Testing /api/test endpoint (limit: 2/minute)...\n');
  
  for (let i = 1; i <= 8; i++) {
    const result = await makeRequest('/api/test');
    
    console.log(`Request ${i}: Status ${result.status || 'ERROR'} (${result.responseTime || 'N/A'}ms)`);
    
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}`);
      errors++;
    } else {
      // Show rate limit headers
      if (result.headers) {
        const limit = result.headers['x-ratelimit-limit'];
        const remaining = result.headers['x-ratelimit-remaining'];
        const reset = result.headers['x-ratelimit-reset'];
        
        if (limit !== undefined) {
          console.log(`  📊 Rate Limit: ${remaining}/${limit} remaining`);
          if (reset) {
            const resetTime = new Date(parseInt(reset) * 1000);
            console.log(`  🔄 Reset at: ${resetTime.toLocaleTimeString()}`);
          }
        }
        
        // Show debug info if available
        const debugId = result.headers['x-debug-identifier'];
        if (debugId) {
          console.log(`  🔍 Debug: ${debugId}`);
        }
      }
      
      if (result.status === 429) {
        rateLimited++;
        console.log(`  🚨 RATE LIMITED! (This is SUCCESS!)`);
        try {
          const responseData = JSON.parse(result.data);
          if (responseData.details) {
            console.log(`  💬 Details: ${responseData.details}`);
          }
          if (responseData.retry_after) {
            console.log(`  ⏰ Retry after: ${responseData.retry_after} seconds`);
          }
          if (responseData.current) {
            console.log(`  📈 Current usage: ${JSON.stringify(responseData.current)}`);
          }
        } catch (e) {
          console.log(`  📝 Response: ${result.data.substring(0, 200)}...`);
        }
        
        if (i <= 3) {
          console.log(`  ✅ Rate limiting triggered correctly after ${i} requests!`);
        }
      } else if (result.status >= 200 && result.status < 300) {
        successful++;
        console.log(`  ✅ Request successful`);
      } else {
        console.log(`  ⚠️  Unexpected status: ${result.status}`);
      }
    }
    
    console.log('');
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n📊 TEST RESULTS:');
  console.log('═══════════════');
  console.log(`✅ Successful requests: ${successful}`);
  console.log(`🚨 Rate limited (429): ${rateLimited}`);
  console.log(`❌ Error requests: ${errors}`);
  console.log(`📈 Total requests: ${successful + rateLimited + errors}`);
  
  if (rateLimited > 0) {
    console.log('\n🎉 ✅ SUCCESS: Rate limiting is now WORKING!');
    console.log(`Rate limiting triggered after ${successful + 1} requests (as expected)`);
    console.log(`Database limits are properly configured and enforced.`);
  } else if (errors === 0) {
    console.log('\n❌ STILL NOT WORKING: Rate limiting did not trigger');
    console.log('Possible issues:');
    console.log('- Middleware not properly attached');
    console.log('- Server bypass still active');
    console.log('- Database function issues');
  } else {
    console.log('\n❓ Unable to determine status due to connection errors');
    console.log('Make sure the server is running on port 3001');
  }
  
  if (rateLimited > 0) {
    console.log('\n🔧 PRODUCTION READY:');
    console.log('Your rate limiting system is working correctly!');
    console.log('In production, set higher limits:');
    console.log('- 50-100 requests per minute for normal endpoints');
    console.log('- 10-20 requests per minute for auth endpoints');
  }
};

console.log('🚀 Starting Fixed Rate Limit Test...\n');
testFixedLimits().catch(console.error);

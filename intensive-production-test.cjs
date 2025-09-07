// Intensive Production Test - 25 rapid requests
const https = require('https');

const PRODUCTION_URL = 'https://diplomabazar.vercel.app';
const TEST_ENDPOINT = '/api/test';

const makeRequest = (i) => {
  return new Promise((resolve) => {
    const urlObj = new URL(PRODUCTION_URL + TEST_ENDPOINT);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': `Intensive-Production-Test/1.0 Request-${i}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const startTime = Date.now();
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          request: i,
          status: res.statusCode,
          data: data,
          headers: res.headers,
          responseTime
        });
      });
    });

    req.on('error', (err) => {
      resolve({ 
        request: i, 
        error: err.message, 
        responseTime: Date.now() - startTime 
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ 
        request: i, 
        error: 'timeout', 
        responseTime: 10000 
      });
    });

    req.end();
  });
};

const intensiveTest = async () => {
  console.log('🔥 INTENSIVE PRODUCTION TEST');
  console.log('============================');
  console.log(`Testing: ${PRODUCTION_URL}${TEST_ENDPOINT}`);
  console.log('Sending 25 rapid requests to trigger rate limiting...\n');
  
  // Send all requests in parallel for maximum intensity
  const promises = [];
  for (let i = 1; i <= 25; i++) {
    promises.push(makeRequest(i));
  }
  
  const results = await Promise.all(promises);
  
  // Sort by request number for better readability
  results.sort((a, b) => a.request - b.request);
  
  let successful = 0;
  let rateLimited = 0;
  let errors = 0;
  let firstRateLimitRequest = null;
  
  console.log('📊 RESULTS:');
  console.log('============\n');
  
  results.forEach((result) => {
    const { request, status, error, responseTime, headers } = result;
    
    if (error) {
      console.log(`Request ${request}: ❌ ERROR (${error}) - ${responseTime}ms`);
      errors++;
    } else {
      console.log(`Request ${request}: Status ${status} - ${responseTime}ms`);
      
      // Show rate limit headers if present
      if (headers && headers['x-ratelimit-limit']) {
        const remaining = headers['x-ratelimit-remaining'];
        const limit = headers['x-ratelimit-limit'];
        console.log(`   📊 Rate Limit: ${remaining}/${limit} remaining`);
      }
      
      if (status === 429) {
        rateLimited++;
        if (!firstRateLimitRequest) {
          firstRateLimitRequest = request;
        }
        console.log(`   🚨 RATE LIMITED!`);
        
        // Show response data for 429
        try {
          const responseData = JSON.parse(result.data);
          if (responseData.details) {
            console.log(`   💬 Details: ${responseData.details}`);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      } else if (status >= 200 && status < 300) {
        successful++;
        console.log(`   ✅ Success`);
      }
    }
    console.log(''); // Empty line
  });
  
  console.log('📈 FINAL SUMMARY:');
  console.log('==================');
  console.log(`✅ Successful requests: ${successful}`);
  console.log(`🚨 Rate limited (429): ${rateLimited}`);
  console.log(`❌ Error requests: ${errors}`);
  console.log(`📊 Total requests: ${results.length}`);
  
  if (rateLimited > 0) {
    console.log(`\n🎉 ✅ SUCCESS: Rate limiting is WORKING in production!`);
    console.log(`First rate limit occurred at request ${firstRateLimitRequest}`);
  } else if (successful > 10) {
    console.log(`\n⚠️  Rate limiting might not be active in production`);
    console.log(`Possible reasons:`);
    console.log(`- Production server doesn't have rate limiting middleware`);
    console.log(`- Rate limits are set too high (${successful} requests succeeded)`);
    console.log(`- Production uses different database/configuration`);
    console.log(`- Middleware is bypassed in production environment`);
  } else if (errors > 5) {
    console.log(`\n❓ Unable to determine rate limiting status`);
    console.log(`Too many connection errors (${errors} errors)`);
  }
  
  console.log(`\n🔍 TROUBLESHOOTING:`);
  console.log(`- Check if rate limiting middleware is deployed to production`);
  console.log(`- Verify production environment variables (SUPABASE_URL, etc.)`);
  console.log(`- Check production logs for middleware errors`);
  console.log(`- Ensure production uses the same database as development`);
};

intensiveTest().catch(console.error);

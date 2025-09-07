// Production Rate Limit Test
// Test your live production API to see if rate limiting works

const https = require('https');
const http = require('http');

// Replace with your production URL
const PRODUCTION_URL = 'https://diplomabazar.vercel.app'; // Your actual production URL!
const TEST_ENDPOINT = '/api/test'; // Test endpoint with 10/minute limit

const makeRequest = (url, path = '/', useHttps = true) => {
  return new Promise((resolve) => {
    const urlObj = new URL(url + path);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (useHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Rate-Limit-Test/1.0',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const startTime = Date.now();
    const client = useHttps ? https : http;
    
    const req = client.request(options, (res) => {
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

    req.on('error', (err) => {
      console.error(`Request error: ${err.message}`);
      resolve({ error: err.message });
    });
    
    req.setTimeout(10000, () => {
      req.abort();
      resolve({ error: 'timeout' });
    });

    req.end();
  });
};

const testProductionRateLimit = async () => {
  console.log('🌐 Production Rate Limit Test');
  console.log(`Testing: ${PRODUCTION_URL}${TEST_ENDPOINT}\n`);
  
  const requests = 15; // Test with 15 requests
  let rateLimited = 0;
  let successful = 0;
  let errors = 0;

  console.log('Sending requests...\n');

  for (let i = 1; i <= requests; i++) {
    const result = await makeRequest(PRODUCTION_URL, TEST_ENDPOINT);
    
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
      }
      
      if (result.status === 429) {
        rateLimited++;
        console.log(`  🚨 RATE LIMITED!`);
        try {
          const responseData = JSON.parse(result.data);
          if (responseData.details) {
            console.log(`  💬 Details: ${responseData.details}`);
          }
          if (responseData.retry_after) {
            console.log(`  ⏰ Retry after: ${responseData.retry_after} seconds`);
          }
        } catch (e) {
          console.log(`  📝 Response: ${result.data.substring(0, 100)}...`);
        }
      } else if (result.status >= 200 && result.status < 300) {
        successful++;
      }
    }
    
    console.log('');
    
    // Small delay between requests (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('📊 Final Results:');
  console.log(`✅ Successful requests: ${successful}`);
  console.log(`🚨 Rate limited (429): ${rateLimited}`);
  console.log(`❌ Error requests: ${errors}`);
  console.log(`📈 Total requests: ${requests}`);
  
  if (rateLimited > 0) {
    console.log('\n🎉 ✅ Rate limiting is WORKING in production!');
  } else if (errors === 0) {
    console.log('\n⚠️  Rate limiting might not be working (no 429 responses)');
    console.log('This could mean:');
    console.log('- Rate limits are too high');
    console.log('- Rate limiting is disabled');
    console.log('- Database issues');
  } else {
    console.log('\n❓ Unable to determine rate limiting status due to errors');
  }
};

// Production URL is now set to diplomabazar.vercel.app

testProductionRateLimit().catch(console.error);

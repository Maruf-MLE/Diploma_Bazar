// Intensive Rate Limit Test - 20 requests rapidly
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
          'User-Agent': 'Intensive-Test-Client/1.0',
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

const runIntensiveTest = async () => {
  console.log('🔥 Intensive Rate Limit Test');
  console.log('Sending 20 requests rapidly to trigger rate limiting...\n');

  // Send 20 requests as fast as possible
  const promises = [];
  for (let i = 1; i <= 20; i++) {
    promises.push(makeRequest('/api/test'));
  }
  
  const results = await Promise.all(promises);
  
  let rateLimited = 0;
  let successful = 0;
  
  results.forEach((result, index) => {
    const requestNum = index + 1;
    console.log(`Request ${requestNum}: Status ${result.status} (${result.responseTime}ms)`);
    
    // Show rate limit headers
    if (result.headers) {
      const limit = result.headers['x-ratelimit-limit'];
      const remaining = result.headers['x-ratelimit-remaining'];
      if (limit) {
        console.log(`  Rate Limit: ${remaining}/${limit} remaining`);
      }
      
      const retryAfter = result.headers['retry-after'];
      if (retryAfter) {
        console.log(`  Retry After: ${retryAfter} seconds`);
      }
    }
    
    // Show rate limit response for 429
    if (result.status === 429) {
      rateLimited++;
      console.log(`  🚨 RATE LIMITED!`);
      try {
        const data = JSON.parse(result.data);
        console.log(`  Details: ${data.details}`);
        if (data.retry_after) {
          console.log(`  Retry after: ${data.retry_after} seconds`);
        }
      } catch (e) {
        console.log(`  Raw response: ${result.data.substring(0, 200)}...`);
      }
    } else if (result.status === 200) {
      successful++;
    }
    
    console.log('');
  });
  
  console.log('📊 Test Summary:');
  console.log(`✅ Successful requests: ${successful}`);
  console.log(`🚨 Rate limited requests: ${rateLimited}`);
  console.log(`❌ Failed requests: ${results.length - successful - rateLimited}`);
  
  if (rateLimited > 0) {
    console.log('\n✅ Rate limiting is WORKING!');
  } else {
    console.log('\n⚠️  Rate limiting might NOT be working or limits are too high');
  }
};

runIntensiveTest().catch(console.error);

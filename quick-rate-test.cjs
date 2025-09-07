// Quick Rate Limit Test - Just 10 requests
const http = require('http');

const makeRequest = (path = '/api/test') => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Quick-Test-Client/1.0',
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
    req.setTimeout(3000, () => {
      req.abort();
      resolve({ error: 'timeout' });
    });

    req.end();
  });
};

const runQuickTest = async () => {
  console.log('🚀 Quick Rate Limit Test');
  console.log('Sending 10 requests quickly...\n');

  for (let i = 1; i <= 10; i++) {
    const result = await makeRequest('/api/test');
    
    console.log(`Request ${i}: Status ${result.status} (${result.responseTime}ms)`);
    
    // Show rate limit headers
    if (result.headers) {
      const limit = result.headers['x-ratelimit-limit'];
      const remaining = result.headers['x-ratelimit-remaining'];
      if (limit) {
        console.log(`  Rate Limit: ${remaining}/${limit} remaining`);
      }
      
      // Show debug headers
      const debugId = result.headers['x-debug-identifier'];
      if (debugId) {
        console.log(`  Debug: ${debugId}`);
      }
    }
    
    // Show rate limit response for 429
    if (result.status === 429) {
      console.log(`  🚨 RATE LIMITED!`);
      try {
        const data = JSON.parse(result.data);
        console.log(`  Details: ${data.details}`);
        if (data.retry_after) {
          console.log(`  Retry after: ${data.retry_after} seconds`);
        }
      } catch (e) {
        console.log(`  Raw response: ${result.data}`);
      }
    }
    
    console.log(''); // Empty line
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('🏁 Test completed!');
};

runQuickTest().catch(console.error);

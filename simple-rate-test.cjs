// Simple Rate Limit Test
// Send many requests quickly to test rate limiting

const http = require('http');

const makeRequest = (path = '/api/rate-limit/status') => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Rate-Test-Client/1.0',
        'Content-Type': 'application/json',
      }
    };

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        
        resolve({
          status: res.statusCode,
          data: parsed,
          headers: res.headers,
          responseTime
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    req.setTimeout(3000, () => {
      req.abort();
      resolve({ error: 'timeout' });
    });

    req.end();
  });
};

const runTest = async () => {
  console.log('🚀 Simple Rate Limit Test');
  console.log('Sending 100 requests as fast as possible...\n');

  const results = [];
  
  // Send 100 requests as quickly as possible
  for (let i = 0; i < 100; i++) {
    const result = await makeRequest('/api/test');
    results.push(result);
    
    if (i % 10 === 0 || result.status !== 200) {
      console.log(`Request ${i + 1}: Status ${result.status} (${result.responseTime}ms)`);
      
      // Log rate limit headers
      if (result.headers) {
        const limit = result.headers['x-ratelimit-limit'];
        const remaining = result.headers['x-ratelimit-remaining'];
        if (limit) {
          console.log(`  Rate Limit: ${remaining}/${limit} remaining`);
        }
      }
      
      // Log rate limit response details
      if (result.status === 429 && result.data) {
        console.log(`  Rate Limited! ${result.data.details}`);
        if (result.data.retry_after) {
          console.log(`  Retry after: ${result.data.retry_after} seconds`);
        }
      }
    }
    
    // Small delay to not overwhelm
    if (i < 99) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  // Summary
  const successful = results.filter(r => r.status === 200).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  const errors = results.filter(r => r.error || (r.status && r.status >= 400 && r.status !== 429)).length;
  
  console.log('\n📊 Results:');
  console.log(`✅ Successful: ${successful}/100`);
  console.log(`⚠️  Rate Limited: ${rateLimited}/100`);
  console.log(`❌ Errors: ${errors}/100`);
  
  if (rateLimited > 0) {
    console.log('\n🎉 Rate limiting is WORKING!');
  } else {
    console.log('\n❌ Rate limiting appears to NOT be working');
    
    // Show first few responses for debugging
    console.log('\n🔍 Sample responses for debugging:');
    results.slice(0, 3).forEach((r, i) => {
      console.log(`Response ${i + 1}:`, {
        status: r.status,
        hasData: !!r.data,
        hasHeaders: !!r.headers,
        dataKeys: r.data ? Object.keys(r.data) : 'none'
      });
    });
  }
};

runTest().catch(console.error);

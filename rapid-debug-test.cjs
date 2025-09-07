// Rapid Debug Test - Should trigger rate limiting
const http = require('http');

const makeRequest = (i) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/test',
      method: 'GET',
      headers: {
        'User-Agent': 'Rapid-Debug-Test/1.0',
        'Content-Type': 'application/json',
      }
    };

    console.log(`🚀 Making request ${i}...`);
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`✅ Request ${i} completed: Status ${res.statusCode}`);
        if (res.headers['x-ratelimit-limit']) {
          console.log(`   Rate Limit Headers: ${res.headers['x-ratelimit-remaining']}/${res.headers['x-ratelimit-limit']}`);
        }
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Request ${i} error: ${err.message}`);
      resolve({ error: err.message });
    });
    
    req.end();
  });
};

const rapidTest = async () => {
  console.log('🔥 RAPID DEBUG TEST');
  console.log('===================');
  console.log('Making 4 rapid requests (limit is 2/minute)...\n');
  
  for (let i = 1; i <= 4; i++) {
    const result = await makeRequest(i);
    
    if (result.status === 429) {
      console.log(`🎉 SUCCESS: Request ${i} was rate limited!`);
      try {
        const data = JSON.parse(result.data);
        console.log('Rate limit response:', data);
      } catch (e) {
        console.log('Response data:', result.data);
      }
      break;
    } else if (result.status === 200) {
      console.log(`✅ Request ${i} succeeded`);
    } else {
      console.log(`⚠️  Request ${i} unexpected status: ${result.status}`);
    }
    
    console.log(''); // Empty line
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🔍 Check the server console for detailed debug logs!');
};

rapidTest().catch(console.error);

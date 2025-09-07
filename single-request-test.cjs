// Single Request Test - See exactly what middleware is doing
const http = require('http');

const makeRequest = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/test',
      method: 'GET',
      headers: {
        'User-Agent': 'Single-Test/1.0',
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.end();
  });
};

const singleTest = async () => {
  console.log('🔍 Single Request Test - Check Middleware Logs');
  console.log('================================================\n');
  
  console.log('Making a single request to /api/test...');
  console.log('Check the server console for middleware debug logs.\n');
  
  const result = await makeRequest();
  
  console.log(`Response Status: ${result.status || 'ERROR'}`);
  console.log(`Response Headers:`, result.headers);
  
  if (result.status === 429) {
    console.log('🎉 SUCCESS: Got 429 - Rate limiting is working!');
  } else if (result.status === 200) {
    console.log('⚠️  Got 200 - Rate limiting might not be active');
  } else {
    console.log(`❓ Unexpected status: ${result.status}`);
  }
  
  if (result.data && result.data.length < 500) {
    console.log(`Response Data:`, result.data);
  }
};

singleTest().catch(console.error);

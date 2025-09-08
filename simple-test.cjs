// Simple Rate Limiting Test
const http = require('http');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function testServer() {
  console.log('🧪 Testing single request to check logs...');
  
  try {
    const response = await makeRequest('http://localhost:3001/api/test');
    console.log('✅ Status:', response.statusCode);
    console.log('📋 Headers:', Object.keys(response.headers).filter(h => h.includes('rate')));
    console.log('📝 Response:', response.data.substring(0, 200));
    
    // Check rate limit headers specifically
    const rateLimitHeaders = {};
    Object.keys(response.headers).forEach(key => {
      if (key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('rate-limit')) {
        rateLimitHeaders[key] = response.headers[key];
      }
    });
    
    console.log('🚦 Rate Limit Headers:', rateLimitHeaders);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testServer();

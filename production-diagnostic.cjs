// Production Diagnostic Test
const https = require('https');

const PRODUCTION_URL = 'https://diplomabazar.vercel.app';

const makeRequest = (endpoint, showDetails = false) => {
  return new Promise((resolve) => {
    const url = PRODUCTION_URL + endpoint;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Production-Diagnostic/1.0',
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
          endpoint,
          status: res.statusCode,
          headers: res.headers,
          data: showDetails ? data : data.length + ' bytes',
          responseTime
        });
      });
    });

    req.on('error', (err) => {
      resolve({ 
        endpoint,
        error: err.message,
        responseTime: Date.now() - startTime
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ 
        endpoint,
        error: 'timeout',
        responseTime: 10000
      });
    });

    req.end();
  });
};

const diagnosticTest = async () => {
  console.log('🔍 PRODUCTION DIAGNOSTIC TEST');
  console.log('==============================');
  console.log(`Testing: ${PRODUCTION_URL}\n`);
  
  // Test different endpoints to see which ones exist
  const endpoints = [
    '/',
    '/api/test',
    '/health', 
    '/api/rate-limit/status',
    '/api/books',
    '/api/auth/login'
  ];
  
  console.log('1️⃣ Testing endpoint availability...');
  console.log('=====================================\n');
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint, endpoint === '/api/test');
    
    if (result.error) {
      console.log(`❌ ${endpoint}: ERROR (${result.error}) - ${result.responseTime}ms`);
    } else {
      console.log(`📍 ${endpoint}: Status ${result.status} - ${result.responseTime}ms`);
      
      // Check for rate limiting headers
      const rateLimitHeaders = [];
      if (result.headers['x-ratelimit-limit']) rateLimitHeaders.push(`Limit: ${result.headers['x-ratelimit-limit']}`);
      if (result.headers['x-ratelimit-remaining']) rateLimitHeaders.push(`Remaining: ${result.headers['x-ratelimit-remaining']}`);
      if (result.headers['x-ratelimit-reset']) rateLimitHeaders.push(`Reset: ${result.headers['x-ratelimit-reset']}`);
      
      if (rateLimitHeaders.length > 0) {
        console.log(`   🎯 Rate Limit Headers: ${rateLimitHeaders.join(', ')}`);
      } else {
        console.log(`   ⚠️  No rate limit headers found`);
      }
      
      // Show some key headers
      const keyHeaders = ['server', 'x-vercel-id', 'x-powered-by'];
      const foundHeaders = keyHeaders.filter(h => result.headers[h]);
      if (foundHeaders.length > 0) {
        console.log(`   📋 Headers: ${foundHeaders.map(h => `${h}=${result.headers[h]}`).join(', ')}`);
      }
      
      // For /api/test, show response data
      if (endpoint === '/api/test' && result.status === 200) {
        try {
          const responseData = JSON.parse(result.data);
          console.log(`   📄 Response:`, responseData);
        } catch (e) {
          console.log(`   📄 Response: ${result.data}`);
        }
      }
    }
    console.log('');
  }
  
  // Test rapid requests to /api/test specifically
  console.log('2️⃣ Testing rapid requests to /api/test...');
  console.log('==========================================\n');
  
  let rateLimitTriggered = false;
  
  for (let i = 1; i <= 12; i++) {
    const result = await makeRequest('/api/test');
    
    if (result.error) {
      console.log(`Request ${i}: ❌ ERROR (${result.error})`);
    } else {
      console.log(`Request ${i}: Status ${result.status} - ${result.responseTime}ms`);
      
      if (result.headers['x-ratelimit-limit']) {
        console.log(`   📊 Rate Limit: ${result.headers['x-ratelimit-remaining']}/${result.headers['x-ratelimit-limit']}`);
      }
      
      if (result.status === 429) {
        console.log(`   🚨 RATE LIMITED!`);
        rateLimitTriggered = true;
        
        try {
          const responseData = JSON.parse(result.data);
          console.log(`   💬 Details: ${responseData.details || responseData.message}`);
        } catch (e) {
          // Ignore parsing errors
        }
        break;
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n3️⃣ DIAGNOSIS RESULTS:');
  console.log('======================');
  
  if (rateLimitTriggered) {
    console.log('🎉 ✅ SUCCESS: Rate limiting is WORKING in production!');
  } else {
    console.log('⚠️  Rate limiting appears to be NOT WORKING in production');
    console.log('\nPossible issues:');
    console.log('- Middleware not deployed or not running');
    console.log('- Environment variables missing in Vercel');
    console.log('- Database connection issues in production');
    console.log('- Rate limits set too high');
    console.log('- Vercel function timeout or memory issues');
  }
  
  console.log('\n4️⃣ NEXT STEPS:');
  console.log('===============');
  console.log('1. Check Vercel function logs:');
  console.log('   https://vercel.com/dashboard → Functions → View Logs');
  console.log('');
  console.log('2. Check environment variables in Vercel:');
  console.log('   SUPABASE_URL, SUPABASE_SERVICE_KEY, NODE_ENV');
  console.log('');
  console.log('3. Test a simple endpoint without middleware:');
  console.log('   curl https://diplomabazar.vercel.app/health');
  console.log('');
  console.log('4. Check if middleware files are deployed:');
  console.log('   src/middleware/rateLimitMiddleware.cjs');
  console.log('   src/middleware/authMiddleware.cjs');
};

diagnosticTest().catch(console.error);

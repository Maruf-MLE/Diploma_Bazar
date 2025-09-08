// Final Comprehensive Rate Limiting Test
require('dotenv').config();
const { spawn } = require('child_process');
const http = require('http');

let serverProcess = null;

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, (res) => {
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

async function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting server...');
    
    serverProcess = spawn('node', ['server-fixed.cjs'], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let serverOutput = '';
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      console.log('📋 Server:', output.trim());
      
      if (output.includes('Fixed Rate Limiting Server running')) {
        setTimeout(resolve, 1000); // Wait a bit for server to be ready
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error('❌ Server Error:', data.toString().trim());
    });
    
    serverProcess.on('close', (code) => {
      console.log(`Server exited with code ${code}`);
    });
    
    // Timeout if server doesn't start
    setTimeout(() => {
      reject(new Error('Server start timeout'));
    }, 10000);
  });
}

async function stopServer() {
  if (serverProcess) {
    console.log('🛑 Stopping server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

async function testRateLimiting() {
  console.log('\\n🔥 Starting rate limiting test with 60 requests...');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;
  let rateLimitHeaders = null;
  
  for (let i = 1; i <= 60; i++) {
    try {
      const response = await makeRequest('http://localhost:3001/api/test');
      
      if (response.statusCode === 200) {
        successCount++;
        console.log(`Request ${i}: ✅ SUCCESS`);
        
        // Capture rate limit headers
        const headers = {};
        Object.keys(response.headers).forEach(key => {
          if (key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('rate-limit')) {
            headers[key] = response.headers[key];
          }
        });
        
        if (Object.keys(headers).length > 0 && !rateLimitHeaders) {
          rateLimitHeaders = headers;
          console.log(`   📊 Rate Headers:`, headers);
        }
        
        if (rateLimitHeaders && rateLimitHeaders['x-ratelimit-remaining']) {
          const remaining = parseInt(rateLimitHeaders['x-ratelimit-remaining']);
          if (remaining <= 5) {
            console.log(`   ⚠️  Only ${remaining} requests remaining`);
          }
        }
        
      } else if (response.statusCode === 429) {
        rateLimitedCount++;
        console.log(`Request ${i}: 🚫 RATE LIMITED (429)`);
        console.log(`   Response:`, response.data);
        break; // Stop after rate limit hit
        
      } else {
        errorCount++;
        console.log(`Request ${i}: ❌ ERROR ${response.statusCode}`);
      }
      
    } catch (error) {
      errorCount++;
      console.log(`Request ${i}: ❌ FAILED - ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Progress update
    if (i % 10 === 0) {
      console.log(`📊 Progress: ${i}/60 - Success: ${successCount}, Rate Limited: ${rateLimitedCount}, Errors: ${errorCount}`);
    }
  }
  
  console.log('\\n' + '='.repeat(60));
  console.log('🎯 FINAL TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Successful Requests: ${successCount}`);
  console.log(`🚫 Rate Limited Requests: ${rateLimitedCount}`);
  console.log(`❌ Error Requests: ${errorCount}`);
  
  if (rateLimitedCount > 0) {
    console.log('\\n🛡️  SUCCESS: Rate limiting is WORKING correctly!');
    console.log('   Your production API is protected against abuse.');
    console.log(`   Rate limit triggered after ${successCount} requests.`);
  } else if (successCount === 60) {
    console.log('\\n⚠️  ATTENTION: All 60 requests succeeded');
    console.log('   Rate limits may be too high or not working properly.');
  } else {
    console.log('\\n❌ ISSUES: Unexpected errors occurred during testing');
  }
  
  if (rateLimitHeaders) {
    console.log('\\n📋 Rate Limit Headers Detected:');
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
  } else {
    console.log('\\n⚠️  No rate limit headers detected');
  }
}

async function main() {
  console.log('🚀 PRODUCTION RATE LIMITING TEST');
  console.log('='.repeat(60));
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Bypass Rate Limits:', process.env.BYPASS_RATE_LIMITS);
  console.log('='.repeat(60));
  
  try {
    // Start server
    await startServer();
    console.log('✅ Server started successfully\\n');
    
    // Wait a bit for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test rate limiting
    await testRateLimiting();
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    // Always stop server
    await stopServer();
    console.log('\\n🏁 Test completed');
  }
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log('\\n⏹️  Test interrupted');
  await stopServer();
  process.exit(0);
});

main().catch(console.error);

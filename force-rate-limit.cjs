// Force Rate Limit Test - Ultra Aggressive
// This will send 51 requests in rapid succession to force rate limiting

const http = require('http');

console.log('🔥 FORCE RATE LIMIT TEST - 51 requests খুব দ্রুত পাঠাবো');
console.log('='.repeat(60));

let successCount = 0;
let rateLimitedCount = 0;
let requestPromises = [];

// Function to make a single request
function makeRequest(requestNumber) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = http.get('http://localhost:3001/api/test', (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          successCount++;
          console.log(`Request ${requestNumber}: ✅ SUCCESS (${responseTime}ms)`);
        } else if (res.statusCode === 429) {
          rateLimitedCount++;
          console.log(`Request ${requestNumber}: 🚫 RATE LIMITED! (${responseTime}ms)`);
          console.log(`   Response: ${data.substring(0, 100)}`);
        } else {
          console.log(`Request ${requestNumber}: ❌ Error ${res.statusCode}`);
        }
        resolve({ number: requestNumber, status: res.statusCode });
      });
    });
    
    req.on('error', (err) => {
      console.log(`Request ${requestNumber}: ❌ Failed - ${err.message}`);
      resolve({ number: requestNumber, error: err.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ number: requestNumber, error: 'timeout' });
    });
  });
}

async function runTest() {
  console.log('🚀 Starting server...');
  
  // Start the fixed server
  const { spawn } = require('child_process');
  const serverProcess = spawn('node', ['server-fixed.cjs'], {
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  serverProcess.stdout.on('data', (data) => {
    // Silent - no server logs
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('✅ Server started\n');
  console.log('🔥 Sending 51 requests SIMULTANEOUSLY (no delay)...\n');
  
  // Send all 51 requests at once - no delay!
  for (let i = 1; i <= 51; i++) {
    requestPromises.push(makeRequest(i));
  }
  
  // Wait for all requests to complete
  const results = await Promise.all(requestPromises);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`🚫 Rate Limited: ${rateLimitedCount}`);
  
  if (rateLimitedCount > 0) {
    console.log('\n✅✅✅ SUCCESS! Rate limiting WORKING! ✅✅✅');
    console.log(`   ${rateLimitedCount} requests blocked out of 51`);
    console.log('   আপনার API protected আছে!');
  } else {
    console.log('\n⚠️  Rate limiting may need adjustment');
    
    // Try another burst
    console.log('\n🔥 Trying another burst of 51 requests...');
    successCount = 0;
    rateLimitedCount = 0;
    requestPromises = [];
    
    for (let i = 52; i <= 102; i++) {
      requestPromises.push(makeRequest(i));
    }
    
    await Promise.all(requestPromises);
    
    console.log('\n📊 SECOND BURST RESULTS:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`🚫 Rate Limited: ${rateLimitedCount}`);
    
    if (rateLimitedCount > 0) {
      console.log('\n✅✅✅ Rate limiting TRIGGERED on second burst! ✅✅✅');
    }
  }
  
  // Stop server
  serverProcess.kill();
  console.log('\n🛑 Server stopped');
}

runTest().catch(console.error);

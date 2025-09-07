// Check API Error Details
const https = require('https');

const checkError = async () => {
  console.log('🔍 Checking API Error Details...\n');
  
  const options = {
    hostname: 'diplomabazar.vercel.app',
    port: 443,
    path: '/api/test',
    method: 'GET',
    headers: {
      'User-Agent': 'Error-Checker/1.0',
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      console.log(`Response:`, data);
      
      if (res.statusCode === 500) {
        console.log('\n🚨 SERVER ERROR DETECTED!');
        console.log('Common causes:');
        console.log('- Module import errors in Vercel');
        console.log('- Environment variable missing');
        console.log('- Node.js version compatibility');
        console.log('- Middleware dependency issues');
        
        if (data.includes('Cannot find module') || data.includes('require')) {
          console.log('\n💡 LIKELY ISSUE: Module import problems');
          console.log('Check if all dependencies are in package.json');
        }
      }
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err.message);
  });

  req.end();
};

checkError();

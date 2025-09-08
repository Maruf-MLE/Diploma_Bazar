const axios = require('axios');
require('dotenv').config();

async function testPushNotifications() {
  console.log('🔔 Testing Push Notification System...\n');
  
  try {
    // 1. Check environment variables
    console.log('1. Checking Environment Variables...');
    const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const pushServerUrl = process.env.VITE_PUSH_SERVER_URL;
    
    console.log(`   VITE_VAPID_PUBLIC_KEY: ${vapidPublic ? '✅ Set' : '❌ Missing'}`);
    console.log(`   VAPID_PRIVATE_KEY: ${vapidPrivate ? '✅ Set' : '❌ Missing'}`);
    console.log(`   VITE_PUSH_SERVER_URL: ${pushServerUrl || 'http://localhost:4000'}`);
    
    if (!vapidPublic || !vapidPrivate) {
      console.log('\n❌ VAPID keys are missing! Use the generated keys above.');
      return;
    }
    
    // 2. Test push server connection
    console.log('\n2. Testing Push Server Connection...');
    const serverUrl = pushServerUrl || 'http://localhost:4000';
    
    try {
      const response = await axios.get(serverUrl, { timeout: 5000 });
      console.log('✅ Push server is reachable');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Subscriptions: ${response.data.subscriptions}`);
    } catch (error) {
      console.log('❌ Push server is not reachable');
      console.log(`   Error: ${error.message}`);
      console.log('\n🔧 To start the push server:');
      console.log('   node push-server.js');
      return;
    }
    
    // 3. Test notification sending
    console.log('\n3. Testing Notification Sending...');
    
    // First, simulate a subscription
    const testSubscription = {
      userId: 'test-user-123',
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key'
      }
    };
    
    try {
      // Subscribe
      const subscribeResponse = await axios.post(`${serverUrl}/subscribe`, testSubscription);
      console.log('✅ Test subscription successful');
      
      // Send notification
      const notifyResponse = await axios.post(`${serverUrl}/notify`, {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test push notification',
        url: '/'
      });
      
      if (notifyResponse.data.success) {
        console.log('✅ Notification API call successful');
      } else {
        console.log('⚠️ Notification API call returned success: false');
        console.log(`   Reason: ${notifyResponse.data.message || notifyResponse.data.error}`);
      }
      
    } catch (error) {
      console.log('❌ Notification test failed');
      console.log(`   Error: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    // 4. Check production deployment
    console.log('\n4. Production Deployment Check...');
    console.log('   For production, ensure these environment variables are set:');
    console.log(`   - VITE_VAPID_PUBLIC_KEY=${vapidPublic}`);
    console.log(`   - VAPID_PRIVATE_KEY=${vapidPrivate}`);
    console.log(`   - VAPID_SUBJECT=mailto:your-email@example.com`);
    console.log(`   - VITE_PUSH_SERVER_URL=https://your-push-server-url.com`);
    
    console.log('\n📱 Frontend Integration Check...');
    console.log('   Make sure your frontend code:');
    console.log('   1. Has access to VITE_VAPID_PUBLIC_KEY');
    console.log('   2. Can reach the push server URL');
    console.log('   3. Registers service worker correctly');
    console.log('   4. Subscribes user to push notifications');
    
    console.log('\n🎯 Common Issues & Solutions:');
    console.log('   1. "VAPID public key not found" → Update environment variables');
    console.log('   2. "Push server error: 500" → Check push server is running');
    console.log('   3. "Received unexpected response" → Check CORS configuration');
    console.log('   4. Service worker issues → Clear browser cache');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Also create a function to start push server if needed
async function startPushServer() {
  console.log('🚀 Starting Push Server...\n');
  
  try {
    const { spawn } = require('child_process');
    const server = spawn('node', ['push-server.js'], {
      stdio: 'inherit',
      detached: false
    });
    
    server.on('close', (code) => {
      console.log(`Push server exited with code ${code}`);
    });
    
    console.log('✅ Push server started. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('❌ Failed to start push server:', error.message);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--start-server')) {
  startPushServer();
} else {
  testPushNotifications();
}

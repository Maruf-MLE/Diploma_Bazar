// Quick test for push notifications
import fetch from 'node-fetch';

async function testPushServer() {
  console.log('🧪 Testing Push Server...');
  
  try {
    // Test server health
    const healthResponse = await fetch('http://localhost:4000');
    const healthData = await healthResponse.json();
    console.log('✅ Server health:', healthData.message);
    
    // Test subscriptions endpoint
    const subsResponse = await fetch('http://localhost:4000/subscriptions');
    const subsData = await subsResponse.json();
    console.log('📊 Current subscriptions:', subsData.count);
    console.log('👥 User IDs:', subsData.userIds);
    
    if (subsData.count === 0) {
      console.log('⚠️ No subscriptions found. Please:');
      console.log('1. Open your website');
      console.log('2. Login');
      console.log('3. Allow notification permission');
      console.log('4. Check browser console for subscription logs');
    }
    
  } catch (error) {
    console.error('❌ Push server test failed:', error.message);
    console.log('💡 Make sure push server is running on port 4000');
  }
}

testPushServer();

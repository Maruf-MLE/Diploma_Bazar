import dotenv from 'dotenv';
import webpush from 'web-push';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.production' });

console.log('🔍 Push Notification Debug Script');
console.log('==================================');

// Check VAPID keys
console.log('\n📌 VAPID Keys Check:');
console.log('VAPID_PUBLIC_KEY:', process.env.VAPID_PUBLIC_KEY ? '✅ Found' : '❌ Missing');
console.log('VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY ? '✅ Found' : '❌ Missing');
console.log('VITE_VAPID_PUBLIC_KEY:', process.env.VITE_VAPID_PUBLIC_KEY ? '✅ Found' : '❌ Missing');

if (process.env.VAPID_PUBLIC_KEY) {
  console.log('\n📊 VAPID Public Key Details:');
  console.log('Length:', process.env.VAPID_PUBLIC_KEY.length);
  console.log('First 20 chars:', process.env.VAPID_PUBLIC_KEY.substring(0, 20) + '...');
}

// Test VAPID key validity
console.log('\n🧪 Testing VAPID Keys Validity:');
try {
  webpush.setVapidDetails(
    'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ VAPID keys are valid!');
} catch (error) {
  console.error('❌ VAPID keys validation failed:', error.message);
}

// Check push server URL
console.log('\n🌐 Push Server Configuration:');
console.log('VITE_PUSH_SERVER_URL:', process.env.VITE_PUSH_SERVER_URL || 'Not set (will use default)');

// Test subscription format
console.log('\n📦 Testing Subscription Format:');
const testSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys: {
    p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM=',
    auth: 'tBHItJI5svbpez7KI4CCXg=='
  }
};

console.log('Test subscription structure:', JSON.stringify(testSubscription, null, 2));

// Suggest fixes
console.log('\n💡 Troubleshooting Suggestions:');
console.log('1. Make sure you have created .env file with VAPID keys');
console.log('2. Run: npm run generate-vapid (if VAPID keys are missing)');
console.log('3. Check if service worker is registered in Application > Service Workers');
console.log('4. Try in different browser (Chrome/Edge recommended)');
console.log('5. Clear browser cache and unregister old service workers');
console.log('6. Make sure you are on HTTPS or localhost');
console.log('\n📝 To generate new VAPID keys:');
console.log('   node generateVapid.js');

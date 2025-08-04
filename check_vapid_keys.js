import dotenv from 'dotenv';
import webpush from 'web-push';

// Load environment variables
dotenv.config();

console.log('🔍 Checking VAPID configuration...');

const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

console.log('📋 Environment check:');
console.log('VITE_VAPID_PUBLIC_KEY:', publicKey ? 'Present ✅' : 'Missing ❌');
console.log('VAPID_PRIVATE_KEY:', privateKey ? 'Present ✅' : 'Missing ❌');

if (publicKey) {
  console.log('📏 Public Key Length:', publicKey.length);
  console.log('🔍 Public Key (first 20 chars):', publicKey.substring(0, 20) + '...');
}

if (privateKey) {
  console.log('📏 Private Key Length:', privateKey.length);
  console.log('🔍 Private Key (first 20 chars):', privateKey.substring(0, 20) + '...');
}

if (!publicKey || !privateKey) {
  console.log('\n🆕 Generating new VAPID keys...');
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('\n📝 Add these to your .env file:');
  console.log('VITE_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  
  console.log('\n📝 Also add these to your Vercel environment variables for production:');
  console.log('VITE_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
} else {
  console.log('\n✅ VAPID keys are configured correctly!');
  
  try {
    // Test VAPID configuration
    webpush.setVapidDetails(
      'mailto:admin@example.com',
      publicKey,
      privateKey
    );
    console.log('✅ VAPID keys are valid and set successfully!');
  } catch (error) {
    console.error('❌ Error setting VAPID keys:', error.message);
  }
}

console.log('\n🌐 Environment Variables:');
console.log('VITE_PUSH_SERVER_URL:', process.env.VITE_PUSH_SERVER_URL || 'Not set (will use localhost:4000)');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set ✅' : 'Missing ❌');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌');

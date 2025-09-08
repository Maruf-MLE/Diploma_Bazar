// Test Environment Variables
// Run this with: node test-env-vars.js

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Testing Environment Variables...\n');

// Test VAPID keys
console.log('📋 VAPID Keys:');
console.log('- VITE_VAPID_PUBLIC_KEY:', process.env.VITE_VAPID_PUBLIC_KEY ? '✅ Present' : '❌ Missing');
console.log('- VAPID_PRIVATE_KEY:', process.env.VAPID_PRIVATE_KEY ? '✅ Present' : '❌ Missing');

// Test Supabase config
console.log('\n📋 Supabase Configuration:');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Present' : '❌ Missing');
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing');
console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Present' : '❌ Missing');

// Test Push Server config
console.log('\n📋 Push Server Configuration:');
console.log('- VITE_PUSH_SERVER_URL:', process.env.VITE_PUSH_SERVER_URL || '❌ Not set');

console.log('\n🔧 Values (partial for security):');
if (process.env.VITE_VAPID_PUBLIC_KEY) {
    console.log('- VAPID Public Key starts with:', process.env.VITE_VAPID_PUBLIC_KEY.substring(0, 10) + '...');
}
if (process.env.VAPID_PRIVATE_KEY) {
    console.log('- VAPID Private Key starts with:', process.env.VAPID_PRIVATE_KEY.substring(0, 10) + '...');
}

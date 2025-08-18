#!/usr/bin/env node

/**
 * Quick Test Script for Notification System
 * This script tests if notification permissions and VAPID keys are working correctly
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 Notification System Test');
console.log('===========================\n');

// 1. Check environment variables
console.log('📋 Environment Variables Check:');
const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const pushServerUrl = process.env.VITE_PUSH_SERVER_URL;
const supabaseUrl = process.env.VITE_SUPABASE_URL;

console.log('✅ VITE_VAPID_PUBLIC_KEY:', vapidPublic ? 'Present' : '❌ Missing');
console.log('✅ VAPID_PRIVATE_KEY:', vapidPrivate ? 'Present' : '❌ Missing');
console.log('✅ VITE_PUSH_SERVER_URL:', pushServerUrl || 'http://localhost:4000 (default)');
console.log('✅ VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : '❌ Missing');

// 2. VAPID Key validation
if (vapidPublic && vapidPrivate) {
  console.log('\n🔑 VAPID Keys Validation:');
  console.log('Public Key Length:', vapidPublic.length, '(Expected: 87)');
  console.log('Private Key Length:', vapidPrivate.length, '(Expected: 43)');
  
  if (vapidPublic.length === 87 && vapidPrivate.length === 43) {
    console.log('✅ VAPID keys appear to be valid');
  } else {
    console.log('❌ VAPID keys may be invalid (incorrect length)');
  }
}

// 3. Next steps
console.log('\n📝 Next Steps to Test:');
console.log('1. Start development server: npm run dev');
console.log('2. In another terminal, start push server: npm run push-server');
console.log('3. Open browser and check console for "✅ VAPID key found" message');
console.log('4. Login to the app and check if notification permission is requested');

// 4. Common issues and solutions
console.log('\n🔧 Common Issues & Solutions:');
console.log('• If "VAPID public key not found" error persists:');
console.log('  - Restart the development server completely');
console.log('  - Clear browser cache and reload');
console.log('  - Check if .env file is in the root directory');
console.log('');
console.log('• If notification permission is not requested:');
console.log('  - Check browser console for errors');
console.log('  - Make sure you\'re logged in');
console.log('  - Try in a different browser or incognito mode');
console.log('');
console.log('• If using deployed site:');
console.log('  - Make sure environment variables are set in your hosting platform');
console.log('  - Check if the site is served over HTTPS');

console.log('\n🎉 Environment setup complete!');
console.log('If issues persist, check the browser console for detailed error messages.');

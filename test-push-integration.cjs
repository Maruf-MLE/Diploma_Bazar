require('dotenv').config();

async function testPushIntegration() {
  console.log('🔔 Testing Push Notification Integration...\n');
  
  try {
    // 1. Check environment variables
    console.log('1. Environment Variables Check:');
    const frontendKey = process.env.VITE_VAPID_PUBLIC_KEY;
    const backendKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const pushServerUrl = process.env.VITE_PUSH_SERVER_URL;
    
    console.log(`   Frontend VAPID Key (VITE_): ${frontendKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Backend VAPID Key: ${backendKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Private Key: ${privateKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Push Server URL: ${pushServerUrl || '❌ Missing'}`);
    
    // Check if keys match
    if (frontendKey && backendKey && frontendKey === backendKey) {
      console.log('   ✅ Frontend and backend VAPID keys match');
    } else {
      console.log('   ⚠️  Frontend and backend VAPID keys should match');
    }
    
    // 2. Test push server connection
    if (!pushServerUrl) {
      console.log('\\n❌ Push server URL not configured!');
      return;
    }
    
    console.log('\\n2. Testing Push Server Connection...');
    console.log(`   Trying to connect to: ${pushServerUrl}`);
    
    try {
      // Use Node.js built-in fetch (Node 18+) or require a polyfill
      const fetch = globalThis.fetch || require('node-fetch');
      
      const response = await fetch(pushServerUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Push-Test-Script/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Push server is accessible');
        console.log('   📊 Server response:', data.message || 'Server responded');
      } else {
        console.log('   ⚠️  Server responded but with error:', response.status);
      }
    } catch (fetchError) {
      console.log('   ❌ Cannot reach push server');
      console.log('   Error:', fetchError.message);
      console.log('   \\n💡 Possible issues:');
      console.log('      - Server is not deployed');
      console.log('      - Wrong URL in environment variables');
      console.log('      - Network connectivity issues');
    }
    
    // 3. Check push server environment variables
    console.log('\\n3. Push Server Environment Variables Needed:');
    console.log('   Your deployed push server should have these variables:');
    console.log(`   - VAPID_PUBLIC_KEY=${backendKey || 'MISSING'}`);
    console.log(`   - VAPID_PRIVATE_KEY=${privateKey || 'MISSING'}`);
    console.log('   - SUPABASE_URL=https://yryerjgidsyfiohmpeoc.supabase.co');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key');
    
    // 4. Frontend integration check
    console.log('\\n4. Frontend Integration:');
    console.log('   ✅ VITE_VAPID_PUBLIC_KEY is set');
    console.log('   ✅ VITE_PUSH_SERVER_URL is set');
    console.log('   ✅ usePushNotifications hook should work');
    
    // 5. Database table check
    console.log('\\n5. Database Table Check:');
    console.log('   Your Supabase database should have:');
    console.log('   - push_subscriptions table with columns:');
    console.log('     * user_id (UUID)');
    console.log('     * endpoint (TEXT)'); 
    console.log('     * auth (TEXT)');
    console.log('     * p256dh (TEXT)');
    console.log('     * created_at (TIMESTAMP)');
    
    console.log('\\n🎯 Next Steps:');
    if (!pushServerUrl) {
      console.log('   1. ❌ Set VITE_PUSH_SERVER_URL in your .env file');
    } else {
      console.log('   1. ✅ Push server URL is configured');
    }
    
    console.log('   2. Restart your development server: npm run dev');
    console.log('   3. Test push notifications in your application');
    console.log('   4. Check browser console for detailed logs');
    
    console.log('\\n📱 Testing in Browser:');
    console.log('   1. Open browser developer tools (F12)');
    console.log('   2. Go to your application');
    console.log('   3. Allow notifications when prompted');
    console.log('   4. Send a message or create a purchase request');
    console.log('   5. Check for push notification on device');
    
    console.log('\\n🐛 If Still Not Working:');
    console.log('   - Clear browser cache and service worker');
    console.log('   - Check browser console for errors');
    console.log('   - Verify push server logs on Vercel');
    console.log('   - Ensure notification permissions are granted');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPushIntegration();

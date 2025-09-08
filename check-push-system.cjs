require('dotenv').config();

function checkPushNotificationSystem() {
  console.log('🔔 Checking Push Notification System...\n');
  
  // 1. Check environment variables
  console.log('1. Environment Variables Check:');
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  const pushServerUrl = process.env.VITE_PUSH_SERVER_URL;
  
  console.log(`   ✅ VITE_VAPID_PUBLIC_KEY: ${vapidPublic ? 'Set (' + vapidPublic.substring(0, 20) + '...)' : '❌ MISSING'}`);
  console.log(`   ✅ VAPID_PRIVATE_KEY: ${vapidPrivate ? 'Set (' + vapidPrivate.substring(0, 20) + '...)' : '❌ MISSING'}`);
  console.log(`   ${vapidSubject ? '✅' : '⚠️ '} VAPID_SUBJECT: ${vapidSubject || 'Not set (recommended)'}`);
  console.log(`   ✅ VITE_PUSH_SERVER_URL: ${pushServerUrl || 'Default: http://localhost:4000'}`);
  
  // 2. Check if keys are valid
  if (vapidPublic && vapidPrivate) {
    console.log('\n2. VAPID Keys Validation:');
    
    // Basic validation
    if (vapidPublic.length >= 80 && vapidPrivate.length >= 40) {
      console.log('   ✅ Keys appear to be valid length');
    } else {
      console.log('   ❌ Keys appear to be invalid length');
    }
    
    if (vapidPublic.startsWith('B') && !vapidPublic.includes(' ')) {
      console.log('   ✅ Public key format looks correct');
    } else {
      console.log('   ❌ Public key format may be incorrect');
    }
  } else {
    console.log('\n❌ VAPID keys are missing! Cannot proceed.');
    console.log('\n🔧 To fix this:');
    console.log('1. Use the generated VAPID keys from earlier');
    console.log('2. Update your .env file');
    console.log('3. For production, add these to your hosting platform environment variables');
    return;
  }
  
  // 3. Check push server file
  console.log('\n3. Push Server File Check:');
  const fs = require('fs');
  
  if (fs.existsSync('push-server.js')) {
    console.log('   ✅ push-server.js found');
    
    // Check if server uses correct environment variables
    const serverContent = fs.readFileSync('push-server.js', 'utf8');
    if (serverContent.includes('VITE_VAPID_PUBLIC_KEY') && serverContent.includes('VAPID_PRIVATE_KEY')) {
      console.log('   ✅ Server configured to use VAPID environment variables');
    } else {
      console.log('   ⚠️  Server may not be using correct VAPID variables');
    }
  } else {
    console.log('   ❌ push-server.js not found');
  }
  
  // 4. Production deployment guidance
  console.log('\n4. Production Deployment Checklist:');
  console.log('   □ VAPID keys added to production environment variables');
  console.log('   □ Push server deployed and accessible');
  console.log('   □ CORS configured for your production domain');
  console.log('   □ VITE_PUSH_SERVER_URL points to production push server');
  console.log('   □ Service worker registered properly');
  
  console.log('\n🎯 Your Generated Environment Variables:');
  console.log('   For production deployment, add these to your hosting platform:');
  console.log(`   VITE_VAPID_PUBLIC_KEY=${vapidPublic}`);
  console.log(`   VAPID_PRIVATE_KEY=${vapidPrivate}`);
  console.log(`   VAPID_SUBJECT=mailto:your-email@example.com`);
  console.log(`   VITE_PUSH_SERVER_URL=https://your-push-server-url.com`);
  
  console.log('\n📱 Common Deployment Platforms:');
  console.log('   Vercel: Project Settings → Environment Variables');
  console.log('   Netlify: Site Settings → Build & Deploy → Environment Variables');  
  console.log('   Heroku: Config Vars in app dashboard');
  console.log('   Railway: Variables tab in project dashboard');
  
  console.log('\n🚀 Next Steps:');
  console.log('   1. Add environment variables to your production platform');
  console.log('   2. Deploy/restart your application');
  console.log('   3. Test push notifications on production');
  console.log('   4. Check browser console for any remaining errors');
  
  console.log('\n✅ Environment check completed!');
}

checkPushNotificationSystem();

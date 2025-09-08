const webpush = require('web-push');

function generateVAPIDKeys() {
  console.log('🔑 Generating VAPID Keys for Push Notifications...\n');
  
  try {
    // Generate VAPID keys
    const vapidKeys = webpush.generateVAPIDKeys();
    
    console.log('✅ VAPID Keys Generated Successfully!\n');
    console.log('📋 Copy these keys to your environment files:\n');
    
    console.log('🔸 For .env file (Development):');
    console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    
    console.log('\n🔸 For Production (Vercel/Netlify):');
    console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    
    console.log('\n📧 Contact Information (for VAPID):');
    console.log('VAPID_SUBJECT=mailto:your-email@example.com');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Update your .env file with these keys');
    console.log('2. Update your production environment variables');
    console.log('3. Restart your development server');
    console.log('4. Redeploy your application');
    
    console.log('\n⚠️  Important Notes:');
    console.log('- Keep the private key secure and never expose it publicly');
    console.log('- The public key goes in VITE_ variables (accessible to frontend)');
    console.log('- The private key is for server-side only');
    
    // Write to a file for easy copying
    const fs = require('fs');
    const envContent = `
# VAPID Keys for Push Notifications
VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_SUBJECT=mailto:your-email@example.com
`;
    
    fs.writeFileSync('vapid-keys.txt', envContent);
    console.log('\n💾 Keys also saved to vapid-keys.txt file');
    
  } catch (error) {
    console.error('❌ Error generating VAPID keys:', error.message);
    console.log('\n🔧 If web-push is not installed, run:');
    console.log('npm install web-push');
  }
}

generateVAPIDKeys();

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing push notifications for production...\n');

// Check if .env.production exists
const envPath = path.join(__dirname, '.env.production');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.production file not found!');
  console.log('Please create .env.production with your production environment variables.');
  process.exit(1);
}

// Read .env.production
const envContent = fs.readFileSync(envPath, 'utf8');
console.log('📄 Current .env.production content:');
console.log('=====================================');
console.log(envContent);
console.log('=====================================\n');

// Check for required variables
const requiredVars = [
  'VITE_VAPID_PUBLIC_KEY',
  'VITE_PUSH_SERVER_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const missingVars = [];
requiredVars.forEach(varName => {
  if (!envContent.includes(varName)) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.log('\nPlease add these variables to your .env.production file.');
  process.exit(1);
}

// Create placeholder icons if they don't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  console.log('📁 Creating icons directory...');
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Check for icon files
const iconFiles = ['icon-192.png', 'icon-512.png'];
const missingIcons = [];

iconFiles.forEach(iconFile => {
  const iconPath = path.join(iconsDir, iconFile);
  if (!fs.existsSync(iconPath)) {
    missingIcons.push(iconFile);
  }
});

if (missingIcons.length > 0) {
  console.log('\n⚠️  Missing icon files:');
  missingIcons.forEach(icon => console.log(`   - /icons/${icon}`));
  console.log('\n📝 Instructions to create icons:');
  console.log('1. Open the file: public/icons/generate-icons.html in your browser');
  console.log('2. Click the "Generate Icons" button');
  console.log('3. Download both icon files and save them in public/icons/');
  console.log('4. Or use any image editor to create 192x192 and 512x512 PNG files\n');
}

// Check service worker registration
console.log('\n🔍 Checking service worker setup...');

const swPath = path.join(__dirname, 'public', 'service-worker.js');
if (!fs.existsSync(swPath)) {
  console.error('❌ service-worker.js not found in public directory!');
  process.exit(1);
} else {
  console.log('✅ service-worker.js found');
}

// Check if push server URL is HTTPS in production
const pushServerUrlMatch = envContent.match(/VITE_PUSH_SERVER_URL=(.+)/);
if (pushServerUrlMatch) {
  const pushServerUrl = pushServerUrlMatch[1].trim();
  console.log(`\n🌐 Push server URL: ${pushServerUrl}`);
  
  if (pushServerUrl.includes('localhost') || pushServerUrl.includes('127.0.0.1')) {
    console.warn('⚠️  WARNING: Push server URL is set to localhost!');
    console.warn('   This will NOT work in production.');
    console.warn('   Please deploy your push server and update VITE_PUSH_SERVER_URL.');
  } else if (!pushServerUrl.startsWith('https://')) {
    console.warn('⚠️  WARNING: Push server URL is not using HTTPS!');
    console.warn('   Push notifications require HTTPS in production.');
  } else {
    console.log('✅ Push server URL looks good for production');
  }
}

console.log('\n📋 Production Deployment Checklist:');
console.log('=====================================');
console.log('1. ✅ Environment variables are set in .env.production');
console.log('2. ' + (missingIcons.length === 0 ? '✅' : '❌') + ' Icon files exist in public/icons/');
console.log('3. ✅ Service worker file exists');
console.log('4. ' + (pushServerUrlMatch && !pushServerUrlMatch[1].includes('localhost') ? '✅' : '❌') + ' Push server URL is set to production server');
console.log('5. 📝 Deploy push server to a cloud platform (Vercel, Railway, etc.)');
console.log('6. 📝 Update VITE_PUSH_SERVER_URL with deployed server URL');
console.log('7. 📝 Build project with: npm run build:prod');
console.log('8. 📝 Deploy to Vercel/Netlify with production environment variables');

console.log('\n🚀 Next Steps:');
console.log('=====================================');
console.log('1. Fix any issues mentioned above');
console.log('2. Build for production: npm run build:prod');
console.log('3. Deploy to your hosting platform');
console.log('4. Test push notifications on the deployed site');

console.log('\n💡 Troubleshooting Tips:');
console.log('=====================================');
console.log('- Clear browser cache and service worker cache');
console.log('- Check browser console for errors');
console.log('- Ensure HTTPS is enabled on your production site');
console.log('- Test in multiple browsers (Chrome, Firefox, Edge)');
console.log('- Check push server logs for subscription errors');

console.log('\n✅ Script completed!');

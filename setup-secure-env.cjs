#!/usr/bin/env node

// Quick Security Setup Script for বই-চাপা-বাজার
// This script helps you generate secure environment variables

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const generateSecureKey = (length) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateJWTSecret = () => {
  return 'DiplomaBazar2025-' + crypto.randomBytes(32).toString('hex');
};

const generateAPIKey = (prefix) => {
  return `${prefix}-${crypto.randomBytes(20).toString('hex')}`;
};

const createSecureEnv = () => {
  console.log('🔒 DIPLOMA BAZAR SECURITY SETUP');
  console.log('================================\n');

  // Check if .env already exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    console.log('   Backup your current .env file before proceeding.\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Do you want to create a new .env file? (y/N): ', (answer) => {
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Setup cancelled.');
        rl.close();
        return;
      }
      rl.close();
      generateEnvFile();
    });
  } else {
    generateEnvFile();
  }
};

const generateEnvFile = () => {
  console.log('🔑 Generating secure keys...\n');

  const jwtSecret = generateJWTSecret();
  const apiKey1 = generateAPIKey('prod-DiplomaBazar');
  const apiKey2 = generateAPIKey('client-DiplomaBazar'); 
  const apiKey3 = generateAPIKey('mobile-DiplomaBazar');

  const envContent = `# Environment Variables for বই-চাপা-বাজার
# Generated on ${new Date().toISOString()}
# 🔒 NEVER commit this file to git

# Supabase Configuration
# Get these from https://supabase.com/dashboard -> Your Project -> API
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend Supabase Configuration (Server-side only)
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key-KEEP-THIS-SECRET

# Google OAuth Configuration
# Get from https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret-KEEP-THIS-SECRET

# Push Notification VAPID Keys
# Generate with: npx web-push generate-vapid-keys
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key-KEEP-THIS-SECRET

# Push Server Configuration
VITE_PUSH_SERVER_URL=http://localhost:4000
PUSH_PORT=4000

# Secure JWT Secret (GENERATED)
JWT_SECRET=${jwtSecret}

# API Keys (GENERATED)
API_KEY_1=${apiKey1}
API_KEY_2=${apiKey2}
API_KEY_3=${apiKey3}

# WebRTC Configuration
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302

# Environment
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
`;

  // Write .env file
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('✅ Generated secure .env file!');
  console.log('📝 Keys generated:');
  console.log(`   JWT_SECRET: ${jwtSecret.substring(0, 20)}...`);
  console.log(`   API_KEY_1: ${apiKey1.substring(0, 20)}...`);
  console.log(`   API_KEY_2: ${apiKey2.substring(0, 20)}...`);
  console.log(`   API_KEY_3: ${apiKey3.substring(0, 20)}...`);
  
  console.log('\n📋 Next Steps:');
  console.log('1. Edit .env file and add your actual Supabase keys');
  console.log('2. Add your Google OAuth credentials');  
  console.log('3. Generate VAPID keys: npx web-push generate-vapid-keys');
  console.log('4. Test your application: npm run dev');
  console.log('5. For production, set these in your hosting platform');
  
  console.log('\n🔒 Security Notes:');
  console.log('- Never commit .env files to git');
  console.log('- Use different keys for production');
  console.log('- Keep SERVICE_KEY and VAPID_PRIVATE_KEY secret');
  
  console.log('\n📖 Read SECURITY_SETUP.md for complete instructions');
};

const displayHelp = () => {
  console.log('🔒 DIPLOMA BAZAR SECURITY SETUP');
  console.log('================================\n');
  console.log('Usage: node setup-secure-env.cjs [command]\n');
  console.log('Commands:');
  console.log('  setup    Generate .env file with secure keys');
  console.log('  keys     Generate new API keys only');
  console.log('  jwt      Generate new JWT secret only');
  console.log('  help     Show this help message\n');
};

const generateKeysOnly = () => {
  console.log('🔑 Generating new API keys...\n');
  
  console.log('JWT_SECRET=' + generateJWTSecret());
  console.log('API_KEY_1=' + generateAPIKey('prod-DiplomaBazar'));
  console.log('API_KEY_2=' + generateAPIKey('client-DiplomaBazar'));
  console.log('API_KEY_3=' + generateAPIKey('mobile-DiplomaBazar'));
  console.log('\n🔒 Copy these to your .env file');
};

const generateJWTOnly = () => {
  console.log('🔑 Generating new JWT secret...\n');
  console.log('JWT_SECRET=' + generateJWTSecret());
  console.log('\n🔒 Copy this to your .env file');
};

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'setup':
  case undefined:
    createSecureEnv();
    break;
  case 'keys':
    generateKeysOnly();
    break;
  case 'jwt':
    generateJWTOnly();
    break;
  case 'help':
  case '--help':
  case '-h':
    displayHelp();
    break;
  default:
    console.log(`❌ Unknown command: ${command}`);
    displayHelp();
    process.exit(1);
}

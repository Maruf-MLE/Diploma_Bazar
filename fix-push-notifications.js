#!/usr/bin/env node

/**
 * Quick Fix Script for Push Notifications
 * This script helps you set up push notifications correctly
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Push Notification Fix Script');
console.log('================================');

// Check if we're in the right directory
const packageJsonPath = './package.json';
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

// Read current .env file
const envPath = './.env';
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found .env file');
} else {
  console.log('⚠️  No .env file found, creating one...');
}

// Check current environment
const currentUrl = envContent.match(/VITE_PUSH_SERVER_URL=(.+)/)?.[1];
console.log('Current push server URL:', currentUrl || 'Not set');

// Detect environment
const isProduction = process.argv.includes('--production');
const isDevelopment = !isProduction;

console.log('\n🔍 Environment Detection:');
console.log('Mode:', isProduction ? 'Production' : 'Development');

if (isDevelopment) {
  console.log('\n🛠️  Setting up for DEVELOPMENT...');
  
  // Update .env for development
  let newEnvContent = envContent;
  
  // Ensure localhost URL for development
  if (currentUrl && !currentUrl.includes('localhost')) {
    newEnvContent = newEnvContent.replace(
      /VITE_PUSH_SERVER_URL=.+/,
      'VITE_PUSH_SERVER_URL=http://localhost:4000'
    );
    console.log('✅ Updated push server URL to localhost');
  } else if (!currentUrl) {
    newEnvContent += '\nVITE_PUSH_SERVER_URL=http://localhost:4000\n';
    console.log('✅ Added localhost push server URL');
  } else {
    console.log('✅ Push server URL already set for development');
  }
  
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('\n📋 Development Setup Complete!');
  console.log('Next steps:');
  console.log('1. Start push server: npm run push-server');
  console.log('2. In another terminal, start dev server: npm run dev');
  console.log('3. Open browser and test notifications');
  
} else {
  console.log('\n🚀 Setting up for PRODUCTION...');
  
  // Check if .env.production exists
  const envProdPath = './.env.production';
  if (!fs.existsSync(envProdPath)) {
    console.log('⚠️  No .env.production file found');
    console.log('📝 Creating .env.production template...');
    
    const prodEnvTemplate = `VITE_SUPABASE_URL=https://yryerjgidsyfiohmpeoc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno

SUPABASE_URL=https://yryerjgidsyfiohmpeoc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno

VAPID_PUBLIC_KEY=BMWlkGwjh9HwFaWD8wUL6jf4BpqQ61OXRoavNxSjdFuLreGQ48Eh1gupEJfVyVR56R7SEjI7VREkHBhucAirFN4
VAPID_PRIVATE_KEY=WKpz4O_qDPiaoBYqlkljRG4cd--3E5DXqum19jMO5BI
VITE_VAPID_PUBLIC_KEY=BMWlkGwjh9HwFaWD8wUL6jf4BpqQ61OXRoavNxSjdFuLreGQ48Eh1gupEJfVyVR56R7SEjI7VREkHBhucAirFN4

# IMPORTANT: Replace this with your deployed push server URL
VITE_PUSH_SERVER_URL=https://your-push-server.onrender.com

NODE_ENV=production`;
    
    fs.writeFileSync(envProdPath, prodEnvTemplate);
    console.log('✅ Created .env.production template');
  }
  
  console.log('\n📋 Production Setup Instructions:');
  console.log('1. Deploy your push server to a cloud platform (Railway, Render, etc.)');
  console.log('2. Update VITE_PUSH_SERVER_URL in .env.production with your deployed URL');
  console.log('3. Update CORS configuration in push-server.js with your production domain');
  console.log('4. Build for production: npm run build:prod');
  console.log('5. Deploy your built files');
  console.log('\n📖 Read PUSH_SERVER_DEPLOYMENT.md for detailed instructions');
}

console.log('\n🎉 Script completed!');

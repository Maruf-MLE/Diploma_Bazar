// API Keys and JWT Secret Generator
// Run this script to generate secure keys for your application

const crypto = require('crypto');

// Generate a secure random string
const generateSecureKey = (length, prefix = '') => {
  const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
  const randomString = randomBytes.toString('hex').substring(0, length);
  return prefix + randomString;
};

// Generate API Keys
const generateAPIKeys = () => {
  console.log('🔑 Generating Secure API Keys for Diploma Bazar\n');
  
  const keys = {
    // Production API Key (for main application)
    API_KEY_1: generateSecureKey(40, 'prod-DiplomaBazar-'),
    
    // Client API Key (for frontend/web clients)
    API_KEY_2: generateSecureKey(40, 'client-DiplomaBazar-'),
    
    // Mobile API Key (for mobile app, if any)
    API_KEY_3: generateSecureKey(40, 'mobile-DiplomaBazar-'),
    
    // JWT Secret (minimum 64 characters for security)
    JWT_SECRET: generateSecureKey(64, 'DiplomaBazar2025-JWT-')
  };
  
  return keys;
};

// Main function
const main = () => {
  const keys = generateAPIKeys();
  
  console.log('📝 Copy these to your .env files:\n');
  console.log('# Local Development .env');
  console.log(`API_KEY_1=${keys.API_KEY_1}`);
  console.log(`API_KEY_2=${keys.API_KEY_2}`);
  console.log(`API_KEY_3=${keys.API_KEY_3}`);
  console.log(`JWT_SECRET=${keys.JWT_SECRET}`);
  
  console.log('\n# Production Environment Variables');
  console.log(`API_KEY_1=${keys.API_KEY_1}`);
  console.log(`API_KEY_2=${keys.API_KEY_2}`);
  console.log(`API_KEY_3=${keys.API_KEY_3}`);
  console.log(`JWT_SECRET=${keys.JWT_SECRET}`);
  
  console.log('\n🔐 Key Usage:');
  console.log(`API_KEY_1: Main production API key for server-to-server communication`);
  console.log(`API_KEY_2: Client-side API key for frontend applications`);
  console.log(`API_KEY_3: Mobile app API key (if you have a mobile app)`);
  console.log(`JWT_SECRET: Secret for signing and verifying JWT tokens`);
  
  console.log('\n⚠️  Security Notes:');
  console.log('- Never commit these keys to version control');
  console.log('- Use different keys for development and production');
  console.log('- Store them securely in your deployment platform');
  console.log('- Rotate keys periodically for better security');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Copy the keys to your .env file');
  console.log('2. Add them to your deployment platform environment variables');
  console.log('3. Update your frontend code to use API_KEY_2');
  console.log('4. Test the rate limiting system');
};

// Validation function
const validateKeys = (keys) => {
  const issues = [];
  
  Object.entries(keys).forEach(([name, key]) => {
    if (name.startsWith('API_KEY') && key.length < 32) {
      issues.push(`${name} is too short (minimum 32 characters required)`);
    }
    if (name === 'JWT_SECRET' && key.length < 64) {
      issues.push(`${name} is too short (minimum 64 characters required)`);
    }
  });
  
  return issues;
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateAPIKeys, generateSecureKey, validateKeys };

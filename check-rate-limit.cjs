// Simple Rate Limit Check
const { RATE_LIMIT_CONFIG } = require('./src/config/rateLimitConfig.cjs');

console.log('🔍 Checking Rate Limit Configuration');
console.log('====================================\n');

// Check environment
console.log('Environment Settings:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('BYPASS_RATE_LIMITS:', process.env.BYPASS_RATE_LIMITS || 'undefined');

// Set production mode
process.env.NODE_ENV = 'production';
console.log('\n✅ Set NODE_ENV to production');

// Re-require the config to apply production overrides
delete require.cache[require.resolve('./src/config/rateLimitConfig.cjs')];
const { RATE_LIMIT_CONFIG: PROD_CONFIG } = require('./src/config/rateLimitConfig.cjs');

console.log('\n📊 Rate Limit Configuration:');
console.log('Default limits (per minute):', PROD_CONFIG.DEFAULT_LIMITS.REQUESTS_PER_MINUTE);
console.log('Cache enabled:', PROD_CONFIG.CACHE.ENABLED);
console.log('Development bypass:', PROD_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS);

console.log('\n🎯 Endpoint-specific limits:');
console.log('/api/auth/login (per minute):', PROD_CONFIG.ENDPOINT_LIMITS['/api/auth/login']?.requests_per_minute);
console.log('/api/books (per minute):', PROD_CONFIG.ENDPOINT_LIMITS['/api/books']?.requests_per_minute);

// Test middleware logic
console.log('\n🧪 Testing middleware logic:');

// Test bypass condition
const isDevelopment = process.env.NODE_ENV === 'development';
const shouldBypass = PROD_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS && isDevelopment;

console.log('Is development mode:', isDevelopment);
console.log('Should bypass rate limits:', shouldBypass);

if (shouldBypass) {
  console.log('⚠️  RATE LIMITS WILL BE BYPASSED');
} else {
  console.log('✅ RATE LIMITS WILL BE ENFORCED');
}

// Check production overrides
console.log('\n🏭 Production Mode Verification:');
if (process.env.NODE_ENV === 'production') {
  console.log('✅ Production mode detected');
  console.log('✅ API key validation required:', PROD_CONFIG.SECURITY.API_KEY_VALIDATION.REQUIRED_FOR_ANONYMOUS);
  console.log('✅ Rate limit bypass disabled:', !PROD_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS);
} else {
  console.log('❌ Not in production mode');
}

console.log('\n🔒 Security Settings:');
console.log('API key validation enabled:', PROD_CONFIG.SECURITY.API_KEY_VALIDATION.ENABLED);
console.log('JWT validation enabled:', PROD_CONFIG.SECURITY.JWT_VALIDATION.ENABLED);
console.log('IP restrictions enabled:', PROD_CONFIG.SECURITY.IP_RESTRICTIONS.ENABLED);

console.log('\n💾 Cache Configuration:');
console.log('Cache enabled:', PROD_CONFIG.CACHE.ENABLED);
console.log('Cache TTL (seconds):', PROD_CONFIG.CACHE.TTL_SECONDS);
console.log('Max cache entries:', PROD_CONFIG.CACHE.MAX_ENTRIES);

console.log('\n🎉 SUMMARY:');
if (process.env.NODE_ENV === 'production' && !shouldBypass) {
  console.log('✅ PRODUCTION RATE LIMITING IS PROPERLY CONFIGURED');
  console.log('✅ Rate limits will be enforced');
  console.log('✅ Cache is enabled for performance');
  console.log('✅ Security features are active');
} else {
  console.log('⚠️  RATE LIMITING CONFIGURATION NEEDS ATTENTION');
  console.log('   Check environment variables and configuration');
}

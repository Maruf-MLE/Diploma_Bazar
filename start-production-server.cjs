#!/usr/bin/env node

/**
 * Start server in production mode
 */

// Set production environment variables
process.env.NODE_ENV = 'production';
process.env.BYPASS_RATE_LIMITS = 'false';

console.log('🚀 Starting server in PRODUCTION mode');
console.log('Environment variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  BYPASS_RATE_LIMITS:', process.env.BYPASS_RATE_LIMITS);
console.log('');

// Load and start the server
require('./start-server.cjs');

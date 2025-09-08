// Generate Secure JWT Secret
const crypto = require('crypto');

// Generate different types of secrets
console.log('🔐 JWT Secret Generator\n');
console.log('=' .repeat(60));

// Option 1: Simple random hex (recommended)
const secret1 = crypto.randomBytes(64).toString('hex');
console.log('Option 1 - Random Hex (128 chars):');
console.log(`JWT_SECRET=${secret1}`);
console.log();

// Option 2: With prefix
const secret2 = 'DiplomaBazar-' + crypto.randomBytes(48).toString('hex');
console.log('Option 2 - With Prefix:');
console.log(`JWT_SECRET=${secret2}`);
console.log();

// Option 3: Base64 encoded
const secret3 = crypto.randomBytes(64).toString('base64');
console.log('Option 3 - Base64:');
console.log(`JWT_SECRET=${secret3}`);
console.log();

// Option 4: UUID style
const uuid = crypto.randomUUID();
const randomPart = crypto.randomBytes(32).toString('hex');
const secret4 = `${uuid}-${randomPart}`;
console.log('Option 4 - UUID Style:');
console.log(`JWT_SECRET=${secret4}`);
console.log();

console.log('=' .repeat(60));
console.log('✅ Copy any of the above and use in your .env file');
console.log('⚠️  IMPORTANT: Use the SAME secret across all environments');
console.log('🔒 NEVER share or commit this secret to public repositories!');

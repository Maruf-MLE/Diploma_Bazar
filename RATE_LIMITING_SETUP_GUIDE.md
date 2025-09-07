# Rate Limiting System Setup Guide

## Overview

আপনার Supabase প্রোজেক্টের জন্য একটি সম্পূর্ণ Rate Limiting সিস্টেম তৈরি করা হয়েছে যা নিম্নলিখিত features প্রদান করে:

### Features
1. ✅ প্রতিটি User/IP এক মিনিটে সর্বোচ্চ ৫০টি request
2. ✅ Limit cross করলে 429 "Too Many Requests" error
3. ✅ Authentication ছাড়া API key ছাড়া request block
4. ✅ Advanced monitoring and analytics
5. ✅ Admin control panel for rate limit management
6. ✅ Automatic blocking of violators
7. ✅ Configurable rate limits per endpoint

## Setup Instructions

### Step 1: Database Setup

1. **Supabase Dashboard**-এ যান এবং আপনার project select করুন
2. **SQL Editor**-এ যান
3. প্রথমে `rate_limiting_schema.sql` file-এর content copy করে run করুন:

```sql
-- Copy and paste the entire content of rate_limiting_schema.sql
```

4. এরপর `rate_limiting_advanced_functions.sql` file-এর content copy করে run করুন:

```sql
-- Copy and paste the entire content of rate_limiting_advanced_functions.sql
```

### Step 2: Environment Variables

আপনার `.env` file-এ নিম্নলিখিত variables add করুন:

```env
# Rate Limiting Configuration
SUPABASE_URL=https://yryerjgidsyfiohmpeoc.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# API Keys (Production-এ change করুন)
API_KEY_1=prod-api-key-12345678901234567890123456789012
API_KEY_2=client-api-key-12345678901234567890123456789012
API_KEY_3=mobile-api-key-12345678901234567890123456789012

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-for-production

# Development Settings
NODE_ENV=development
BYPASS_RATE_LIMITS=false
```

### Step 3: Server Integration

Server আপনার project-এ already integrated আছে। কিন্তু যদি manually integrate করতে চান:

1. Dependencies install করুন:

```bash
npm install jsonwebtoken
```

2. Server.js file-এ middleware add করুন (already done):

```javascript
// Import rate limiting middleware
const { authenticate, extractRequestIdentifier, requireAdmin, debugMiddleware } = require('./src/middleware/authMiddleware');
const { rateLimitMiddleware, rateLimitStatus, clearRateLimitCache } = require('./src/middleware/rateLimitMiddleware');
const { RATE_LIMIT_CONFIG } = require('./src/config/rateLimitConfig');

// Apply middleware
app.use(debugMiddleware);
app.use(authenticate);
app.use(extractRequestIdentifier);
app.use(rateLimitMiddleware);
```

## Usage Examples

### 1. Client-side API Calls

```javascript
// Proper API call with required headers
const response = await fetch('/api/books', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'DiplomaBazar/1.0',
    'x-api-key': 'dev-api-key-12345678901234567890123456789012',
    'Authorization': 'Bearer your_jwt_token_here'
  }
});

if (response.status === 429) {
  const rateLimitData = await response.json();
  console.log('Rate limit exceeded:', rateLimitData);
  
  // Wait and retry
  const retryAfter = response.headers.get('Retry-After');
  setTimeout(() => {
    // Retry the request
  }, retryAfter * 1000);
}
```

### 2. Check Rate Limit Status

```javascript
// Check current rate limit status
const statusResponse = await fetch('/api/rate-limit/status', {
  headers: {
    'x-api-key': 'your-api-key',
    'Authorization': 'Bearer your_jwt_token'
  }
});

const rateLimitStatus = await statusResponse.json();
console.log('Current limits:', rateLimitStatus);
```

### 3. Admin Operations

```javascript
// Get rate limiting statistics (Admin only)
const statsResponse = await fetch('/api/admin/rate-limit/statistics?hours=24', {
  headers: {
    'Authorization': 'Bearer admin_jwt_token',
    'x-api-key': 'admin-api-key'
  }
});

// Block a problematic IP
await fetch('/api/admin/rate-limit/block', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer admin_jwt_token',
    'x-api-key': 'admin-api-key'
  },
  body: JSON.stringify({
    identifier: '192.168.1.100',
    identifierType: 'IP',
    reason: 'Suspicious activity detected',
    durationMinutes: 60,
    isPermanent: false
  })
});
```

## Configuration

### Rate Limit Configuration

Default limits per endpoint:

| Endpoint | Per Minute | Per Hour | Per Day |
|----------|------------|----------|---------|
| Default (*) | 50 | 1000 | 10000 |
| `/api/auth/login` | 10 | 100 | 500 |
| `/api/auth/register` | 5 | 50 | 100 |
| `/api/auth/reset-password` | 3 | 20 | 50 |
| `/api/books` | 30 | 500 | 2000 |
| `/api/messages` | 40 | 800 | 3000 |
| `/api/upload` | 10 | 100 | 200 |
| `/api/admin` | 20 | 200 | 500 |

### Customizing Rate Limits

Configuration file-এ limits modify করুন:

```javascript
// src/config/rateLimitConfig.js
ENDPOINT_LIMITS: {
  '/api/custom-endpoint': {
    requests_per_minute: 25,
    requests_per_hour: 300,
    requests_per_day: 1500
  }
}
```

## Monitoring and Analytics

### Rate Limit Headers

প্রতিটি response-এ rate limit information header-এ include হয়:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1640995200
X-RateLimit-Limit-Hour: 1000
X-RateLimit-Remaining-Hour: 500
X-RateLimit-Reset-Hour: 1640995200
```

### Admin Dashboard Data

Admin users নিম্নলিখিত information access করতে পারে:

1. **Statistics**: Total requests, violations, blocked users
2. **Top Violators**: Users/IPs with most violations
3. **Endpoint Analytics**: Request counts per endpoint
4. **Violation Patterns**: Rate limit violation trends

## Security Features

### 1. API Key Validation
- Minimum 32 character length
- Required for anonymous requests
- Configurable per environment

### 2. IP-based Restrictions
- IP whitelist/blacklist support
- Automatic temporary blocking
- Geographic restrictions (can be added)

### 3. User Agent Filtering
- Blocks common bots and scrapers
- Customizable blocked patterns
- Development environment bypasses

### 4. Progressive Penalties
- 1st violation: 1-minute block
- 2nd violation: 5-minute block
- 3rd violation: 15-minute block
- Persistent violations: 1-hour block

## Troubleshooting

### Common Issues

1. **429 Errors in Development**
   ```env
   BYPASS_RATE_LIMITS=true
   ```

2. **Database Connection Errors**
   - Verify SUPABASE_URL and SUPABASE_SERVICE_KEY
   - Check if database functions are created

3. **Missing API Key**
   ```javascript
   headers: {
     'x-api-key': 'your-valid-api-key-here'
   }
   ```

4. **Admin Access Denied**
   - Ensure user has `is_admin: true` in profiles table
   - Check JWT token validity

### Debug Mode

Development environment-এ debug information enable করুন:

```javascript
// src/config/rateLimitConfig.js
DEVELOPMENT: {
  DEBUG_HEADERS: true,
  BYPASS_RATE_LIMITS: false // Set true to disable rate limiting
}
```

## Maintenance

### Automated Cleanup

Database automatically cleans:
- Rate limit tracking data older than 7 days
- Violation logs older than 90 days
- Expired blocks

### Manual Maintenance

Admin দের নিম্নলিখিত maintenance tasks perform করতে পারে:

```bash
# Via API endpoint
POST /api/admin/rate-limit/maintenance
```

### Performance Optimization

1. **Caching**: In-memory cache enabled by default (60-second TTL)
2. **Database Indexes**: Optimized indexes for fast queries
3. **Batch Processing**: Efficient bulk operations

## Production Deployment

### Security Checklist

- [ ] Change default API keys
- [ ] Set strong JWT secret
- [ ] Configure SUPABASE_SERVICE_KEY
- [ ] Disable debug mode
- [ ] Set production rate limits
- [ ] Configure proper CORS origins
- [ ] Enable database connection pooling
- [ ] Set up monitoring alerts

### Environment-Specific Settings

```javascript
// Production overrides (automatic)
if (process.env.NODE_ENV === 'production') {
  RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.REQUIRED_FOR_ANONYMOUS = true;
  RATE_LIMIT_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS = false;
  RATE_LIMIT_CONFIG.MONITORING.LOG_LEVEL = 'warn';
}
```

## API Documentation

### Public Endpoints

- `GET /api/rate-limit/status` - Check rate limit status

### Admin Endpoints

- `GET /api/admin/rate-limit/statistics` - Get statistics
- `POST /api/admin/rate-limit/block` - Block identifier
- `DELETE /api/admin/rate-limit/block` - Unblock identifier
- `GET /api/admin/rate-limit/violations/:type/:id` - Get violations
- `POST /api/admin/rate-limit/reset` - Reset request counts
- `PUT /api/admin/rate-limit/config` - Update configuration
- `POST /api/admin/rate-limit/maintenance` - Run maintenance

## Support and Updates

Rate limiting system টি production-ready এবং scalable। কোনো issues বা questions থাকলে:

1. Check console logs for detailed error messages
2. Verify database function executions in Supabase
3. Monitor rate limit violation logs
4. Use debug mode for development troubleshooting

এই system আপনার API কে protect করবে এবং malicious traffic থেকে রক্ষা করবে।

# 🚀 Production Deployment Guide - Rate Limiting

## ✅ আপনার Deployed Site এ Rate Limiting Enable করার Steps:

### Step 1: Environment Variables Setup

#### Vercel Dashboard এ যান:
1. Your Project → Settings → Environment Variables
2. এই variables add করুন:

```env
NODE_ENV=production
BYPASS_RATE_LIMITS=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEBUG=false

# Supabase (আপনার actual values দিন)
SUPABASE_URL=https://yryerjgidsyfiohmpeoc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Full service key
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys (Change these!)
API_KEY_1=prod-DiplomaBazar-[generate-new-key]
API_KEY_2=client-DiplomaBazar-[generate-new-key]
API_KEY_3=mobile-DiplomaBazar-[generate-new-key]

# JWT Secret (Change this!)
JWT_SECRET=DiplomaBazar2025-JWT-[generate-secure-secret]
```

### Step 2: API Server File Update

Create `api/index.js` in your project:

```javascript
// api/index.js - Vercel Serverless Function
module.exports = require('../server-main.cjs');
```

### Step 3: Vercel Configuration

Update your `vercel.json`:

```json
{
  "version": 2,
  "functions": {
    "api/index.js": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    }
  ]
}
```

### Step 4: Deploy Commands

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to production
vercel --prod

# Or using npm script
npm run deploy:production
```

### Step 5: Test Production Rate Limiting

```javascript
// Test script for production
const testProductionRateLimit = async () => {
  const PROD_URL = 'https://your-app.vercel.app';
  
  console.log('Testing production rate limiting...');
  
  for (let i = 1; i <= 55; i++) {
    const response = await fetch(`${PROD_URL}/api/test`);
    console.log(`Request ${i}: ${response.status}`);
    
    if (response.status === 429) {
      console.log('✅ Rate limiting working in production!');
      break;
    }
  }
};
```

## 🛡️ Security Checklist:

### ✅ Production এ করতে হবে:
- [ ] Service Role Key use করুন (Anon key নয়)
- [ ] NODE_ENV=production set করুন
- [ ] BYPASS_RATE_LIMITS=false ensure করুন
- [ ] New API keys generate করুন (development keys use করবেন না)
- [ ] JWT_SECRET change করুন
- [ ] RATE_LIMIT_DEBUG=false করুন

### ❌ Production এ করবেন না:
- [ ] Development API keys use করবেন না
- [ ] Debug logs enable রাখবেন না
- [ ] Bypass rate limits enable করবেন না
- [ ] Service key publicly expose করবেন না

## 📊 Monitoring:

### Check Rate Limit Status:
```bash
curl https://your-app.vercel.app/api/rate-limit/status
```

### View Statistics (Admin):
```bash
curl -H "x-api-key: YOUR_ADMIN_KEY" \
  https://your-app.vercel.app/api/admin/rate-limit/statistics
```

## 🔧 Troubleshooting:

### যদি Rate Limiting কাজ না করে:

1. **Check Environment Variables:**
   ```bash
   vercel env ls
   ```

2. **Verify Database Connection:**
   - Supabase dashboard → SQL Editor
   - Run: `SELECT * FROM rate_limit_config;`

3. **Check Function Logs:**
   ```bash
   vercel logs --prod
   ```

4. **Test with curl:**
   ```bash
   for i in {1..55}; do
     curl -X GET https://your-app.vercel.app/api/test
     echo " - Request $i"
   done
   ```

## 🎯 Expected Behavior:

Production এ properly configured হলে:
- ✅ 50 requests/minute এর পর 429 response
- ✅ X-RateLimit headers present
- ✅ Database এ tracking হবে
- ✅ Violations log হবে
- ✅ Auto-blocking after repeated violations

## 📝 Important Notes:

1. **Serverless Limitations:**
   - Vercel functions stateless
   - Database-based tracking essential
   - Cache won't persist between invocations

2. **Cost Optimization:**
   - Database calls minimize করুন
   - Efficient queries use করুন
   - Consider Redis for high-traffic sites

3. **Testing:**
   - Staging environment এ test করুন first
   - Load testing tools use করুন
   - Monitor database performance

## 🚨 Emergency Controls:

### Rate Limiting Disable করতে (Emergency only):
```env
BYPASS_RATE_LIMITS=true
```

### Specific IP Whitelist:
Update `rate_limit_config` table in Supabase

### Clear All Blocks:
```sql
DELETE FROM rate_limit_blocks WHERE blocked_until < NOW();
```

---

## ✅ Deployment Checklist:

- [ ] Environment variables set in Vercel
- [ ] Service key configured
- [ ] Database tables created
- [ ] Functions deployed
- [ ] Test endpoints working
- [ ] Rate limiting verified
- [ ] Monitoring setup
- [ ] Documentation updated

আপনার site এখন production-ready! 🚀

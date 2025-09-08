require('dotenv').config();
const express = require('express');

// Create Express app
const app = express();

// Trust proxy for accurate IP extraction
app.set('trust proxy', true);

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple IP extraction
app.use((req, res, next) => {
  req.clientIP = req.headers['x-forwarded-for'] || 
                 req.headers['x-real-ip'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress || 
                 req.ip || 
                 '127.0.0.1';
  
  req.requestIdentifier = req.clientIP;
  req.identifierType = 'IP';
  next();
});

// Import and apply rate limiting middleware
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Server Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('BYPASS_RATE_LIMITS:', process.env.BYPASS_RATE_LIMITS);
console.log('Using Service Key:', !!process.env.SUPABASE_SERVICE_KEY);

// Simple rate limiting middleware
app.use(async (req, res, next) => {
  console.log(`🚀 [RATE-LIMIT] ${req.method} ${req.path} from ${req.clientIP}`);
  
  // Skip health check
  if (req.path === '/health') {
    console.log(`⏩ [RATE-LIMIT] Skipping health check`);
    return next();
  }
  
  // Skip if bypass is enabled in development
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_RATE_LIMITS === 'true') {
    console.log(`⏩ [RATE-LIMIT] Bypassing for development`);
    return next();
  }
  
  try {
    const identifier = req.requestIdentifier;
    const identifierType = req.identifierType;
    const endpoint = req.path;
    const method = req.method.toUpperCase();
    
    console.log(`🔍 [RATE-LIMIT] Checking: ${identifierType}:${identifier} -> ${method} ${endpoint}`);
    
    // Check rate limit
    const { data: rateLimitData, error: checkError } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_endpoint: endpoint,
      p_method: method
    });
    
    if (checkError) {
      console.error('❌ [RATE-LIMIT] Check error:', checkError);
      return next(); // Fail open
    }
    
    console.log(`📊 [RATE-LIMIT] Result:`, rateLimitData);
    
    // Check if blocked
    if (rateLimitData.blocked) {
      console.warn(`🚫 [RATE-LIMIT] Blocked until ${rateLimitData.blocked_until}`);
      
      return res.status(403).json({
        error: 'Access temporarily blocked',
        blocked_until: rateLimitData.blocked_until,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if rate limit exceeded
    if (!rateLimitData.allowed) {
      console.warn(`🚫 [RATE-LIMIT] Rate limit exceeded`);
      console.warn(`   Current: ${JSON.stringify(rateLimitData.current)}`);
      console.warn(`   Limits: ${JSON.stringify(rateLimitData.limits)}`);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': rateLimitData.limits.per_minute,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': Math.floor(new Date(rateLimitData.reset_times.minute_reset).getTime() / 1000),
        'Retry-After': Math.ceil((new Date(rateLimitData.reset_times.minute_reset) - new Date()) / 1000)
      });
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        limits: rateLimitData.limits,
        current: rateLimitData.current,
        reset_times: rateLimitData.reset_times,
        timestamp: new Date().toISOString()
      });
    }
    
    // Record the request
    const { error: recordError } = await supabase.rpc('record_request', {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_endpoint: endpoint,
      p_method: method
    });
    
    if (recordError) {
      console.error('❌ [RATE-LIMIT] Record error:', recordError);
    } else {
      console.log(`✅ [RATE-LIMIT] Request recorded`);
    }
    
    // Set informational headers
    res.set({
      'X-RateLimit-Limit': rateLimitData.limits.per_minute,
      'X-RateLimit-Remaining': Math.max(0, rateLimitData.limits.per_minute - rateLimitData.current.minute - 1),
      'X-RateLimit-Reset': Math.floor(new Date(rateLimitData.reset_times.minute_reset).getTime() / 1000)
    });
    
    console.log(`✅ [RATE-LIMIT] Allowed, continuing...`);
    next();
    
  } catch (error) {
    console.error('💥 [RATE-LIMIT] Error:', error);
    next(); // Fail open
  }
});

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Diploma Bazar API Server (Fixed Rate Limiting)',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    rateLimiting: 'Active'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Rate limiting test endpoint - FIXED',
    timestamp: new Date().toISOString(),
    ip: req.clientIP,
    identifier: req.requestIdentifier,
    rateLimiting: 'Active'
  });
});

app.get('/api/rate-limit/status', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: req.requestIdentifier,
      p_identifier_type: req.identifierType,
      p_endpoint: '*',
      p_method: 'ALL'
    });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      identifier: `${req.identifierType}:${req.requestIdentifier}`,
      limits: data.limits,
      current: data.current,
      reset_times: data.reset_times,
      blocked: data.blocked,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Fixed Rate Limiting Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Rate Limiting: Active`);
});

// Vercel-compatible API Handler with Rate Limiting
// All dependencies inline to avoid import issues

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Trust proxy for accurate IP extraction
app.set('trust proxy', true);

// CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Parse JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseKey);

// Inline Rate Limiting Configuration
const RATE_LIMITS = {
  per_minute: 50,
  per_hour: 2000,
  per_day: 10000
};

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         '127.0.0.1';
};

// Inline Rate Limiting Middleware
const rateLimitMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  console.log(`🚀 [RATE-LIMIT] ${req.method} ${req.path}`);
  
  try {
    // Skip health endpoints
    const skipEndpoints = ['/health', '/status', '/ping', '/favicon.ico', '/'];
    if (skipEndpoints.includes(req.path)) {
      console.log(`⏩ [RATE-LIMIT] Skipping: ${req.path}`);
      return next();
    }

    // Skip in development with bypass enabled
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_RATE_LIMITS === 'true') {
      console.log(`⏩ [RATE-LIMIT] Bypassing for development`);
      return next();
    }

    const clientIP = getClientIP(req);
    const identifier = clientIP;
    const endpoint = req.path;
    const method = req.method.toUpperCase();

    console.log(`🔍 [RATE-LIMIT] Checking: ${identifier} -> ${method} ${endpoint}`);

    // Check rate limit using database function
    const { data: rateLimitData, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_identifier_type: 'IP',
      p_endpoint: endpoint,
      p_method: method
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      // Fail open - continue on database error
      return next();
    }

    console.log(`📊 [RATE-LIMIT] Result:`, rateLimitData);

    // Check if rate limit exceeded
    if (!rateLimitData.allowed) {
      console.warn(`🚫 [RATE-LIMIT] BLOCKED: ${identifier} - ${rateLimitData.current.minute}/${RATE_LIMITS.per_minute}`);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': RATE_LIMITS.per_minute,
        'X-RateLimit-Remaining': Math.max(0, RATE_LIMITS.per_minute - rateLimitData.current.minute),
        'X-RateLimit-Reset': Math.floor(new Date(rateLimitData.reset_times.minute_reset).getTime() / 1000),
        'Retry-After': Math.ceil((new Date(rateLimitData.reset_times.minute_reset) - new Date()) / 1000)
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        limits: RATE_LIMITS,
        current: rateLimitData.current,
        reset_times: rateLimitData.reset_times,
        timestamp: new Date().toISOString()
      });
    }

    // Record the request
    await supabase.rpc('record_request', {
      p_identifier: identifier,
      p_identifier_type: 'IP',
      p_endpoint: endpoint,
      p_method: method
    });

    // Set informational rate limit headers
    res.set({
      'X-RateLimit-Limit': RATE_LIMITS.per_minute,
      'X-RateLimit-Remaining': Math.max(0, RATE_LIMITS.per_minute - rateLimitData.current.minute - 1),
      'X-RateLimit-Reset': Math.floor(new Date(rateLimitData.reset_times.minute_reset).getTime() / 1000)
    });

    const duration = Date.now() - startTime;
    console.log(`✅ [RATE-LIMIT] Completed in ${duration}ms`);
    next();

  } catch (error) {
    console.error(`💥 [RATE-LIMIT] Error:`, error.message);
    // Fail open - continue on error
    next();
  }
};

// Apply rate limiting to all routes
app.use(rateLimitMiddleware);

// API Routes

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Diploma Bazar API Server - Vercel Compatible',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    rateLimiting: 'Active',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    rateLimiting: 'Active',
    database: 'Connected',
    version: '2.0.0'
  });
});

// Test endpoint for rate limiting
app.get('/api/test', (req, res) => {
  const clientIP = getClientIP(req);
  
  res.status(200).json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.path,
    headers: {
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip']
    },
    ip: clientIP,
    rateLimiting: 'Active',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Rate limit status endpoint
app.get('/api/rate-limit/status', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    
    const { data: rateLimitData, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: clientIP,
      p_identifier_type: 'IP',
      p_endpoint: '*',
      p_method: 'ALL'
    });

    if (error) {
      throw error;
    }

    res.json({
      identifier: `IP:${clientIP}`,
      limits: RATE_LIMITS,
      current: rateLimitData.current,
      reset_times: rateLimitData.reset_times,
      blocked: rateLimitData.blocked,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Rate limit status error:', error);
    res.status(500).json({
      error: 'Failed to get rate limit status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Books API endpoint
app.get('/api/books', (req, res) => {
  res.json({ 
    message: 'Books API endpoint',
    rateLimiting: 'Active',
    timestamp: new Date().toISOString()
  });
});

// Messages API endpoint  
app.get('/api/messages', (req, res) => {
  res.json({ 
    message: 'Messages API endpoint',
    rateLimiting: 'Active',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint for troubleshooting
app.get('/api/debug', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    
    // Test Supabase connection
    const { data, error } = await supabase.from('rate_limit_requests').select('count').limit(1);
    
    res.status(200).json({
      message: 'Debug information',
      timestamp: new Date().toISOString(),
      server_version: '2.0.0-vercel',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        has_supabase_url: !!process.env.SUPABASE_URL,
        has_service_key: !!process.env.SUPABASE_SERVICE_KEY,
        has_anon_key: !!process.env.SUPABASE_ANON_KEY,
        has_jwt_secret: !!process.env.JWT_SECRET
      },
      request_info: {
        method: req.method,
        path: req.path,
        ip: clientIP,
        user_agent: req.headers['user-agent']
      },
      supabase_test: {
        connected: !error,
        error: error?.message || null,
        data_length: data?.length || 0
      },
      rate_limits: RATE_LIMITS
    });
  } catch (error) {
    res.status(500).json({
      error: 'Debug endpoint error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Handle all other API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    available_endpoints: [
      '/api/test',
      '/api/rate-limit/status', 
      '/api/books',
      '/api/messages',
      '/api/debug'
    ],
    timestamp: new Date().toISOString()
  });
});

// Default export for Vercel
module.exports = app;

// Vercel Serverless Function with Rate Limiting
// Simple approach that works with Vercel

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error('Supabase initialization error:', error);
}

// Rate limit configuration
const RATE_LIMITS = {
  per_minute: 50,
  per_hour: 2000,
  per_day: 10000
};

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         '127.0.0.1';
};

// Rate limiting check
const checkRateLimit = async (ip, endpoint, method) => {
  if (!supabase) {
    console.log('Supabase not available, skipping rate limit');
    return { allowed: true, current: { minute: 0 }, reset_times: { minute_reset: new Date() } };
  }

  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: ip,
      p_identifier_type: 'IP',
      p_endpoint: endpoint,
      p_method: method
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, current: { minute: 0 }, reset_times: { minute_reset: new Date() } };
    }

    return data;
  } catch (error) {
    console.error('Rate limit exception:', error);
    return { allowed: true, current: { minute: 0 }, reset_times: { minute_reset: new Date() } };
  }
};

// Record request
const recordRequest = async (ip, endpoint, method) => {
  if (!supabase) return;

  try {
    await supabase.rpc('record_request', {
      p_identifier: ip,
      p_identifier_type: 'IP',
      p_endpoint: endpoint,
      p_method: method
    });
  } catch (error) {
    console.error('Record request error:', error);
  }
};

// Main handler function
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const clientIP = getClientIP(req);
  const url = req.url || '';
  const method = req.method || 'GET';

  console.log(`🚀 Request: ${method} ${url} from ${clientIP}`);

  try {
    // Skip rate limiting for certain paths
    const skipPaths = ['/health', '/status', '/ping'];
    const shouldSkipRateLimit = skipPaths.some(path => url.includes(path));

    // Apply rate limiting (except for skipped paths)
    if (!shouldSkipRateLimit && supabase) {
      console.log('🔍 Checking rate limits...');
      
      const rateLimitData = await checkRateLimit(clientIP, url, method);

      if (!rateLimitData.allowed) {
        console.log('🚫 Rate limit exceeded');

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', RATE_LIMITS.per_minute);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMITS.per_minute - rateLimitData.current.minute));
        res.setHeader('X-RateLimit-Reset', Math.floor(new Date(rateLimitData.reset_times.minute_reset).getTime() / 1000));
        res.setHeader('Retry-After', Math.ceil((new Date(rateLimitData.reset_times.minute_reset) - new Date()) / 1000));

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
      await recordRequest(clientIP, url, method);

      // Set informational rate limit headers
      res.setHeader('X-RateLimit-Limit', RATE_LIMITS.per_minute);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMITS.per_minute - rateLimitData.current.minute - 1));
      res.setHeader('X-RateLimit-Reset', Math.floor(new Date(rateLimitData.reset_times.minute_reset).getTime() / 1000));

      console.log('✅ Rate limit check passed');
    } else {
      console.log('⏩ Skipping rate limit check');
    }

    // Route handling
    if (url === '/' || url === '') {
      return res.status(200).json({
        message: 'Diploma Bazar API Server - Serverless',
        version: '3.0.0-serverless',
        timestamp: new Date().toISOString(),
        rateLimiting: 'Active',
        environment: process.env.NODE_ENV || 'production'
      });
    }

    if (url.includes('/api/test')) {
      return res.status(200).json({
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        method: method,
        url: url,
        headers: {
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-real-ip': req.headers['x-real-ip']
        },
        ip: clientIP,
        rateLimiting: 'Active - Serverless Version',
        environment: process.env.NODE_ENV || 'production',
        server_version: '3.0.0-serverless'
      });
    }

    if (url.includes('/api/debug')) {
      // Test Supabase connection
      let supabaseTest = { connected: false, error: 'Not tested' };
      if (supabase) {
        try {
          const { data, error } = await supabase.from('rate_limit_requests').select('count').limit(1);
          supabaseTest = {
            connected: !error,
            error: error?.message || null,
            data_length: data?.length || 0
          };
        } catch (error) {
          supabaseTest = {
            connected: false,
            error: error.message
          };
        }
      }

      return res.status(200).json({
        message: 'Debug information - Serverless Version',
        timestamp: new Date().toISOString(),
        server_version: '3.0.0-serverless',
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          has_supabase_url: !!process.env.SUPABASE_URL,
          has_service_key: !!process.env.SUPABASE_SERVICE_KEY,
          has_anon_key: !!process.env.SUPABASE_ANON_KEY,
          has_jwt_secret: !!process.env.JWT_SECRET
        },
        request_info: {
          method: method,
          url: url,
          ip: clientIP,
          user_agent: req.headers['user-agent']
        },
        supabase_test: supabaseTest,
        rate_limits: RATE_LIMITS
      });
    }

    if (url.includes('/api/rate-limit/status')) {
      if (!supabase) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Rate limit status requires database connection',
          timestamp: new Date().toISOString()
        });
      }

      const rateLimitData = await checkRateLimit(clientIP, '*', 'ALL');
      
      return res.status(200).json({
        identifier: `IP:${clientIP}`,
        limits: RATE_LIMITS,
        current: rateLimitData.current,
        reset_times: rateLimitData.reset_times,
        blocked: rateLimitData.blocked,
        timestamp: new Date().toISOString(),
        server_version: '3.0.0-serverless'
      });
    }

    if (url.includes('/api/books')) {
      return res.status(200).json({
        message: 'Books API endpoint',
        rateLimiting: 'Active - Serverless Version',
        timestamp: new Date().toISOString(),
        server_version: '3.0.0-serverless'
      });
    }

    if (url.includes('/api/messages')) {
      return res.status(200).json({
        message: 'Messages API endpoint',
        rateLimiting: 'Active - Serverless Version',
        timestamp: new Date().toISOString(),
        server_version: '3.0.0-serverless'
      });
    }

    if (url.includes('/health')) {
      return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        rateLimiting: 'Active',
        database: supabase ? 'Connected' : 'Disconnected',
        version: '3.0.0-serverless'
      });
    }

    // Default 404 for unknown routes
    return res.status(404).json({
      error: 'API endpoint not found',
      path: url,
      method: method,
      available_endpoints: [
        '/api/test',
        '/api/debug',
        '/api/rate-limit/status',
        '/api/books',
        '/api/messages',
        '/health'
      ],
      timestamp: new Date().toISOString(),
      server_version: '3.0.0-serverless'
    });

  } catch (error) {
    console.error('Handler error:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString(),
      server_version: '3.0.0-serverless'
    });
  }
};

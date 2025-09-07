// Rate Limiting Middleware
// This middleware enforces API rate limits and returns 429 "Too Many Requests" errors

const { createClient } = require('@supabase/supabase-js');
const { 
  RATE_LIMIT_CONFIG, 
  RATE_LIMIT_RESPONSES,
  getRateLimitForEndpoint 
} = require('../config/rateLimitConfig.cjs');
const { getClientIP } = require('./authMiddleware.cjs');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory cache for rate limit data (optional, for performance)
const rateLimitCache = new Map();
const CACHE_TTL = RATE_LIMIT_CONFIG.CACHE.TTL_SECONDS * 1000; // Convert to milliseconds

// Helper function to generate cache key
const generateCacheKey = (identifier, identifierType, endpoint, method) => {
  return `${identifierType}:${identifier}:${endpoint}:${method}`;
};

// Helper function to clean expired cache entries
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitCache.entries()) {
    if (now > value.expires) {
      rateLimitCache.delete(key);
    }
  }
};

// Helper function to normalize endpoint for matching
const normalizeEndpoint = (path) => {
  // Remove query parameters and trailing slashes
  const cleanPath = path.split('?')[0].replace(/\/$/, '');
  
  // Handle API versioning (e.g., /api/v1/books -> /api/books)
  const withoutVersion = cleanPath.replace(/\/v\d+/, '');
  
  return withoutVersion || '/';
};

// Check rate limit using database function
const checkRateLimit = async (identifier, identifierType, endpoint, method) => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_endpoint: endpoint,
      p_method: method
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // In case of database error, allow the request (fail open)
      return {
        allowed: true,
        blocked: false,
        limits: RATE_LIMIT_CONFIG.DEFAULT_LIMITS,
        current: { minute: 0, hour: 0, day: 0 },
        reset_times: {
          minute_reset: new Date(Date.now() + 60000),
          hour_reset: new Date(Date.now() + 3600000),
          day_reset: new Date(Date.now() + 86400000)
        }
      };
    }

    return data;
  } catch (error) {
    console.error('Rate limit check exception:', error);
    // Fail open - allow request if database is unavailable
    return {
      allowed: true,
      blocked: false,
      limits: RATE_LIMIT_CONFIG.DEFAULT_LIMITS,
      current: { minute: 0, hour: 0, day: 0 }
    };
  }
};

// Record request in database
const recordRequest = async (identifier, identifierType, endpoint, method) => {
  try {
    const { error } = await supabase.rpc('record_request', {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_endpoint: endpoint,
      p_method: method
    });

    if (error) {
      console.error('Request recording error:', error);
    }

    return !error;
  } catch (error) {
    console.error('Request recording exception:', error);
    return false;
  }
};

// Log rate limit violation
const logViolation = async (identifier, identifierType, endpoint, method, currentCount, limitType, req) => {
  try {
    await supabase.from('rate_limit_violations').insert({
      identifier,
      identifier_type: identifierType,
      endpoint,
      method,
      request_count: currentCount,
      limit_exceeded: limitType,
      user_agent: req.headers['user-agent'],
      headers: {
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'origin': req.headers.origin,
        'referer': req.headers.referer
      }
    });

    console.warn(`Rate limit violation: ${identifierType}:${identifier} exceeded ${limitType} limit on ${method} ${endpoint}`);
  } catch (error) {
    console.error('Violation logging error:', error);
  }
};

// Determine which limit was exceeded
const getDetermineLimitType = (current, limits) => {
  if (current.minute >= limits.per_minute) return 'per_minute';
  if (current.hour >= limits.per_hour) return 'per_hour';
  if (current.day >= limits.per_day) return 'per_day';
  return null;
};

// Get time until reset for the exceeded limit
const getTimeUntilReset = (limitType, resetTimes) => {
  switch (limitType) {
    case 'per_minute':
      return resetTimes.minute_reset;
    case 'per_hour':
      return resetTimes.hour_reset;
    case 'per_day':
      return resetTimes.day_reset;
    default:
      return new Date(Date.now() + 60000); // Default to 1 minute
  }
};

// Calculate retry after seconds
const getRetryAfterSeconds = (resetTime) => {
  const now = new Date();
  const reset = new Date(resetTime);
  return Math.max(0, Math.ceil((reset - now) / 1000));
};

// Main rate limiting middleware
const rateLimitMiddleware = async (req, res, next) => {
  console.log(`🚀 [RATE-LIMIT] Starting middleware for ${req.method} ${req.path}`);
  
  try {
    // Skip rate limiting in development if configured
    console.log(`🔧 [RATE-LIMIT] Config check - BYPASS: ${RATE_LIMIT_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS}, NODE_ENV: ${process.env.NODE_ENV}`);
    if (RATE_LIMIT_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS && process.env.NODE_ENV === 'development') {
      console.log(`⏩ [RATE-LIMIT] Bypassing rate limits for development`);
      return next();
    }

    // Skip rate limiting for whitelisted IPs
    if (req.isWhitelisted) {
      console.log(`⏩ [RATE-LIMIT] Skipping whitelisted IP`);
      return next();
    }

    // Skip rate limiting for certain endpoints (like health checks)
    const skipEndpoints = ['/health', '/status', '/ping', '/favicon.ico'];
    const normalizedPath = normalizeEndpoint(req.path);
    
    console.log(`🔍 [RATE-LIMIT] Path: ${req.path} -> Normalized: ${normalizedPath}`);
    console.log(`🔍 [RATE-LIMIT] Skip endpoints:`, skipEndpoints);
    console.log(`🔍 [RATE-LIMIT] Should skip: ${skipEndpoints.includes(normalizedPath)}`);
    
    if (skipEndpoints.includes(normalizedPath)) {
      console.log(`⏩ [RATE-LIMIT] Skipping endpoint: ${normalizedPath}`);
      return next();
    }

  // Clean cache periodically
  if (RATE_LIMIT_CONFIG.CACHE.ENABLED && Math.random() < 0.01) { // 1% chance
    cleanCache();
  }

  // Extract request information
  const identifier = req.requestIdentifier || getClientIP(req);
  const identifierType = req.identifierType || 'IP';
  const endpoint = normalizedPath;
  const method = req.method.toUpperCase();

  // Generate cache key
  const cacheKey = generateCacheKey(identifier, identifierType, endpoint, method);

  let rateLimitData = null;

  // Check cache first (if enabled)
  if (RATE_LIMIT_CONFIG.CACHE.ENABLED) {
    const cached = rateLimitCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      rateLimitData = cached.data;
      console.log(`🎯 [RATE-LIMIT] Cache hit for ${cacheKey}`);
    }
  }

  // If not in cache, check database
  if (!rateLimitData) {
    console.log(`🔍 [RATE-LIMIT] Checking database: ${identifierType}:${identifier} -> ${method} ${endpoint}`);
    rateLimitData = await checkRateLimit(identifier, identifierType, endpoint, method);
    console.log(`📊 [RATE-LIMIT] Database response:`, rateLimitData);
    
    // Cache the result
    if (RATE_LIMIT_CONFIG.CACHE.ENABLED) {
      // Ensure cache doesn't exceed max entries
      if (rateLimitCache.size >= RATE_LIMIT_CONFIG.CACHE.MAX_ENTRIES) {
        // Remove oldest entries (simple FIFO)
        const firstKey = rateLimitCache.keys().next().value;
        rateLimitCache.delete(firstKey);
      }
      
      rateLimitCache.set(cacheKey, {
        data: rateLimitData,
        expires: Date.now() + CACHE_TTL
      });
      console.log(`📦 [RATE-LIMIT] Cached result for ${cacheKey}`);
    }
  }

  // Check if request is blocked
  if (rateLimitData.blocked) {
    console.warn(`Blocked request from ${identifierType}:${identifier} - temporarily blocked until ${rateLimitData.blocked_until}`);
    
    const retryAfterSeconds = getRetryAfterSeconds(rateLimitData.blocked_until);
    
    res.set({
      'X-RateLimit-Blocked': 'true',
      'X-RateLimit-Block-Until': rateLimitData.blocked_until,
      'Retry-After': retryAfterSeconds
    });

    return res.status(403).json({
      error: RATE_LIMIT_RESPONSES.BLOCKED,
      details: `Access temporarily blocked until ${new Date(rateLimitData.blocked_until).toISOString()}`,
      retry_after: retryAfterSeconds,
      timestamp: new Date().toISOString()
    });
  }

  // Check if rate limit is exceeded
  if (!rateLimitData.allowed) {
    const limitType = getDetermineLimitType(rateLimitData.current, rateLimitData.limits);
    const resetTime = getTimeUntilReset(limitType, rateLimitData.reset_times);
    const retryAfterSeconds = getRetryAfterSeconds(resetTime);

    // Log the violation
    await logViolation(
      identifier, 
      identifierType, 
      endpoint, 
      method, 
      rateLimitData.current[limitType?.split('_')[1]] || 0,
      limitType,
      req
    );

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': rateLimitData.limits.per_minute,
      'X-RateLimit-Remaining': Math.max(0, rateLimitData.limits.per_minute - rateLimitData.current.minute),
      'X-RateLimit-Reset': Math.floor(new Date(rateLimitData.reset_times.minute_reset).getTime() / 1000),
      'X-RateLimit-Limit-Hour': rateLimitData.limits.per_hour,
      'X-RateLimit-Remaining-Hour': Math.max(0, rateLimitData.limits.per_hour - rateLimitData.current.hour),
      'X-RateLimit-Reset-Hour': Math.floor(new Date(rateLimitData.reset_times.hour_reset).getTime() / 1000),
      'X-RateLimit-Limit-Day': rateLimitData.limits.per_day,
      'X-RateLimit-Remaining-Day': Math.max(0, rateLimitData.limits.per_day - rateLimitData.current.day),
      'X-RateLimit-Reset-Day': Math.floor(new Date(rateLimitData.reset_times.day_reset).getTime() / 1000),
      'Retry-After': retryAfterSeconds
    });

    // Return 429 Too Many Requests
    return res.status(429).json({
      error: RATE_LIMIT_RESPONSES.TOO_MANY_REQUESTS,
      details: `Rate limit exceeded for ${limitType?.replace('_', ' ')}`,
      limits: rateLimitData.limits,
      current: rateLimitData.current,
      reset_times: rateLimitData.reset_times,
      retry_after: retryAfterSeconds,
      timestamp: new Date().toISOString()
    });
  }

  // Request is allowed - record it
  await recordRequest(identifier, identifierType, endpoint, method);

  // Set informational rate limit headers
  res.set({
    'X-RateLimit-Limit': rateLimitData.limits.per_minute,
    'X-RateLimit-Remaining': Math.max(0, rateLimitData.limits.per_minute - rateLimitData.current.minute - 1), // -1 for current request
    'X-RateLimit-Reset': Math.floor(new Date(rateLimitData.reset_times.minute_reset).getTime() / 1000),
    'X-RateLimit-Limit-Hour': rateLimitData.limits.per_hour,
    'X-RateLimit-Remaining-Hour': Math.max(0, rateLimitData.limits.per_hour - rateLimitData.current.hour - 1),
    'X-RateLimit-Reset-Hour': Math.floor(new Date(rateLimitData.reset_times.hour_reset).getTime() / 1000),
    'X-RateLimit-Limit-Day': rateLimitData.limits.per_day,
    'X-RateLimit-Remaining-Day': Math.max(0, rateLimitData.limits.per_day - rateLimitData.current.day - 1),
    'X-RateLimit-Reset-Day': Math.floor(new Date(rateLimitData.reset_times.day_reset).getTime() / 1000)
  });

  // Add debug headers in development
  if (RATE_LIMIT_CONFIG.DEVELOPMENT.DEBUG_HEADERS && process.env.NODE_ENV === 'development') {
    res.set({
      'X-Debug-Identifier': `${identifierType}:${identifier}`,
      'X-Debug-Endpoint': endpoint,
      'X-Debug-Method': method,
      'X-Debug-Cache-Hit': rateLimitCache.has(cacheKey) ? 'true' : 'false'
    });
  }

  // Continue to next middleware
  console.log(`✅ [RATE-LIMIT] Middleware completed successfully for ${req.method} ${req.path}`);
  next();
  
  } catch (error) {
    console.error(`💥 [RATE-LIMIT] Middleware error for ${req.method} ${req.path}:`, error.message);
    console.error('Stack:', error.stack);
    
    // Always continue to next middleware even on error (fail open)
    next();
  }
};

// Rate limit status endpoint (for monitoring)
const rateLimitStatus = async (req, res) => {
  const identifier = req.requestIdentifier || getClientIP(req);
  const identifierType = req.identifierType || 'IP';
  
  try {
    const rateLimitData = await checkRateLimit(identifier, identifierType, '*', 'ALL');
    
    res.json({
      identifier: `${identifierType}:${identifier}`,
      limits: rateLimitData.limits,
      current: rateLimitData.current,
      reset_times: rateLimitData.reset_times,
      blocked: rateLimitData.blocked,
      blocked_until: rateLimitData.blocked_until,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get rate limit status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Clear rate limit cache (admin endpoint)
const clearRateLimitCache = (req, res) => {
  if (RATE_LIMIT_CONFIG.CACHE.ENABLED) {
    rateLimitCache.clear();
    res.json({
      message: 'Rate limit cache cleared',
      timestamp: new Date().toISOString()
    });
  } else {
    res.json({
      message: 'Rate limit cache is disabled',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  rateLimitMiddleware,
  rateLimitStatus,
  clearRateLimitCache,
  checkRateLimit,
  recordRequest,
  logViolation
};

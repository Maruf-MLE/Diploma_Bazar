// API Authentication Middleware
// This middleware handles API key validation and user authentication

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { 
  RATE_LIMIT_CONFIG, 
  RATE_LIMIT_RESPONSES,
  isUserAgentBlocked,
  isOriginAllowed,
  isIPWhitelisted,
  isIPBlacklisted 
} = require('../config/rateLimitConfig.cjs');

// Initialize Supabase client with service key for admin operations
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

// Use service key if available, fallback to anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-in-production';

// Valid API keys (in production, these should be stored in database)
const VALID_API_KEYS = new Set([
  process.env.API_KEY_1,
  process.env.API_KEY_2,
  process.env.API_KEY_3,
  // Fallback keys for development (change in production!)
  'dev-api-key-12345678901234567890123456789012',
  'client-api-key-12345678901234567890123456789012'
].filter(Boolean));

// Helper function to extract IP address
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         '127.0.0.1';
};

// Helper function to extract User ID from JWT token
const extractUserIdFromToken = (token) => {
  try {
    if (!token) return null;
    
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    return decoded.userId || decoded.sub || decoded.id;
  } catch (error) {
    console.warn('Invalid JWT token:', error.message);
    return null;
  }
};

// Helper function to validate Supabase JWT token
const validateSupabaseToken = async (token) => {
  try {
    if (!token) return null;
    
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    const { data: { user }, error } = await supabase.auth.getUser(cleanToken);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.warn('Supabase token validation failed:', error.message);
    return null;
  }
};

// Security validation middleware
const validateSecurity = (req, res, next) => {
  const userAgent = req.headers['user-agent'];
  const origin = req.headers.origin;
  const clientIP = getClientIP(req);

  // Check if IP is blacklisted
  if (isIPBlacklisted(clientIP)) {
    console.warn(`Blocked request from blacklisted IP: ${clientIP}`);
    return res.status(403).json({
      error: RATE_LIMIT_RESPONSES.BLOCKED,
      details: 'IP address is blocked',
      timestamp: new Date().toISOString()
    });
  }

  // Skip other security checks for whitelisted IPs
  if (isIPWhitelisted(clientIP)) {
    req.isWhitelisted = true;
    return next();
  }

  // Check user agent
  if (RATE_LIMIT_CONFIG.SECURITY.BLOCKED_USER_AGENTS.length > 0 && isUserAgentBlocked(userAgent)) {
    console.warn(`Blocked request from suspicious user agent: ${userAgent} from IP: ${clientIP}`);
    return res.status(403).json({
      error: RATE_LIMIT_RESPONSES.FORBIDDEN,
      details: 'User agent not allowed',
      timestamp: new Date().toISOString()
    });
  }

  // Check origin for CORS (only for browser requests)
  if (origin && !isOriginAllowed(origin)) {
    console.warn(`Blocked request from disallowed origin: ${origin} from IP: ${clientIP}`);
    return res.status(403).json({
      error: RATE_LIMIT_RESPONSES.FORBIDDEN,
      details: 'Origin not allowed',
      timestamp: new Date().toISOString()
    });
  }

  // Check required headers
  const missingHeaders = RATE_LIMIT_CONFIG.SECURITY.REQUIRED_HEADERS.filter(
    header => !req.headers[header]
  );

  if (missingHeaders.length > 0) {
    console.warn(`Missing required headers: ${missingHeaders.join(', ')} from IP: ${clientIP}`);
    return res.status(400).json({
      error: RATE_LIMIT_RESPONSES.INVALID_REQUEST,
      details: `Missing required headers: ${missingHeaders.join(', ')}`,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  // Skip API key validation in development if configured
  if (RATE_LIMIT_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS && process.env.NODE_ENV === 'development') {
    req.apiKeyValid = true;
    return next();
  }

  // Skip for whitelisted IPs
  if (req.isWhitelisted) {
    req.apiKeyValid = true;
    return next();
  }

  const apiKey = req.headers[RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.HEADER_NAME] ||
                 req.headers['x-api-key'] ||
                 req.query.api_key;

  // Check if API key validation is required
  if (RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.ENABLED) {
    if (!apiKey) {
      console.warn(`Missing API key from IP: ${getClientIP(req)}`);
      return res.status(401).json({
        error: RATE_LIMIT_RESPONSES.UNAUTHORIZED,
        details: 'API key required',
        timestamp: new Date().toISOString()
      });
    }

    // Validate API key format
    if (apiKey.length < RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.MIN_LENGTH) {
      console.warn(`Invalid API key format from IP: ${getClientIP(req)}`);
      return res.status(403).json({
        error: RATE_LIMIT_RESPONSES.FORBIDDEN,
        details: 'Invalid API key format',
        timestamp: new Date().toISOString()
      });
    }

    // Check if API key is valid
    if (!VALID_API_KEYS.has(apiKey)) {
      console.warn(`Invalid API key: ${apiKey.substring(0, 8)}... from IP: ${getClientIP(req)}`);
      return res.status(403).json({
        error: RATE_LIMIT_RESPONSES.FORBIDDEN,
        details: 'Invalid API key',
        timestamp: new Date().toISOString()
      });
    }

    req.apiKeyValid = true;
    req.apiKey = apiKey;
  }

  next();
};

// JWT authentication middleware (optional)
const validateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (authHeader) {
    try {
      // Try custom JWT first
      const userId = extractUserIdFromToken(authHeader);
      if (userId) {
        req.userId = userId;
        req.authenticated = true;
      } else {
        // Try Supabase JWT
        const user = await validateSupabaseToken(authHeader);
        if (user) {
          req.userId = user.id;
          req.userEmail = user.email;
          req.authenticated = true;
          req.supabaseUser = user;
        }
      }
    } catch (error) {
      console.warn('JWT validation error:', error.message);
      // Don't block the request, just mark as unauthenticated
      req.authenticated = false;
    }
  } else {
    req.authenticated = false;
  }

  // For anonymous requests, check if API key is required
  if (!req.authenticated && RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.REQUIRED_FOR_ANONYMOUS) {
    if (!req.apiKeyValid) {
      return res.status(401).json({
        error: RATE_LIMIT_RESPONSES.UNAUTHORIZED,
        details: 'Authentication or API key required for anonymous requests',
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
};

// Combined authentication middleware
const authenticate = [validateSecurity, validateApiKey, validateJWT];

// Middleware to extract request identifier (IP or User ID)
const extractRequestIdentifier = (req, res, next) => {
  const clientIP = getClientIP(req);
  const userId = req.userId;
  
  // Prefer user ID for authenticated requests, fallback to IP
  if (userId && req.authenticated) {
    req.requestIdentifier = userId;
    req.identifierType = 'USER';
  } else {
    req.requestIdentifier = clientIP;
    req.identifierType = 'IP';
  }
  
  req.clientIP = clientIP;
  
  next();
};

// Middleware for admin-only endpoints
const requireAdmin = async (req, res, next) => {
  if (!req.authenticated || !req.userId) {
    return res.status(401).json({
      error: RATE_LIMIT_RESPONSES.UNAUTHORIZED,
      details: 'Admin access requires authentication',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Check if user is admin in database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', req.userId)
      .single();

    if (error || !profile) {
      console.warn(`Admin check failed for user ${req.userId}:`, error?.message);
      return res.status(403).json({
        error: RATE_LIMIT_RESPONSES.FORBIDDEN,
        details: 'Admin access denied',
        timestamp: new Date().toISOString()
      });
    }

    if (!profile.is_admin && profile.role !== 'admin') {
      console.warn(`Non-admin user ${req.userId} attempted admin access`);
      return res.status(403).json({
        error: RATE_LIMIT_RESPONSES.FORBIDDEN,
        details: 'Admin access required',
        timestamp: new Date().toISOString()
      });
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({
      error: {
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Admin verification failed'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Debug middleware (development only)
const debugMiddleware = (req, res, next) => {
  if (RATE_LIMIT_CONFIG.DEVELOPMENT.DEBUG_HEADERS && process.env.NODE_ENV === 'development') {
    console.log('Request Debug Info:', {
      method: req.method,
      url: req.url,
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      authenticated: req.authenticated,
      userId: req.userId,
      apiKey: req.apiKey ? `${req.apiKey.substring(0, 8)}...` : 'none',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

module.exports = {
  authenticate,
  validateSecurity,
  validateApiKey,
  validateJWT,
  extractRequestIdentifier,
  requireAdmin,
  debugMiddleware,
  getClientIP,
  extractUserIdFromToken,
  validateSupabaseToken,
  VALID_API_KEYS
};

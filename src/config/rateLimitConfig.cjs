// Rate Limiting Configuration
// This file contains all rate limiting and API security settings

const RATE_LIMIT_CONFIG = {
  // Default rate limits (requests per minute) - Production settings
  DEFAULT_LIMITS: {
    REQUESTS_PER_MINUTE: 50,  // 50 requests per minute for general API usage
    REQUESTS_PER_HOUR: 2000,  // 2000 requests per hour
    REQUESTS_PER_DAY: 10000   // 10000 requests per day
  },

  // Endpoint-specific rate limits
  ENDPOINT_LIMITS: {
    // Authentication endpoints (more restrictive)
    '/api/auth/login': {
      requests_per_minute: 20,
      requests_per_hour: 300,
      requests_per_day: 1000
    },
    '/api/auth/register': {
      requests_per_minute: 10,
      requests_per_hour: 100,
      requests_per_day: 300
    },
    '/api/auth/reset-password': {
      requests_per_minute: 5,
      requests_per_hour: 30,
      requests_per_day: 100
    },
    '/api/auth/verify-otp': {
      requests_per_minute: 15,
      requests_per_hour: 200,
      requests_per_day: 500
    },

    // API endpoints
    '/api/books': {
      requests_per_minute: 100,
      requests_per_hour: 3000,
      requests_per_day: 15000
    },
    '/api/messages': {
      requests_per_minute: 80,
      requests_per_hour: 2000,
      requests_per_day: 8000
    },
    '/api/upload': {
      requests_per_minute: 20,
      requests_per_hour: 300,
      requests_per_day: 1000
    },
    '/api/notifications': {
      requests_per_minute: 60,
      requests_per_hour: 1000,
      requests_per_day: 5000
    },

    // Admin endpoints (moderately restrictive)
    '/api/admin': {
      requests_per_minute: 30,
      requests_per_hour: 500,
      requests_per_day: 2000
    }
  },

  // Security settings
  SECURITY: {
    // Required headers for API requests
    REQUIRED_HEADERS: [
      'user-agent',
      'content-type'
    ],

    // Blocked user agents (bots, scrapers, etc.)
    BLOCKED_USER_AGENTS: [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /postman/i
    ],

    // Allowed origins (CORS)
    ALLOWED_ORIGINS: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://yryerjgidsyfiohmpeoc.supabase.co',
      'https://diploma-bazar.vercel.app',
      'https://diploma-bazar.netlify.app'
    ],

    // API Key validation
    API_KEY_VALIDATION: {
      ENABLED: true,
      HEADER_NAME: 'x-api-key',
      MIN_LENGTH: 32,
      REQUIRED_FOR_ANONYMOUS: true // Block anonymous requests without API key
    },

    // JWT validation
    JWT_VALIDATION: {
      ENABLED: true,
      HEADER_NAME: 'authorization',
      BEARER_PREFIX: 'Bearer ',
      ALGORITHM: 'HS256'
    },

    // IP-based restrictions
    IP_RESTRICTIONS: {
      ENABLED: true,
      MAX_REQUESTS_PER_IP_PER_MINUTE: 100,
      BLOCK_DURATION_MINUTES: 15, // Block IP for 15 minutes after violation
      WHITELIST: [
        '127.0.0.1',  // Localhost IPv4
        '::1'         // Localhost IPv6
      ],
      BLACKLIST: []
    }
  },

  // Rate limit violation handling
  VIOLATION_HANDLING: {
    // Progressive penalties
    PENALTIES: {
      FIRST_VIOLATION: {
        BLOCK_DURATION_MINUTES: 1,
        MESSAGE: 'Rate limit exceeded. Please slow down.'
      },
      SECOND_VIOLATION: {
        BLOCK_DURATION_MINUTES: 5,
        MESSAGE: 'Repeated rate limit violations detected. Access temporarily restricted.'
      },
      THIRD_VIOLATION: {
        BLOCK_DURATION_MINUTES: 15,
        MESSAGE: 'Multiple violations detected. Extended access restriction applied.'
      },
      PERSISTENT_VIOLATION: {
        BLOCK_DURATION_MINUTES: 60,
        MESSAGE: 'Persistent rate limit violations. Extended restriction applied.'
      }
    },

    // Automatic blocking thresholds
    AUTO_BLOCK: {
      ENABLED: true,
      VIOLATIONS_THRESHOLD: 5, // Block after 5 violations in 24 hours
      BLOCK_DURATION_HOURS: 24,
      PERMANENT_BLOCK_THRESHOLD: 20 // Permanent block after 20 violations
    }
  },

  // Monitoring and alerting
  MONITORING: {
    LOG_VIOLATIONS: true,
    LOG_LEVEL: 'warn', // 'debug', 'info', 'warn', 'error'
    
    // Alert thresholds
    ALERTS: {
      HIGH_TRAFFIC_THRESHOLD: 1000, // requests per minute
      SUSPICIOUS_ACTIVITY_THRESHOLD: 50, // violations per hour
      MULTIPLE_IP_SAME_USER_THRESHOLD: 10 // same user from different IPs
    }
  },

  // Cache settings for rate limit data
  CACHE: {
    ENABLED: true,
    TTL_SECONDS: 60, // Cache rate limit data for 1 minute
    MAX_ENTRIES: 10000 // Maximum cache entries
  },

  // Development settings
  DEVELOPMENT: {
    BYPASS_RATE_LIMITS: process.env.NODE_ENV === 'development' && process.env.BYPASS_RATE_LIMITS === 'true',
    MOCK_DELAYS: false, // Add artificial delays in development
    DEBUG_HEADERS: true // Include debug headers in development
  }
};

// HTTP status codes and messages
const RATE_LIMIT_RESPONSES = {
  TOO_MANY_REQUESTS: {
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.'
  },
  UNAUTHORIZED: {
    status: 401,
    code: 'UNAUTHORIZED',
    message: 'Authentication required. Please provide valid credentials.'
  },
  FORBIDDEN: {
    status: 403,
    code: 'FORBIDDEN',
    message: 'Access denied. Invalid or missing API key.'
  },
  BLOCKED: {
    status: 403,
    code: 'ACCESS_BLOCKED',
    message: 'Access temporarily blocked due to suspicious activity.'
  },
  INVALID_REQUEST: {
    status: 400,
    code: 'INVALID_REQUEST',
    message: 'Invalid request format or missing required headers.'
  }
};

// Helper functions
const getRateLimitForEndpoint = (endpoint, method = 'ALL') => {
  // Check for exact endpoint match first
  const exactMatch = RATE_LIMIT_CONFIG.ENDPOINT_LIMITS[endpoint];
  if (exactMatch) {
    return exactMatch;
  }

  // Check for pattern matches
  for (const [pattern, limits] of Object.entries(RATE_LIMIT_CONFIG.ENDPOINT_LIMITS)) {
    if (endpoint.startsWith(pattern.replace('*', ''))) {
      return limits;
    }
  }

  // Return default limits
  return RATE_LIMIT_CONFIG.DEFAULT_LIMITS;
};

const isUserAgentBlocked = (userAgent) => {
  if (!userAgent) return true; // Block requests without user agent

  return RATE_LIMIT_CONFIG.SECURITY.BLOCKED_USER_AGENTS.some(pattern => 
    pattern.test ? pattern.test(userAgent) : userAgent.includes(pattern)
  );
};

const isOriginAllowed = (origin) => {
  if (!origin) return false;
  
  return RATE_LIMIT_CONFIG.SECURITY.ALLOWED_ORIGINS.includes(origin) ||
         RATE_LIMIT_CONFIG.SECURITY.ALLOWED_ORIGINS.includes('*');
};

const isIPWhitelisted = (ip) => {
  return RATE_LIMIT_CONFIG.SECURITY.IP_RESTRICTIONS.WHITELIST.includes(ip);
};

const isIPBlacklisted = (ip) => {
  return RATE_LIMIT_CONFIG.SECURITY.IP_RESTRICTIONS.BLACKLIST.includes(ip);
};

// Export configuration and helper functions
module.exports = {
  RATE_LIMIT_CONFIG,
  RATE_LIMIT_RESPONSES,
  getRateLimitForEndpoint,
  isUserAgentBlocked,
  isOriginAllowed,
  isIPWhitelisted,
  isIPBlacklisted
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  // Production overrides
  RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.REQUIRED_FOR_ANONYMOUS = true;
  RATE_LIMIT_CONFIG.DEVELOPMENT.BYPASS_RATE_LIMITS = false;
  RATE_LIMIT_CONFIG.MONITORING.LOG_LEVEL = 'warn';
} else if (process.env.NODE_ENV === 'development') {
  // Development overrides - more relaxed for testing
  RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.REQUIRED_FOR_ANONYMOUS = false;
  RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.ENABLED = false; // Disable API key validation in dev
} else if (process.env.NODE_ENV === 'test') {
  // Test environment overrides
  RATE_LIMIT_CONFIG.DEFAULT_LIMITS.REQUESTS_PER_MINUTE = 1000; // Higher limits for testing
  RATE_LIMIT_CONFIG.SECURITY.API_KEY_VALIDATION.REQUIRED_FOR_ANONYMOUS = false;
}

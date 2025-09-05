/**
 * 🚦 Client-side Rate Limiting Service
 * Prevents abuse and brute force attacks
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked?: boolean;
  blockedUntil?: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Default configurations
    this.configs.set('login', { maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 }); // 5 attempts per 15 min, block for 30 min
    this.configs.set('register', { maxRequests: 3, windowMs: 60 * 60 * 1000 }); // 3 attempts per hour
    this.configs.set('message', { maxRequests: 30, windowMs: 60 * 1000 }); // 30 messages per minute
    this.configs.set('upload', { maxRequests: 10, windowMs: 60 * 1000 }); // 10 uploads per minute
    this.configs.set('api', { maxRequests: 100, windowMs: 60 * 1000 }); // 100 API calls per minute
  }

  /**
   * Check if action is allowed
   */
  isAllowed(action: string, identifier: string = 'global'): boolean {
    const key = `${action}:${identifier}`;
    const config = this.configs.get(action);

    if (!config) {
      console.warn(`Rate limit config not found for action: ${action}`);
      return true; // Allow if no config
    }

    const now = Date.now();
    let entry = this.limits.get(key);

    // Check if currently blocked
    if (entry?.blocked && entry.blockedUntil && now < entry.blockedUntil) {
      console.warn(`🚫 Rate limit: ${action} blocked for ${identifier} until ${new Date(entry.blockedUntil).toLocaleTimeString()}`);
      return false;
    }

    // Initialize or reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false
      };
    }

    // Increment counter
    entry.count++;
    this.limits.set(key, entry);

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      console.warn(`🚫 Rate limit exceeded for ${action}:${identifier} (${entry.count}/${config.maxRequests})`);

      // Block if configured
      if (config.blockDurationMs) {
        entry.blocked = true;
        entry.blockedUntil = now + config.blockDurationMs;
        this.limits.set(key, entry);

        // Log security event
        this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          action,
          identifier,
          count: entry.count,
          maxRequests: config.maxRequests,
          blockedUntil: entry.blockedUntil
        });
      }

      return false;
    }

    return true;
  }

  /**
   * Reset rate limit for specific action/identifier
   */
  reset(action: string, identifier: string = 'global'): void {
    const key = `${action}:${identifier}`;
    this.limits.delete(key);
    console.log(`✅ Rate limit reset for ${key}`);
  }

  /**
   * Get current status
   */
  getStatus(action: string, identifier: string = 'global'): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    blocked: boolean;
    blockedUntil?: number;
  } {
    const key = `${action}:${identifier}`;
    const config = this.configs.get(action);
    const entry = this.limits.get(key);

    if (!config) {
      return { allowed: true, remaining: Infinity, resetTime: 0, blocked: false };
    }

    if (!entry) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
        blocked: false
      };
    }

    const now = Date.now();
    const blocked = entry.blocked && entry.blockedUntil ? now < entry.blockedUntil : false;

    return {
      allowed: entry.count <= config.maxRequests && !blocked,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      blocked,
      blockedUntil: entry.blockedUntil
    };
  }

  /**
   * Configure rate limit for specific action
   */
  configure(action: string, config: RateLimitConfig): void {
    this.configs.set(action, config);
    console.log(`⚙️ Rate limit configured for ${action}:`, config);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
        this.limits.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * Log security events
   */
  private logSecurityEvent(event: string, details: any): void {
    const securityEvent = {
      type: event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      details
    };

    // Store in localStorage for monitoring
    try {
      const events = JSON.parse(localStorage.getItem('security_events') || '[]');
      events.push(securityEvent);

      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }

      localStorage.setItem('security_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to log security event:', error);
    }

    // In production, send to security monitoring service
    if (import.meta.env.PROD) {
      // fetch('/api/security-log', { method: 'POST', body: JSON.stringify(securityEvent) })
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Auto cleanup every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Rate limit decorator for functions
 */
export function withRateLimit(action: string, identifier?: () => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const id = identifier ? identifier() : 'global';

      if (!rateLimiter.isAllowed(action, id)) {
        const status = rateLimiter.getStatus(action, id);
        const error = new Error(`Rate limit exceeded. Try again in ${Math.ceil((status.resetTime - Date.now()) / 1000)} seconds.`);
        (error as any).code = 'RATE_LIMIT_EXCEEDED';
        (error as any).retryAfter = status.resetTime;
        throw error;
      }

      return method.apply(this, args);
    };
  };
}

/**
 * React hook for rate limiting
 */
export function useRateLimit(action: string, identifier: string = 'global') {
  const status = rateLimiter.getStatus(action, identifier);

  return {
    ...status,
    attempt: () => rateLimiter.isAllowed(action, identifier),
    reset: () => rateLimiter.reset(action, identifier)
  };
}

export default rateLimiter;
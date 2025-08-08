import DOMPurify from 'dompurify';
import { z } from 'zod';

/**
 * 🛡️ XSS Protection & Input Sanitization Utilities
 * Pure functions without React components
 */

// DOMPurify configuration
const defaultConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true
};

/**
 * HTML content sanitize করার ফাংশন
 */
export const sanitizeHTML = (dirty: string, config = defaultConfig): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  
  try {
    return DOMPurify.sanitize(dirty, config);
  } catch (error) {
    console.error('HTML sanitization error:', error);
    return '';
  }
};

/**
 * Plain text sanitize করার ফাংশন (সব HTML tag remove)
 */
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // সব HTML tags remove করো
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Special characters escape করো
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * URL sanitize করার ফাংশন
 */
export const sanitizeURL = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const parsedURL = new URL(url);
    
    // শুধু safe protocols allow করো
    if (!['http:', 'https:', 'mailto:'].includes(parsedURL.protocol)) {
      return '';
    }
    
    return parsedURL.toString();
  } catch (error) {
    console.error('URL sanitization error:', error);
    return '';
  }
};

/**
 * File name sanitize করার ফাংশন
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') return '';
  
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Dangerous characters remove
    .replace(/^\.+/, '') // Leading dots remove
    .substring(0, 255); // Length limit
};

/**
 * Zod schemas with sanitization
 */

// Book title validation with sanitization
export const bookTitleSchema = z.string()
  .min(1, 'বইয়ের নাম প্রয়োজন')
  .max(200, 'বইয়ের নাম অতিরিক্ত দীর্ঘ')
  .transform(val => sanitizeText(val))
  .refine(val => val.length > 0, 'বৈধ বইয়ের নাম প্রয়োজন');

// Book description validation with sanitization
export const bookDescriptionSchema = z.string()
  .max(2000, 'বর্ণনা অতিরিক্ত দীর্ঘ')
  .transform(val => sanitizeHTML(val))
  .optional();

// User name validation with sanitization
export const userNameSchema = z.string()
  .min(2, 'নাম কমপক্ষে ২ অক্ষর হতে হবে')
  .max(100, 'নাম অতিরিক্ত দীর্ঘ')
  .transform(val => sanitizeText(val))
  .refine(val => /^[a-zA-Z\u0980-\u09FF\s.'-]+$/.test(val), 'বৈধ নাম প্রয়োজন');

// Email validation with sanitization
export const emailSchema = z.string()
  .email('বৈধ ইমেইল প্রয়োজন')
  .transform(val => val.toLowerCase().trim())
  .refine(val => !/[<>"]/.test(val), 'ইমেইলে অবৈধ character');

// Roll number validation with sanitization
export const rollNumberSchema = z.string()
  .min(1, 'রোল নম্বর প্রয়োজন')
  .max(50, 'রোল নম্বর অতিরিক্ত দীর্ঘ')
  .transform(val => sanitizeText(val))
  .refine(val => /^[a-zA-Z0-9-_]+$/.test(val), 'বৈধ রোল নম্বর প্রয়োজন');

// Message content validation with sanitization
export const messageContentSchema = z.string()
  .min(1, 'মেসেজ খালি হতে পারে না')
  .max(1000, 'মেসেজ অতিরিক্ত দীর্ঘ')
  .transform(val => sanitizeHTML(val, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  }));

/**
 * XSS Detection & Logging
 */
export const detectXSSAttempt = (input: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*javascript:/gi,
    /eval\(/gi,
    /expression\(/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};

export const logSecurityEvent = (event: string, details: any) => {
  console.warn(`🚨 Security Event: ${event}`, {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    details
  });
  
  // Production এ external security service এ পাঠান
  if (process.env.NODE_ENV === 'production') {
    // Send to security monitoring service
    // fetch('/api/security-log', { method: 'POST', body: JSON.stringify({...}) })
  }
};

/**
 * Input validation middleware for forms
 */
export const validateAndSanitizeInput = (
  input: string, 
  type: 'text' | 'html' | 'url' | 'filename' = 'text'
): { isValid: boolean; sanitized: string; error?: string } => {
  try {
    // XSS attempt detection
    if (detectXSSAttempt(input)) {
      logSecurityEvent('XSS_ATTEMPT', { input: input.substring(0, 100) });
      return {
        isValid: false,
        sanitized: '',
        error: 'অবৈধ input detected'
      };
    }

    let sanitized: string;
    
    switch (type) {
      case 'html':
        sanitized = sanitizeHTML(input);
        break;
      case 'url':
        sanitized = sanitizeURL(input);
        break;
      case 'filename':
        sanitized = sanitizeFileName(input);
        break;
      default:
        sanitized = sanitizeText(input);
    }

    return {
      isValid: true,
      sanitized
    };
  } catch (error) {
    console.error('Input validation error:', error);
    return {
      isValid: false,
      sanitized: '',
      error: 'Validation error'
    };
  }
};

/**
 * CSP (Content Security Policy) headers
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://yryerjgidsyfiohmpeoc.supabase.co",
    "connect-src 'self' https://yryerjgidsyfiohmpeoc.supabase.co wss://yryerjgidsyfiohmpeoc.supabase.co",
    "font-src 'self' data:",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'self' https://btebresultszone.com",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeURL,
  sanitizeFileName,
  validateAndSanitizeInput,
  detectXSSAttempt,
  logSecurityEvent,
  CSP_HEADERS
};

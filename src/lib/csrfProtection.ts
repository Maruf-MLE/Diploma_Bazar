/**
 * 🛡️ CSRF Protection Service
 * Prevents Cross-Site Request Forgery attacks
 */

class CSRFProtection {
  private token: string | null = null;
  private readonly tokenKey = 'csrf_token';
  private readonly headerName = 'X-CSRF-Token';

  constructor() {
    this.initializeToken();
  }

  /**
   * Initialize or retrieve CSRF token
   */
  private initializeToken(): void {
    // Try to get existing token from sessionStorage
    this.token = sessionStorage.getItem(this.tokenKey);
    
    if (!this.token) {
      // Generate new token
      this.token = this.generateToken();
      sessionStorage.setItem(this.tokenKey, this.token);
    }
  }

  /**
   * Generate cryptographically secure token
   */
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get current CSRF token
   */
  getToken(): string {
    if (!this.token) {
      this.initializeToken();
    }
    return this.token!;
  }

  /**
   * Refresh CSRF token
   */
  refreshToken(): string {
    this.token = this.generateToken();
    sessionStorage.setItem(this.tokenKey, this.token);
    return this.token;
  }

  /**
   * Get headers with CSRF token
   */
  getHeaders(): Record<string, string> {
    return {
      [this.headerName]: this.getToken()
    };
  }

  /**
   * Validate CSRF token
   */
  validateToken(token: string): boolean {
    return token === this.getToken();
  }

  /**
   * Add CSRF protection to fetch requests
   */
  protectedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...options.headers,
      ...this.getHeaders()
    };

    return fetch(url, {
      ...options,
      headers
    });
  }

  /**
   * Add CSRF token to form data
   */
  addTokenToForm(formData: FormData): FormData {
    formData.append('csrf_token', this.getToken());
    return formData;
  }

  /**
   * Create hidden input for forms
   */
  createHiddenInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'csrf_token';
    input.value = this.getToken();
    return input;
  }

  /**
   * Verify request origin
   */
  verifyOrigin(allowedOrigins: string[] = []): boolean {
    const origin = window.location.origin;
    const referer = document.referrer;
    
    // Default allowed origins
    const defaultAllowed = [
      window.location.origin,
      'https://diplomabazar.vercel.app',
      'https://yryerjgidsyfiohmpeoc.supabase.co'
    ];
    
    const allowed = [...defaultAllowed, ...allowedOrigins];
    
    // Check if current origin is allowed
    if (!allowed.includes(origin)) {
      console.warn('🚨 CSRF: Invalid origin detected:', origin);
      return false;
    }
    
    // Check referer if present
    if (referer && !allowed.some(allowedOrigin => referer.startsWith(allowedOrigin))) {
      console.warn('🚨 CSRF: Invalid referer detected:', referer);
      return false;
    }
    
    return true;
  }

  /**
   * Check if request is same-origin
   */
  isSameOrigin(url: string): boolean {
    try {
      const requestUrl = new URL(url, window.location.origin);
      return requestUrl.origin === window.location.origin;
    } catch (error) {
      console.error('Invalid URL for same-origin check:', url);
      return false;
    }
  }
}

// Global CSRF protection instance
export const csrfProtection = new CSRFProtection();

/**
 * Enhanced fetch with CSRF protection
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Add CSRF protection for same-origin requests
  if (csrfProtection.isSameOrigin(url)) {
    return csrfProtection.protectedFetch(url, options);
  }
  
  // Regular fetch for cross-origin requests
  return fetch(url, options);
}

/**
 * React hook for CSRF protection
 */
export function useCSRFProtection() {
  return {
    token: csrfProtection.getToken(),
    headers: csrfProtection.getHeaders(),
    refreshToken: () => csrfProtection.refreshToken(),
    createHiddenInput: () => csrfProtection.createHiddenInput(),
    protectedFetch: (url: string, options?: RequestInit) => csrfProtection.protectedFetch(url, options),
    verifyOrigin: (allowedOrigins?: string[]) => csrfProtection.verifyOrigin(allowedOrigins)
  };
}

export default csrfProtection;
/**
 * URL Helper utilities for consistent navigation
 */

/**
 * Get the current application base URL
 * This works for both localhost development and production
 */
export const getBaseUrl = (): string => {
  return window.location.origin;
};

/**
 * Navigate to a route using the current domain
 * This ensures redirects work on both localhost and production
 */
export const navigateToRoute = (route: string): void => {
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${route.startsWith('/') ? route : `/${route}`}`;
  window.location.href = fullUrl;
};

/**
 * Get full URL for a route
 * Useful for constructing URLs for sharing or API calls
 */
export const getRouteUrl = (route: string): string => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${route.startsWith('/') ? route : `/${route}`}`;
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost');
};

/**
 * Check if we're in production mode
 */
export const isProduction = (): boolean => {
  return !isDevelopment();
};

/**
 * Get current environment info
 */
export const getEnvironmentInfo = () => {
  return {
    hostname: window.location.hostname,
    origin: window.location.origin,
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
  };
};

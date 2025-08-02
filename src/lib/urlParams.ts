/**
 * URL Parameter Parsing Utility for Authentication
 * 
 * This utility provides comprehensive URL parameter parsing and error detection
 * for authentication flows, specifically handling OTP errors and other auth states.
 */

export interface AuthUrlParams {
  // Error parameters
  error?: string;
  error_code?: string;
  error_description?: string;
  
  // Authentication tokens
  access_token?: string;
  refresh_token?: string;
  token?: string;
  token_hash?: string;
  
  // Authentication type and flow
  type?: string;
  flow_type?: string;
  
  // Additional parameters
  expires_in?: string;
  expires_at?: string;
  provider_token?: string;
  provider_refresh_token?: string;
  
  // Custom parameters
  [key: string]: string | undefined;
}

export interface ParsedAuthUrl {
  params: AuthUrlParams;
  hasError: boolean;
  isOtpExpired: boolean;
  isValidAuthFlow: boolean;
  errorMessage?: string;
  debugInfo: {
    url: string;
    searchParams: Record<string, string>;
    hash: string;
    pathname: string;
    timestamp: string;
  };
}

/**
 * Parse URL parameters and detect authentication error states
 */
export function parseAuthUrlParams(url?: string): ParsedAuthUrl {
  const currentUrl = url || window.location.href;
  const urlObj = new URL(currentUrl);
  const searchParams = new URLSearchParams(urlObj.search);
  const hashParams = new URLSearchParams(urlObj.hash.replace('#', ''));
  
  // Combine search and hash parameters (hash takes precedence)
  const allParams: AuthUrlParams = {};
  
  // First add search params
  for (const [key, value] of searchParams.entries()) {
    allParams[key] = value;
  }
  
  // Then add hash params (they override search params)
  for (const [key, value] of hashParams.entries()) {
    allParams[key] = value;
  }
  
  // Debug information
  const debugInfo = {
    url: currentUrl,
    searchParams: Object.fromEntries(searchParams.entries()),
    hash: urlObj.hash,
    pathname: urlObj.pathname,
    timestamp: new Date().toISOString()
  };
  
  // Console logging for debugging
  console.log('🔍 URL Parameter Analysis:', {
    url: currentUrl,
    searchParamsCount: searchParams.size,
    hashParamsCount: hashParams.size,
    combinedParams: allParams,
    debugInfo
  });
  
  // Check for error states
  const hasError = !!(allParams.error || allParams.error_code);
  const isOtpExpired = allParams.error_code === 'otp_expired' || 
                       allParams.error === 'otp_expired' ||
                       (allParams.error_description && 
                        allParams.error_description.toLowerCase().includes('otp') && 
                        allParams.error_description.toLowerCase().includes('expired'));
  
  // Check for valid authentication flow
  const isValidAuthFlow = !!(
    (allParams.access_token && allParams.refresh_token) ||
    (allParams.token && allParams.type) ||
    (allParams.token_hash && allParams.type)
  );
  
  // Generate error message
  let errorMessage: string | undefined;
  if (hasError) {
    if (isOtpExpired) {
      errorMessage = allParams.error_description || 
                     'OTP has expired. Please request a new verification link.';
    } else if (allParams.error_description) {
      errorMessage = allParams.error_description;
    } else if (allParams.error) {
      errorMessage = `Authentication error: ${allParams.error}`;
    } else if (allParams.error_code) {
      errorMessage = `Authentication error (${allParams.error_code})`;
    }
  }
  
  // Additional parameter logging
  console.log('📊 Parameter Analysis Results:', {
    hasError,
    isOtpExpired,
    isValidAuthFlow,
    errorMessage,
    parameterCount: Object.keys(allParams).length
  });
  
  // Log specific error codes for debugging
  if (allParams.error_code) {
    console.log(`🚨 Error Code Detected: ${allParams.error_code}`);
  }
  
  // Log OTP expiration specifically
  if (isOtpExpired) {
    console.log('⏰ OTP Expired Error Detected:', {
      error: allParams.error,
      error_code: allParams.error_code,
      error_description: allParams.error_description
    });
  }
  
  // Log authentication tokens (without revealing sensitive data)
  if (allParams.access_token || allParams.token) {
    console.log('🔑 Authentication Tokens Found:', {
      hasAccessToken: !!allParams.access_token,
      hasRefreshToken: !!allParams.refresh_token,
      hasToken: !!allParams.token,
      hasTokenHash: !!allParams.token_hash,
      type: allParams.type,
      tokenLength: allParams.access_token?.length || allParams.token?.length || 0
    });
  }
  
  return {
    params: allParams,
    hasError,
    isOtpExpired,
    isValidAuthFlow,
    errorMessage,
    debugInfo
  };
}

/**
 * Check if the URL contains specific error types
 */
export function hasSpecificError(errorType: string, url?: string): boolean {
  const parsed = parseAuthUrlParams(url);
  return parsed.params.error === errorType || 
         parsed.params.error_code === errorType ||
         (parsed.params.error_description?.toLowerCase().includes(errorType.toLowerCase()) ?? false);
}

/**
 * Extract authentication tokens from URL parameters
 */
export function extractAuthTokens(url?: string): {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  tokenHash?: string;
  type?: string;
} {
  const parsed = parseAuthUrlParams(url);
  
  console.log('🎫 Extracting Authentication Tokens:', {
    hasAccessToken: !!parsed.params.access_token,
    hasRefreshToken: !!parsed.params.refresh_token,
    hasToken: !!parsed.params.token,
    hasTokenHash: !!parsed.params.token_hash,
    type: parsed.params.type
  });
  
  return {
    accessToken: parsed.params.access_token,
    refreshToken: parsed.params.refresh_token,
    token: parsed.params.token,
    tokenHash: parsed.params.token_hash,
    type: parsed.params.type
  };
}

/**
 * Generate debug information for troubleshooting
 */
export function generateDebugReport(url?: string): string {
  const parsed = parseAuthUrlParams(url);
  
  const report = `
=== URL Parameter Debug Report ===
Generated: ${parsed.debugInfo.timestamp}
URL: ${parsed.debugInfo.url}
Pathname: ${parsed.debugInfo.pathname}
Hash: ${parsed.debugInfo.hash}

=== Parameter Analysis ===
Has Error: ${parsed.hasError}
Is OTP Expired: ${parsed.isOtpExpired}
Is Valid Auth Flow: ${parsed.isValidAuthFlow}
Error Message: ${parsed.errorMessage || 'None'}

=== All Parameters ===
${JSON.stringify(parsed.params, null, 2)}

=== Search Parameters ===
${JSON.stringify(parsed.debugInfo.searchParams, null, 2)}

=== Recommendations ===
${generateRecommendations(parsed)}
`;
  
  return report;
}

/**
 * Generate recommendations based on URL analysis
 */
function generateRecommendations(parsed: ParsedAuthUrl): string {
  const recommendations: string[] = [];
  
  if (parsed.isOtpExpired) {
    recommendations.push('- Request a new OTP/verification link');
    recommendations.push('- Check if the user needs to verify their email again');
  }
  
  if (parsed.hasError && !parsed.isOtpExpired) {
    recommendations.push('- Handle the specific error: ' + (parsed.params.error || parsed.params.error_code));
    recommendations.push('- Redirect user to appropriate error handling page');
  }
  
  if (!parsed.isValidAuthFlow && !parsed.hasError) {
    recommendations.push('- URL may be missing required authentication parameters');
    recommendations.push('- Verify the authentication link generation');
  }
  
  if (parsed.params.access_token && !parsed.params.refresh_token) {
    recommendations.push('- Access token found but missing refresh token');
    recommendations.push('- Check token generation process');
  }
  
  if (Object.keys(parsed.params).length === 0) {
    recommendations.push('- No URL parameters found');
    recommendations.push('- User may have accessed the page directly');
  }
  
  return recommendations.length > 0 ? recommendations.join('\n') : '- No specific recommendations';
}

/**
 * Hook-like function for React components to use URL parameter parsing
 */
export function useAuthUrlParams(url?: string) {
  const parsed = parseAuthUrlParams(url);
  
  return {
    ...parsed,
    // Helper functions
    hasSpecificError: (errorType: string) => hasSpecificError(errorType, url),
    extractTokens: () => extractAuthTokens(url),
    generateDebugReport: () => generateDebugReport(url)
  };
}

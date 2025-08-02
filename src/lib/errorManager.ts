import { ErrorState, ErrorInfo, errorMessages } from './errorTypes';

/**
 * Error manager utility for handling and creating standardized error states
 */
export class ErrorManager {
  
  /**
   * Create an ErrorInfo object from an error state type
   */
  static createError(
    type: ErrorState, 
    customMessage?: string, 
    details?: string, 
    code?: string | number
  ): ErrorInfo {
    return {
      type,
      message: customMessage,
      details,
      timestamp: new Date(),
      code
    };
  }

  /**
   * Create error from HTTP status codes
   */
  static fromHttpStatus(status: number, customMessage?: string, details?: string): ErrorInfo {
    let type: ErrorState;
    
    switch (status) {
      case 400:
        type = 'validationError';
        break;
      case 401:
        type = 'unauthorized';
        break;
      case 403:
        type = 'forbidden';
        break;
      case 404:
        type = 'notFound';
        break;
      case 408:
        type = 'networkError';
        break;
      case 429:
        type = 'rateLimitExceeded';
        break;
      case 500:
        type = 'serverError';
        break;
      case 502:
      case 503:
        type = 'serviceUnavailable';
        break;
      case 504:
        type = 'networkError';
        break;
      default:
        type = 'serverError';
    }

    return this.createError(type, customMessage, details, status);
  }

  /**
   * Create error from network/connection issues
   */
  static fromNetworkError(error: Error): ErrorInfo {
    const isConnectionLost = error.message.includes('Failed to fetch') || 
                            error.message.includes('Network request failed') ||
                            error.message.includes('ERR_NETWORK');
    
    const type: ErrorState = isConnectionLost ? 'connectionLost' : 'networkError';
    
    return this.createError(type, undefined, error.message);
  }

  /**
   * Create error for expired sessions or tokens
   */
  static createSessionExpiredError(details?: string): ErrorInfo {
    return this.createError('sessionExpired', undefined, details);
  }

  /**
   * Create error for invalid or expired links
   */
  static createLinkError(isExpired: boolean = false, details?: string): ErrorInfo {
    const type: ErrorState = isExpired ? 'expiredLink' : 'invalidLink';
    return this.createError(type, undefined, details);
  }

  /**
   * Create error for access/permission issues
   */
  static createAccessError(isForbidden: boolean = false, details?: string): ErrorInfo {
    const type: ErrorState = isForbidden ? 'forbidden' : 'accessDenied';
    return this.createError(type, undefined, details);
  }

  /**
   * Create error for file upload/download issues
   */
  static createFileError(isUpload: boolean = true, details?: string): ErrorInfo {
    const type: ErrorState = isUpload ? 'uploadError' : 'downloadError';
    return this.createError(type, undefined, details);
  }

  /**
   * Get user-friendly message for error type
   */
  static getMessage(type: ErrorState): string {
    return errorMessages[type];
  }

  /**
   * Check if error is critical (requires immediate user attention)
   */
  static isCritical(type: ErrorState): boolean {
    const criticalErrors: ErrorState[] = [
      'accountSuspended',
      'accessDenied',
      'forbidden',
      'serverError',
      'sessionExpired'
    ];
    return criticalErrors.includes(type);
  }

  /**
   * Check if error is temporary (user can retry)
   */
  static isRetryable(type: ErrorState): boolean {
    const retryableErrors: ErrorState[] = [
      'networkError',
      'connectionLost',
      'serviceUnavailable',
      'uploadError',
      'downloadError'
    ];
    return retryableErrors.includes(type);
  }

  /**
   * Get suggested actions for error types
   */
  static getSuggestedActions(type: ErrorState): string[] {
    switch (type) {
      case 'networkError':
      case 'connectionLost':
        return [
          'ইন্টারনেট সংযোগ পরীক্ষা করুন',
          'কিছুক্ষণ পর আবার চেষ্টা করুন'
        ];
      case 'sessionExpired':
        return [
          'আবার লগইন করুন',
          'পেজ রিফ্রেশ করুন'
        ];
      case 'expiredLink':
        return [
          'নতুন লিঙ্ক অনুরোধ করুন',
          'ইমেইল চেক করুন'
        ];
      case 'uploadError':
        return [
          'ফাইলের আকার পরীক্ষা করুন',
          'আবার চেষ্টা করুন'
        ];
      case 'validationError':
        return [
          'তথ্য সঠিকভাবে পূরণ করুন',
          'প্রয়োজনীয় ক্ষেত্রগুলি পূরণ করুন'
        ];
      default:
        return ['সাহায্যের জন্য সাপোর্ট টিমের সাথে যোগাযোগ করুন'];
    }
  }
}

import React from 'react';
import { ErrorAlert } from './alert';
import { ErrorInfo } from '@/lib/errorTypes';
import { ErrorManager } from '@/lib/errorManager';
import { Button } from './button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  errorInfo: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  showActions?: boolean;
  className?: string;
}

/**
 * Comprehensive error display component with suggested actions
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errorInfo,
  onRetry,
  onDismiss,
  showActions = true,
  className
}) => {
  const isRetryable = ErrorManager.isRetryable(errorInfo.type);
  const isCritical = ErrorManager.isCritical(errorInfo.type);
  const suggestedActions = ErrorManager.getSuggestedActions(errorInfo.type);

  return (
    <div className={cn("space-y-4", className)}>
      <ErrorAlert errorInfo={errorInfo} />
      
      {showActions && (
        <div className="space-y-3">
          {/* Suggested Actions */}
          {suggestedActions.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  পরামর্শিত সমাধান:
                </span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                {suggestedActions.map((action, index) => (
                  <li key={index} className="list-disc">
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {isRetryable && onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>আবার চেষ্টা করুন</span>
              </Button>
            )}
            
            {onDismiss && !isCritical && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="sm"
              >
                বন্ধ করুন
              </Button>
            )}

            {isCritical && (
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                size="sm"
              >
                পেজ রিফ্রেশ করুন
              </Button>
            )}
            
            <Button
              onClick={() => window.open('https://www.facebook.com/diplomabazar/', '_blank')}
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800"
            >
              সাহায্য নিন
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo?: ErrorInfo;
}

/**
 * Error boundary component for catching React errors
 */
export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<{ errorInfo: ErrorInfo; onRetry: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorInfo: ErrorManager.createError('serverError', 'অ্যাপ্লিকেশনে একটি ত্রুটি ঘটেছে', error.message)
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.errorInfo) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent errorInfo={this.state.errorInfo} onRetry={this.handleRetry} />;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorDisplay
              errorInfo={this.state.errorInfo}
              onRetry={this.handleRetry}
              showActions={true}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling errors in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<ErrorInfo | null>(null);

  const handleError = React.useCallback((errorInfo: ErrorInfo) => {
    setError(errorInfo);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleHttpError = React.useCallback((status: number, message?: string, details?: string) => {
    const errorInfo = ErrorManager.fromHttpStatus(status, message, details);
    handleError(errorInfo);
  }, [handleError]);

  const handleNetworkError = React.useCallback((networkError: Error) => {
    const errorInfo = ErrorManager.fromNetworkError(networkError);
    handleError(errorInfo);
  }, [handleError]);

  return {
    error,
    handleError,
    clearError,
    handleHttpError,
    handleNetworkError
  };
};

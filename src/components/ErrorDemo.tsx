import React, { useState } from 'react';
import { ErrorDisplay, ErrorBoundary, useErrorHandler } from './ui/error-display';
import { ErrorAlert } from './ui/alert';
import { ErrorManager } from '@/lib/errorManager';
import { ErrorState } from '@/lib/errorTypes';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

/**
 * Demo component to showcase error states and UI components
 */
export const ErrorDemo: React.FC = () => {
  const { error, handleError, clearError, handleHttpError, handleNetworkError } = useErrorHandler();
  const [selectedErrorType, setSelectedErrorType] = useState<ErrorState>('expiredLink');

  const errorTypes: ErrorState[] = [
    'expiredLink',
    'invalidLink',
    'accessDenied',
    'networkError',
    'serverError',
    'notFound',
    'unauthorized',
    'forbidden',
    'sessionExpired',
    'validationError',
    'uploadError',
    'downloadError',
    'connectionLost',
    'accountSuspended',
    'maintenanceMode',
    'rateLimitExceeded',
    'paymentRequired',
    'serviceUnavailable'
  ];

  const simulateError = (type: ErrorState) => {
    const errorInfo = ErrorManager.createError(
      type,
      undefined,
      `এটি একটি ${type} ত্রুটির উদাহরণ`
    );
    handleError(errorInfo);
  };

  const ThrowErrorComponent = () => {
    const [shouldThrow, setShouldThrow] = useState(false);
    
    if (shouldThrow) {
      throw new Error('এটি একটি React Error Boundary পরীক্ষা');
    }

    return (
      <Button 
        onClick={() => setShouldThrow(true)}
        variant="destructive"
      >
        React Error নিক্ষেপ করুন
      </Button>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Error State Management Demo</h1>
        <p className="text-muted-foreground">
          বিভিন্ন ত্রুটির অবস্থা এবং তাদের UI উপাদানগুলির প্রদর্শনী
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">মৌলিক Alert</TabsTrigger>
          <TabsTrigger value="comprehensive">বিস্তারিত প্রদর্শনী</TabsTrigger>
          <TabsTrigger value="interactive">ইন্টারেক্টিভ টেস্ট</TabsTrigger>
          <TabsTrigger value="boundary">Error Boundary</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>মৌলিক Error Alert উদাহরণ</CardTitle>
              <CardDescription>
                বিভিন্ন ত্রুটির ধরনের জন্য সরল Alert উপাদান
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorTypes.slice(0, 6).map((type) => (
                <ErrorAlert
                  key={type}
                  errorInfo={ErrorManager.createError(type)}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comprehensive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>বিস্তারিত Error Display</CardTitle>
              <CardDescription>
                পরামর্শিত সমাধান এবং কার্যক্রম বোতাম সহ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                'networkError',
                'sessionExpired',
                'uploadError',
                'accountSuspended'
              ].map((type) => (
                <ErrorDisplay
                  key={type}
                  errorInfo={ErrorManager.createError(
                    type as ErrorState,
                    undefined,
                    `${type} এর জন্য অতিরিক্ত বিবরণ`
                  )}
                  onRetry={() => console.log(`Retrying ${type}`)}
                  onDismiss={() => console.log(`Dismissing ${type}`)}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ইন্টারেক্টিভ Error হ্যান্ডলিং</CardTitle>
              <CardDescription>
                useErrorHandler hook ব্যবহার করে ত্রুটি পরিচালনা
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <select 
                  value={selectedErrorType}
                  onChange={(e) => setSelectedErrorType(e.target.value as ErrorState)}
                  className="border rounded px-3 py-1"
                >
                  {errorTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                
                <Button onClick={() => simulateError(selectedErrorType)}>
                  ত্রুটি সিমুলেট করুন
                </Button>

                <Button onClick={() => handleHttpError(404)} variant="outline">
                  404 Error
                </Button>

                <Button onClick={() => handleHttpError(500)} variant="outline">
                  500 Error
                </Button>

                <Button 
                  onClick={() => handleNetworkError(new Error('Failed to fetch'))} 
                  variant="outline"
                >
                  Network Error
                </Button>
              </div>

              {error && (
                <ErrorDisplay
                  errorInfo={error}
                  onRetry={() => {
                    console.log('Retrying...');
                    clearError();
                  }}
                  onDismiss={clearError}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boundary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>React Error Boundary</CardTitle>
              <CardDescription>
                React components এ ত্রুটি ধরা এবং পরিচালনা
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorBoundary
                onError={(error, errorInfo) => {
                  console.error('Error boundary caught:', error, errorInfo);
                }}
              >
                <div className="p-4 border rounded">
                  <p className="mb-4">
                    এই এলাকায় একটি React error নিক্ষেপ করুন Error Boundary পরীক্ষা করতে:
                  </p>
                  <ThrowErrorComponent />
                </div>
              </ErrorBoundary>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>HTTP Status Code Examples</CardTitle>
          <CardDescription>বিভিন্ন HTTP status code থেকে তৈরি ত্রুটি</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[400, 401, 403, 404, 429, 500, 503].map((status) => (
            <ErrorAlert
              key={status}
              errorInfo={ErrorManager.fromHttpStatus(status)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

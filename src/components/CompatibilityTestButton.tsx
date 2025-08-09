import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { TestTube, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TestResult {
  feature: string;
  supported: boolean;
  message: string;
  critical: boolean;
}

/**
 * CompatibilityTestButton Component
 * এক ক্লিকে browser compatibility check করার জন্য
 * Development/testing এর সময় ব্যবহার করা যাবে
 */
const CompatibilityTestButton: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  const runCompatibilityTest = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    // Test 1: Notification API
    try {
      const hasNotification = 'Notification' in window && typeof Notification !== 'undefined';
      testResults.push({
        feature: 'Web Notifications',
        supported: hasNotification,
        message: hasNotification 
          ? 'Notification API supported' 
          : 'Notification API not supported (expected in old browsers)',
        critical: false // Not critical since we have fallbacks
      });
    } catch (error) {
      testResults.push({
        feature: 'Web Notifications',
        supported: false,
        message: 'Error checking Notification API',
        critical: false
      });
    }

    // Test 2: Service Worker
    try {
      const hasServiceWorker = 'serviceWorker' in navigator;
      testResults.push({
        feature: 'Service Worker',
        supported: hasServiceWorker,
        message: hasServiceWorker 
          ? 'Service Worker supported' 
          : 'Service Worker not supported',
        critical: false
      });
    } catch (error) {
      testResults.push({
        feature: 'Service Worker',
        supported: false,
        message: 'Error checking Service Worker',
        critical: false
      });
    }

    // Test 3: Fetch API
    try {
      const hasFetch = 'fetch' in window;
      testResults.push({
        feature: 'Fetch API',
        supported: hasFetch,
        message: hasFetch 
          ? 'Modern HTTP requests supported' 
          : 'Using XMLHttpRequest fallback',
        critical: true // More critical for API calls
      });
    } catch (error) {
      testResults.push({
        feature: 'Fetch API',
        supported: false,
        message: 'Error checking Fetch API',
        critical: true
      });
    }

    // Test 4: ES6 Arrow Functions
    let hasES6 = false;
    try {
      eval('const test = () => {}; hasES6 = true;');
      testResults.push({
        feature: 'ES6 Support',
        supported: hasES6,
        message: hasES6 
          ? 'Modern JavaScript supported' 
          : 'Using ES5 compatibility mode',
        critical: true
      });
    } catch (error) {
      testResults.push({
        feature: 'ES6 Support',
        supported: false,
        message: 'ES6 not supported - using ES5 fallbacks',
        critical: true
      });
    }

    // Test 5: WebSocket
    try {
      const hasWebSocket = 'WebSocket' in window;
      testResults.push({
        feature: 'WebSocket',
        supported: hasWebSocket,
        message: hasWebSocket 
          ? 'Real-time communication supported' 
          : 'Using polling for real-time features',
        critical: false
      });
    } catch (error) {
      testResults.push({
        feature: 'WebSocket',
        supported: false,
        message: 'WebSocket not available',
        critical: false
      });
    }

    // Test 6: CSS Grid
    try {
      const hasGrid = CSS && CSS.supports && CSS.supports('display', 'grid');
      testResults.push({
        feature: 'CSS Grid',
        supported: hasGrid,
        message: hasGrid 
          ? 'Modern CSS layouts supported' 
          : 'Using flexbox fallbacks',
        critical: false
      });
    } catch (error) {
      testResults.push({
        feature: 'CSS Grid',
        supported: false,
        message: 'CSS.supports not available',
        critical: false
      });
    }

    // Test 7: Local Storage
    try {
      const hasLocalStorage = 'localStorage' in window;
      testResults.push({
        feature: 'Local Storage',
        supported: hasLocalStorage,
        message: hasLocalStorage 
          ? 'Data persistence available' 
          : 'Limited offline capabilities',
        critical: true
      });
    } catch (error) {
      testResults.push({
        feature: 'Local Storage',
        supported: false,
        message: 'Local Storage not available',
        critical: true
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate test time
    setResults(testResults);
    setTesting(false);
    setIsOpen(true);
  };

  const getOverallScore = () => {
    if (results.length === 0) return 0;
    const supportedCount = results.filter(r => r.supported).length;
    return Math.round((supportedCount / results.length) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'চমৎকার! সব আধুনিক ফিচার সাপোর্ট করে।';
    if (score >= 70) return 'ভাল! বেশিরভাগ ফিচার সাপোর্ট করে।';
    return 'পুরানো ব্রাউজার, বেসিক ফিচার কাজ করবে।';
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={runCompatibilityTest}
        disabled={testing}
        className="fixed bottom-4 left-4 z-50 bg-white/90 backdrop-blur-sm shadow-lg"
      >
        <TestTube className="w-4 h-4 mr-2" />
        {testing ? 'Testing...' : 'Browser Test'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Browser Compatibility Test
            </DialogTitle>
          </DialogHeader>

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(getOverallScore())}`}>
                  {getOverallScore()}% Compatible
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getScoreMessage(getOverallScore())}
                </p>
              </div>

              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.supported 
                        ? 'bg-green-50 border-green-200' 
                        : result.critical
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.supported ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : result.critical ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{result.feature}</div>
                        <div className="text-xs text-gray-600">{result.message}</div>
                      </div>
                    </div>
                    <Badge 
                      variant={result.supported ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {result.supported ? 'OK' : 'Limited'}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-500 text-center">
                💡 সাইট সব ক্ষেত্রেই কাজ করবে, শুধু কিছু advanced ফিচার limited হতে পারে।
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompatibilityTestButton;

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X, Settings } from 'lucide-react';
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  isNotificationSupported,
  checkNotificationEnvironment 
} from '@/lib/notificationUtils';

interface NotificationPermissionRequestProps {
  onPermissionGranted?: () => void;
  autoRequest?: boolean;
}

const NotificationPermissionRequest: React.FC<NotificationPermissionRequestProps> = ({
  onPermissionGranted,
  autoRequest = false
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<string>('default');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkAndShowPrompt();
  }, [autoRequest]);

  const checkAndShowPrompt = async () => {
    // Check if notifications are supported
    if (!isNotificationSupported()) {
      console.log('Notifications not supported in this browser');
      return;
    }

    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Check if user has dismissed the prompt before
    const hasBeenDismissed = localStorage.getItem('notification-prompt-dismissed') === 'true';
    
    if (currentPermission === 'default' && !hasBeenDismissed && !dismissed) {
      // Show prompt immediately for better user experience
      setTimeout(() => {
        setShowPrompt(true);
      }, 1000);
    }

    // Auto request if enabled and permission is default
    if (autoRequest && currentPermission === 'default' && !hasBeenDismissed) {
      // Auto-request immediately after a short delay
      setTimeout(async () => {
        console.log('🔔 Auto-requesting notification permission...');
        await requestPermission();
      }, 2000);
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setShowPrompt(false);
        onPermissionGranted?.();
        
        // Show success notification
        if (window.Notification) {
          new Notification('🎉 নোটিফিকেশন চালু হয়েছে!', {
            body: 'এখন আপনি নতুন মেসেজ এবং বুক রিকোয়েস্টের জন্য নোটিফিকেশন পাবেন।',
            icon: '/favicon.ico'
          });
        }
      } else if (result === 'denied') {
        setShowPrompt(false);
        // Show info about manual enabling
        alert('নোটিফিকেশন বন্ধ করা হয়েছে। ব্রাউজার সেটিংস থেকে চালু করতে পারেন।');
      }
    } catch (error) {
      console.error('Permission request error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  const handleNotNow = () => {
    setShowPrompt(false);
    // Don't mark as permanently dismissed, ask again later
  };

  const openBrowserSettings = () => {
    alert(
      'ব্রাউজার সেটিংসে যেতে:\n\n' +
      '1. ব্রাউজারের address bar এর পাশে তালা (🔒) বা তথ্য (ℹ️) আইকনে ক্লিক করুন\n' +
      '2. "Notifications" বা "নোটিফিকেশন" অপশন খুঁজুন\n' +
      '3. "Allow" বা "অনুমতি দিন" সিলেক্ট করুন\n' +
      '4. পেইজ রিফ্রেশ করুন'
    );
  };

  // Don't show if already granted or permanently dismissed
  if (permission === 'granted' || (!showPrompt && dismissed)) {
    return null;
  }

  // Show permission status for denied
  if (permission === 'denied') {
    return (
      <Card className="fixed bottom-4 right-4 w-80 bg-orange-50 border-orange-200 shadow-lg z-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-sm text-orange-800">নোটিফিকেশন বন্ধ</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-orange-600 hover:bg-orange-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-orange-700 mb-3">
            নোটিফিকেশন বন্ধ করা আছে। নতুন মেসেজ পেতে চালু করুন।
          </p>
          <Button
            onClick={openBrowserSettings}
            size="sm"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            সেটিংস খুলুন
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show permission request prompt
  if (showPrompt && permission === 'default') {
    return (
      <Card className="fixed bottom-4 right-4 w-80 bg-blue-50 border-blue-200 shadow-lg z-50 animate-in slide-in-from-right duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm text-blue-800">নোটিফিকেশন চালু করুন</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-xs text-blue-700 mb-3">
            নতুন মেসেজ, বুক রিকোয়েস্ট এবং অন্যান্য আপডেটের জন্য নোটিফিকেশন চালু করুন।
          </CardDescription>
          <div className="flex gap-2">
            <Button
              onClick={requestPermission}
              disabled={loading}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'অপেক্ষা করুন...' : '✓ চালু করুন'}
            </Button>
            <Button
              onClick={handleNotNow}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              পরে
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default NotificationPermissionRequest;

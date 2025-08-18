import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X, MessageSquare, ShoppingCart, AlertCircle } from 'lucide-react';
import { 
  getNotificationPermission, 
  isNotificationSupported,
  requestNotificationPermission 
} from '@/lib/notificationUtils';

const NotificationReminder: React.FC = () => {
  const [showReminder, setShowReminder] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we should show reminders
    const checkForReminders = () => {
      if (!isNotificationSupported()) return;

      const permission = getNotificationPermission();
      const lastReminderTime = localStorage.getItem('last-notification-reminder');
      const reminderDismissedPermanently = localStorage.getItem('notification-reminder-dismissed') === 'true';
      const currentTime = Date.now();

      // Don't show if permission is granted or permanently dismissed
      if (permission === 'granted' || reminderDismissedPermanently) {
        return;
      }

      // Show reminder for users who denied or haven't decided
      if (permission === 'denied' || permission === 'default') {
        // Show first reminder after 2 minutes of usage
        const firstReminderDelay = 2 * 60 * 1000; // 2 minutes
        
        if (!lastReminderTime) {
          // First time user - show reminder after delay
          setTimeout(() => {
            setShowReminder(true);
            setReminderCount(1);
            localStorage.setItem('last-notification-reminder', currentTime.toString());
          }, firstReminderDelay);
        } else {
          // Show periodic reminders (every 10 minutes, max 3 times)
          const timeSinceLastReminder = currentTime - parseInt(lastReminderTime);
          const reminderInterval = 10 * 60 * 1000; // 10 minutes
          const maxReminders = 3;

          const storedReminderCount = parseInt(localStorage.getItem('notification-reminder-count') || '0');
          
          if (timeSinceLastReminder > reminderInterval && storedReminderCount < maxReminders) {
            setShowReminder(true);
            setReminderCount(storedReminderCount + 1);
            localStorage.setItem('last-notification-reminder', currentTime.toString());
            localStorage.setItem('notification-reminder-count', (storedReminderCount + 1).toString());
          }
        }
      }
    };

    // Start checking after page loads
    const timer = setTimeout(checkForReminders, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const result = await requestNotificationPermission();
      
      if (result === 'granted') {
        setShowReminder(false);
        // Clear reminder data since permission is now granted
        localStorage.removeItem('last-notification-reminder');
        localStorage.removeItem('notification-reminder-count');
        localStorage.removeItem('notification-reminder-dismissed');
        
        // Show success notification
        if (window.Notification) {
          new Notification('🎉 দারুণ!', {
            body: 'এখন আপনি গুরুত্বপূর্ণ আপডেটের জন্য নোটিফিকেশন পাবেন।',
            icon: '/favicon.ico'
          });
        }
      } else if (result === 'denied') {
        setShowReminder(false);
        alert('নোটিফিকেশন বন্ধ করা হয়েছে। প্রয়োজনে ব্রাউজার সেটিংস থেকে চালু করতে পারেন।');
      }
    } catch (error) {
      console.error('Permission request error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissForever = () => {
    setShowReminder(false);
    localStorage.setItem('notification-reminder-dismissed', 'true');
  };

  const handleNotNow = () => {
    setShowReminder(false);
    // Will show again after the interval
  };

  if (!showReminder) return null;

  const getReminderMessage = () => {
    const messages = [
      {
        title: "নোটিফিকেশন মিস করছেন?",
        description: "নতুন মেসেজ এবং বুকের রিকোয়েস্ট পেতে নোটিফিকেশন চালু করুন।",
        icon: <MessageSquare className="h-5 w-5 text-blue-600" />
      },
      {
        title: "গুরুত্বপূর্ণ আপডেট মিস হচ্ছে!",
        description: "বইয়ের অর্ডার এবং নতুন মেসেজের জন্য নোটিফিকেশন প্রয়োজন।",
        icon: <ShoppingCart className="h-5 w-5 text-green-600" />
      },
      {
        title: "শেষ সুযোগ!",
        description: "নোটিফিকেশন ছাড়া আপনি অনেক সুযোগ হাতছাড়া করছেন।",
        icon: <AlertCircle className="h-5 w-5 text-orange-600" />
      }
    ];

    return messages[Math.min(reminderCount - 1, messages.length - 1)];
  };

  const message = getReminderMessage();

  return (
    <Card className="fixed bottom-4 left-4 w-80 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-xl z-50 animate-in slide-in-from-left duration-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {message.icon}
            <CardTitle className="text-sm text-gray-800">{message.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNotNow}
            className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-gray-600 mb-4">
          {message.description}
        </p>
        
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleEnableNotifications}
            disabled={loading}
            size="sm"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                অপেক্ষা করুন...
              </span>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                এখনই চালু করুন
              </>
            )}
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={handleNotNow}
              variant="outline"
              size="sm"
              className="flex-1 text-xs text-gray-600 border-gray-200 hover:bg-gray-50"
            >
              পরে
            </Button>
            {reminderCount >= 2 && (
              <Button
                onClick={handleDismissForever}
                variant="outline"
                size="sm"
                className="flex-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
              >
                আর দেখাবেন না
              </Button>
            )}
          </div>
        </div>
        
        {reminderCount > 0 && (
          <div className="mt-3 flex justify-center">
            <div className="flex gap-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${
                    step <= reminderCount ? 'bg-blue-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationReminder;

import React, { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { checkNotificationEnvironment, getNotificationErrorMessage } from '@/lib/notificationUtils';

interface FallbackNotificationProps {
  show?: boolean;
  onClose?: () => void;
}

/**
 * FallbackNotification Component
 * যে সকল ডিভাইসে Web Notifications API সাপোর্ট করে না
 * তাদের জন্য বিকল্প নোটিফিকেশন সিস্টেম
 */
const FallbackNotification: React.FC<FallbackNotificationProps> = ({ show = true, onClose }) => {
  const [hasShownWarning, setHasShownWarning] = useState(false);

  useEffect(() => {
    if (!show || hasShownWarning) return;

    const checkAndShowNotification = () => {
      const environment = checkNotificationEnvironment();
      
      // যদি notification সাপোর্ট না করে
      if (!environment.supported) {
        toast({
          title: "নোটিফিকেশন সাপোর্ট নেই",
          description: "আপনার ব্রাউজার/ফোনে নোটিফিকেশন সাপোর্ট নেই। নতুন মেসেজের জন্য পেজ রিফ্রেশ করুন।",
          duration: 5000,
        });
        
        setHasShownWarning(true);
        onClose?.();
        return;
      }

      // যদি permission দেওয়া না হয়
      if (environment.permission === 'denied') {
        toast({
          title: "নোটিফিকেশন বন্ধ আছে",
          description: "নোটিফিকেশন চালু করতে ব্রাউজার সেটিংসে গিয়ে অনুমতি দিন।",
          duration: 6000,
        });
        
        setHasShownWarning(true);
        onClose?.();
        return;
      }

      // যদি HTTPS না হয়
      if (!environment.secure) {
        toast({
          title: "নিরাপদ সংযোগ প্রয়োজন",
          description: "নোটিফিকেশনের জন্য HTTPS সংযোগ প্রয়োজন।",
          duration: 5000,
        });
        
        setHasShownWarning(true);
        onClose?.();
        return;
      }

      // যদি সব ঠিক থাকে
      if (environment.supported && environment.permission === 'granted' && environment.secure) {
        console.log('✅ Notification environment is optimal');
        setHasShownWarning(true);
        onClose?.();
      }
    };

    // একটু দেরি করে চেক করি যাতে পেজ লোড হয়ে যায়
    const timer = setTimeout(checkAndShowNotification, 2000);
    
    return () => clearTimeout(timer);
  }, [show, hasShownWarning, onClose]);

  // এই component কোনো UI render করে না, শুধু side effect চালায়
  return null;
};

export default FallbackNotification;

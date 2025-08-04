import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createNotification } from '@/lib/NotificationService';

const PushNotificationDebug: React.FC = () => {
  const { user } = useAuth();
  const { subscribed } = usePushNotifications(user?.id);

  useEffect(() => {
    console.log('🔍 Debug Component mounted');
    console.log('User:', user?.id);
    console.log('Subscribed:', subscribed);
  }, [user, subscribed]);

  const testNotification = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    try {
      console.log('🧪 Testing notification creation...');
      console.log('🔍 User ID:', user.id);
      
      const notificationPayload = {
        user_id: user.id,
        message: 'This is a test notification from debug component',
        type: 'message' as const,
        sender_id: user.id,
        action_url: '/messages'
      };
      
      console.log('📦 Notification payload:', notificationPayload);
      
      const result = await createNotification(notificationPayload);
      
      console.log('✅ Notification result:', result);
      
      if (result.error) {
        throw result.error;
      }
      
      alert('Test notification sent! Check your device.');
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      alert('Error: ' + (error?.message || error));
    }
  };

  const testPushServer = async () => {
    try {
      console.log('🧪 Testing push server...');
      const serverUrl = import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:4000';
      console.log('Using server URL:', serverUrl);
      
      const response = await fetch(serverUrl + '/subscriptions');
      const data = await response.json();
      console.log('Push server response:', data);
      alert(`Push server has ${data.count} subscriptions`);
    } catch (error) {
      console.error('❌ Push server error:', error);
      alert('Push server error: ' + error);
    }
  };

  if (!user) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid red',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h4>🔔 Push Notification Debug</h4>
      <p>User: {user?.email}</p>
      <p>Subscribed: {subscribed ? '✅' : '❌'}</p>
      <button onClick={testNotification} style={{ margin: '5px', padding: '5px' }}>
        Test Notification
      </button>
      <button onClick={testPushServer} style={{ margin: '5px', padding: '5px' }}>
        Check Push Server
      </button>
    </div>
  );
};

export default PushNotificationDebug;

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Complete Push Notification Fix');
console.log('==================================');

// Step 1: Fix RLS policies
async function fixRLSPolicies() {
  console.log('\n📋 Step 1: Fixing RLS Policies...');
  
  const rls_sql = `
-- Fix RLS policies for notifications table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow users to view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow any authenticated user to create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to create notifications" ON public.notifications;

-- Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to view their own notifications
CREATE POLICY "Allow users to view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy 2: Allow users to update their own notifications (mark as read, etc.)
CREATE POLICY "Allow users to update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow any authenticated user to create notifications
CREATE POLICY "Allow authenticated users to create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Allow users to delete their own notifications
CREATE POLICY "Allow users to delete their own notifications" 
  ON public.notifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;
GRANT UPDATE ON public.notifications TO authenticated;
GRANT DELETE ON public.notifications TO authenticated;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: rls_sql });
    if (error) {
      console.error('❌ RLS Policy update failed:', error);
    } else {
      console.log('✅ RLS Policies updated successfully');
    }
  } catch (error) {
    console.log('⚠️ RLS update failed, but this might be normal:', error.message);
  }
}

// Step 2: Test notification creation
async function testNotificationCreation() {
  console.log('\n📋 Step 2: Testing Notification Creation...');
  
  // Get current user or use a test UUID
  const { data: { user } } = await supabase.auth.getUser();
  const testUserId = user?.id || '00000000-0000-0000-0000-000000000000';
  
  const testNotification = {
    user_id: testUserId,
    title: 'Test Notification',
    message: 'This is a test notification to verify the system',
    type: 'message',
    is_read: false,
    sender_id: testUserId,
    related_id: null
  };
  
  const { data, error } = await supabase
    .from('notifications')
    .insert(testNotification)
    .select()
    .single();
    
  if (error) {
    console.error('❌ Test notification failed:', error);
    return false;
  } else {
    console.log('✅ Test notification created successfully');
    
    // Clean up test notification
    await supabase
      .from('notifications')
      .delete()
      .eq('id', data.id);
    
    return true;
  }
}

// Step 3: Check environment setup
function checkEnvironment() {
  console.log('\n📋 Step 3: Checking Environment Setup...');
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY'
  ];
  
  let allGood = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Present`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allGood = false;
    }
  });
  
  return allGood;
}

// Step 4: Create improved push notification debug component
function createImprovedDebugComponent() {
  console.log('\n📋 Step 4: Creating Improved Debug Component...');
  
  const improvedComponent = `import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createNotification } from '@/lib/NotificationService';

const PushNotificationDebug: React.FC = () => {
  const { user } = useAuth();
  const { subscribed } = usePushNotifications(user?.id);
  const [testStatus, setTestStatus] = useState<string>('');

  useEffect(() => {
    console.log('🔍 Debug Component mounted');
    console.log('User:', user?.id);
    console.log('Subscribed:', subscribed);
  }, [user, subscribed]);

  const testNotification = async () => {
    if (!user) {
      setTestStatus('❌ Please login first');
      return;
    }

    setTestStatus('🧪 Testing notification...');

    try {
      console.log('🧪 Testing notification creation...');
      console.log('🔍 User ID:', user.id);
      
      const notificationPayload = {
        user_id: user.id,
        message: 'This is a test notification from improved debug component',
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
      
      setTestStatus('✅ Test notification sent successfully!');
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      setTestStatus(\`❌ Error: \${error?.message || error}\`);
    }
  };

  const testPushServer = async () => {
    try {
      setTestStatus('🧪 Testing push server...');
      const serverUrl = import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:4000';
      console.log('Using server URL:', serverUrl);
      
      const response = await fetch(serverUrl + '/subscriptions');
      const data = await response.json();
      console.log('Push server response:', data);
      setTestStatus(\`✅ Push server has \${data.count} subscriptions\`);
    } catch (error) {
      console.error('❌ Push server error:', error);
      setTestStatus(\`❌ Push server error: \${error}\`);
    }
  };

  const resetSubscription = async () => {
    try {
      setTestStatus('🔄 Resetting subscription...');
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          console.log('✅ Old subscription removed');
        }
        
        // Reload to get new subscription
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Reset failed:', error);
      setTestStatus(\`❌ Reset failed: \${error}\`);
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
      padding: '15px',
      borderRadius: '8px',
      zIndex: 9999,
      fontSize: '12px',
      minWidth: '300px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🔔 Push Notification Debug</h4>
      <p><strong>User:</strong> {user?.email}</p>
      <p><strong>Subscribed:</strong> {subscribed ? '✅' : '❌'}</p>
      <p><strong>Status:</strong> {testStatus}</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
        <button 
          onClick={testNotification} 
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Notification
        </button>
        
        <button 
          onClick={testPushServer} 
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Check Push Server
        </button>
        
        <button 
          onClick={resetSubscription} 
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#ffc107', 
            color: 'black', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset Subscription
        </button>
      </div>
    </div>
  );
};

export default PushNotificationDebug;`;

  try {
    fs.writeFileSync('./src/components/PushNotificationDebugImproved.tsx', improvedComponent);
    console.log('✅ Improved debug component created');
    return true;
  } catch (error) {
    console.error('❌ Failed to create debug component:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive push notification fix...\n');
  
  // Step 1: Check environment
  const envOk = checkEnvironment();
  if (!envOk) {
    console.log('\n❌ Environment check failed. Please fix missing variables.');
    return;
  }
  
  // Step 2: Fix RLS policies
  await fixRLSPolicies();
  
  // Step 3: Test notification creation
  const notificationOk = await testNotificationCreation();
  if (!notificationOk) {
    console.log('\n❌ Notification test failed. Please check database setup.');
    return;
  }
  
  // Step 4: Create improved debug component
  createImprovedDebugComponent();
  
  console.log('\n🎉 Push notification fix completed!');
  console.log('📋 Next steps:');
  console.log('1. Start push server: npm run push-server');
  console.log('2. Start dev server: npm run dev');
  console.log('3. Test using the improved debug component');
  console.log('4. Check browser console for detailed logs');
}

main().catch(console.error);

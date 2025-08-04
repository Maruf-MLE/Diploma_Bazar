import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Complete Push Notification System Test');
console.log('=========================================');

async function completePushTest() {
  try {
    // Step 1: Check table existence
    console.log('\n📋 Step 1: Checking push_subscriptions table...');
    
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access failed:', error);
      console.log('\n🛠️ Please run the SQL commands from fix_push_subscriptions_rls.sql in Supabase Dashboard');
      return;
    }
    
    console.log('✅ push_subscriptions table is accessible');
    
    // Step 2: Test VAPID keys
    console.log('\n📋 Step 2: Checking VAPID keys...');
    const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    
    console.log('VAPID Public Key:', vapidPublic ? `${vapidPublic.substring(0, 20)}...` : '❌ Missing');
    console.log('VAPID Private Key:', vapidPrivate ? `${vapidPrivate.substring(0, 20)}...` : '❌ Missing');
    
    if (!vapidPublic || !vapidPrivate) {
      console.log('⚠️ VAPID keys missing! Generate new ones:');
      console.log('Run: npm run generate-vapid');
    }
    
    // Step 3: Test push server URL
    console.log('\n📋 Step 3: Testing push server...');
    const pushServerUrl = process.env.VITE_PUSH_SERVER_URL || 'http://localhost:4000';
    console.log('Push Server URL:', pushServerUrl);
    
    try {
      const response = await fetch(pushServerUrl);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Push server is running:', data.message);
      } else {
        console.log('⚠️ Push server responded with status:', response.status);
      }
    } catch (error) {
      console.log('❌ Push server not accessible:', error.message);
      console.log('💡 Start push server with: npm run push-server');
    }
    
    // Step 4: Simulate subscription creation (for testing purposes)
    console.log('\n📋 Step 4: Testing subscription creation flow...');
    
    // Simulate what the browser would do
    await testSubscriptionFlow();
    
    // Step 5: Test notification creation
    console.log('\n📋 Step 5: Testing notification creation...');
    await testNotificationCreation();
    
    console.log('\n🎉 Complete push notification test finished!');
    console.log('\n📝 Next Steps:');
    console.log('1. If any errors above, run fix_push_subscriptions_rls.sql in Supabase Dashboard');
    console.log('2. Make sure push server is running: npm run push-server');
    console.log('3. Test in browser with authenticated user');
    console.log('4. Check browser console for detailed subscription logs');
    
  } catch (error) {
    console.error('❌ Complete test failed:', error);
  }
}

async function testSubscriptionFlow() {
  // Test what happens when we try to store a subscription
  const testSubscription = {
    user_id: '12345678-1234-1234-1234-123456789012', // Test UUID
    endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
    auth_key: btoa('test-auth-key-data'),
    p256dh_key: btoa('test-p256dh-key-data'),
    is_active: true,
    device_info: {
      userAgent: 'Test User Agent',
      timestamp: new Date().toISOString(),
      url: 'http://localhost:5173'
    }
  };
  
  console.log('🧪 Testing subscription storage...');
  
  // This will fail due to RLS, but we can see the error type
  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert(testSubscription)
    .select()
    .single();
  
  if (error) {
    if (error.code === '42501') {
      console.log('⚠️ RLS policy working (need authenticated user)');
    } else {
      console.error('❌ Unexpected error:', error);
    }
  } else {
    console.log('✅ Test subscription created (this should not happen without auth)');
    // Clean up
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('id', data.id);
  }
}

async function testNotificationCreation() {
  // Test notification table
  const testNotification = {
    user_id: '12345678-1234-1234-1234-123456789012',
    title: 'Test Push Notification',
    message: 'This is a test notification for push system',
    type: 'test',
    sender_id: '12345678-1234-1234-1234-123456789012'
  };
  
  console.log('🧪 Testing notification creation...');
  
  const { data, error } = await supabase
    .from('notifications')
    .insert(testNotification)
    .select()
    .single();
  
  if (error) {
    if (error.code === '42501') {
      console.log('⚠️ Notification RLS working (need authenticated user)');
    } else {
      console.error('❌ Notification creation error:', error);
    }
  } else {
    console.log('✅ Test notification created');
    // Clean up
    await supabase
      .from('notifications')
      .delete()
      .eq('id', data.id);
  }
}

// Run the complete test
completePushTest();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get notification title based on type
 */
function getNotificationTitle(type) {
  const titles = {
    purchase_request: 'কেনার অনুরোধ',
    request_accepted: 'অনুরোধ গৃহীত',
    request_rejected: 'অনুরোধ প্রত্যাখ্যাত',
    book_sold: 'বই বিক্রি হয়েছে',
    book_available: 'বই উপলব্ধ',
    payment_received: 'পেমেন্ট পাওয়া গেছে',
    payment_sent: 'পেমেন্ট পাঠানো হয়েছে',
    message: 'নতুন বার্তা',
    verification_approved: 'যাচাই অনুমোদিত',
    verification_rejected: 'যাচাই প্রত্যাখ্যাত',
    book_added: 'নতুন বই যোগ হয়েছে'
  };
  return titles[type] || 'নোটিফিকেশন';
}

async function debugNotificationCreation() {
  try {
    console.log('🔍 Starting notification debug...');
    
    // Get a user to test with
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ No authenticated user, using test user ID');
    }
    
    // Use a test user ID if no authenticated user (valid UUID format)
    const testUserId = user?.id || '550e8400-e29b-41d4-a716-446655440000';
    
    console.log('👤 Using user ID:', testUserId);
    
    // Test different notification types
    const testTypes = ['message', 'purchase_request', 'book_added'];
    
    for (const type of testTypes) {
      console.log(`\n🧪 Testing notification type: ${type}`);
      
      const title = getNotificationTitle(type);
      console.log('📝 Generated title:', title);
      console.log('📝 Title type:', typeof title);
      console.log('📝 Title length:', title?.length);
      console.log('📝 Title is truthy:', !!title);
      
      const notificationData = {
        user_id: testUserId,
        title: title,
        message: `Test message for ${type} notification`,
        type: type,
        is_read: false,
        sender_id: testUserId,
        related_id: null,
        action_url: '/messages'
      };
      
      console.log('💾 Final notification data:');
      console.log(JSON.stringify(notificationData, null, 2));
      
      // Check if all required fields are present
      const requiredFields = ['user_id', 'title', 'message', 'type'];
      const missingFields = requiredFields.filter(field => !notificationData[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        continue;
      }
      
      console.log('✅ All required fields are present');
      
      // Try to insert the notification
      console.log('💾 Attempting to insert notification...');
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Database error for ${type}:`, error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log(`✅ Successfully created ${type} notification:`, data);
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the debug function
debugNotificationCreation().then(() => {
  console.log('\n🏁 Debug completed');
}).catch(error => {
  console.error('💥 Debug failed:', error);
});

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkPushTable() {
  try {
    console.log('Checking push_subscriptions table...');
    
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ push_subscriptions table does not exist or has issues');
      console.log('Error:', error.message);
      console.log('\n🔧 Need to create the table with this SQL:');
      console.log(`
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);`);
    } else {
      console.log('✅ push_subscriptions table exists and is accessible');
      console.log('Current subscriptions count:', data.length);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkPushTable();

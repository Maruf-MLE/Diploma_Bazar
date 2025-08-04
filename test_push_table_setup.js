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

console.log('🔍 Push Notifications Table Setup Check');
console.log('======================================');

async function checkPushTableSetup() {
  try {
    // Step 1: Check if table exists and get structure
    console.log('\n📋 Step 1: Checking table structure...');
    
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table does not exist or has issues:', error);
      console.log('\n🛠️ Creating push_subscriptions table...');
      await createPushSubscriptionsTable();
      return;
    }
    
    console.log('✅ push_subscriptions table exists');
    
    // Step 2: Check table permissions
    console.log('\n📋 Step 2: Testing table permissions...');
    
    // Try to insert a test record
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testData = {
      user_id: testUserId,
      endpoint: 'https://test-endpoint.com/test',
      auth_key: 'test-auth-key',
      p256dh_key: 'test-p256dh-key',
      is_active: true,
      device_info: { test: true }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('push_subscriptions')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert permission failed:', insertError);
      console.log('🛠️ Fixing table permissions...');
      await fixTablePermissions();
    } else {
      console.log('✅ Insert permission works');
      
      // Clean up test record
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Test record cleaned up');
    }
    
    // Step 3: Check if RLS policies exist
    console.log('\n📋 Step 3: Checking RLS policies...');
    await checkRLSPolicies();
    
    // Step 4: Test with real user data (if available)
    console.log('\n📋 Step 4: Testing with real user data...');
    await testWithRealUser();
    
    console.log('\n🎉 Push notifications table setup check completed!');
    
  } catch (error) {
    console.error('❌ Setup check failed:', error);
  }
}

async function createPushSubscriptionsTable() {
  const createTableSQL = `
    -- Create push_subscriptions table
    CREATE TABLE IF NOT EXISTS public.push_subscriptions (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      endpoint text NOT NULL,
      auth_key text NOT NULL,
      p256dh_key text NOT NULL,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
      updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
      is_active boolean DEFAULT true,
      device_info jsonb DEFAULT '{}',
      CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
      CONSTRAINT fk_push_subscriptions_user_id FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
    );
  `;
  
  try {
    // Since we can't use exec_sql, we'll use a different approach
    console.log('⚠️ Please run this SQL manually in Supabase Dashboard:');
    console.log(createTableSQL);
    console.log('\nThen run the following commands:');
    console.log(`
-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_user_endpoint 
ON public.push_subscriptions USING btree (user_id, endpoint);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
ON public.push_subscriptions USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
ON public.push_subscriptions USING btree (is_active);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own push subscriptions" 
  ON public.push_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" 
  ON public.push_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" 
  ON public.push_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" 
  ON public.push_subscriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
    `);
  } catch (error) {
    console.error('❌ Failed to create table:', error);
  }
}

async function fixTablePermissions() {
  console.log('🔧 Table permissions need to be fixed manually in Supabase Dashboard');
  console.log('Run these commands:');
  console.log(`
-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT USAGE ON SEQUENCE push_subscriptions_id_seq TO authenticated;
  `);
}

async function checkRLSPolicies() {
  // We can't directly check policies via the API, so we'll try operations
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ User authenticated, RLS should work');
    } else {
      console.log('⚠️ No authenticated user, cannot test RLS policies');
    }
  } catch (error) {
    console.log('⚠️ Could not check authentication status');
  }
}

async function testWithRealUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('⚠️ No authenticated user for real test');
      return;
    }
    
    console.log('👤 Testing with user:', user.id);
    
    // Try to query existing subscriptions
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('❌ Query failed:', error);
    } else {
      console.log(`✅ Found ${data.length} existing subscriptions for user`);
    }
    
  } catch (error) {
    console.log('⚠️ Real user test failed:', error.message);
  }
}

// Run the check
checkPushTableSetup();

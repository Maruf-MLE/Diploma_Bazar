import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Try to load environment variables
try {
  dotenv.config();
} catch (err) {
  console.log('No .env file found or dotenv not available. Using environment variables directly.');
}

// Function to get Supabase credentials
const getSupabaseCredentials = () => {
  // Check for credentials in environment
  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  let key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  
  // If not found, prompt user
  if (!url || !key) {
    console.log('Supabase credentials not found in environment variables.');
    
    // In a real implementation, we would prompt for these values
    // For now, use hardcoded test values only if explicitly provided
    url = url || 'https://your-project.supabase.co';  // Replace with your actual URL
    key = key || 'your-anon-key';  // Replace with your actual key
    
    console.log('Using default/placeholder credentials. Please update with real values.');
  }
  
  return { url, key };
};

// Get credentials
const { url: supabaseUrl, key: supabaseKey } = getSupabaseCredentials();

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create ban table SQL
const createBanTableSQL = `
  -- Create a simplified user_ban_status table if it doesn't exist
  CREATE TABLE IF NOT EXISTS "public"."user_ban_status" (
    "user_id" UUID PRIMARY KEY,
    "is_banned" BOOLEAN DEFAULT FALSE,
    "banned_at" TIMESTAMP WITH TIME ZONE,
    "banned_by" TEXT,
    "ban_reason" TEXT,
    "ban_expires_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  -- Enable RLS with a permissive policy
  ALTER TABLE "public"."user_ban_status" ENABLE ROW LEVEL SECURITY;
  
  -- Create or replace policy
  DROP POLICY IF EXISTS "Allow all operations" ON "public"."user_ban_status";
  CREATE POLICY "Allow all operations" ON "public"."user_ban_status" USING (true);
  
  -- Create helper function for banning users
  CREATE OR REPLACE FUNCTION ban_user(user_id UUID, is_banned BOOLEAN, admin_id TEXT, reason TEXT, expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL)
  RETURNS BOOLEAN AS $$
  BEGIN
    INSERT INTO user_ban_status (user_id, is_banned, banned_at, banned_by, ban_reason, ban_expires_at, updated_at)
    VALUES (user_id, is_banned, CASE WHEN is_banned THEN now() ELSE NULL END, admin_id, reason, expires_at, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET
      is_banned = EXCLUDED.is_banned,
      banned_at = EXCLUDED.banned_at,
      banned_by = EXCLUDED.banned_by,
      ban_reason = EXCLUDED.ban_reason,
      ban_expires_at = EXCLUDED.ban_expires_at,
      updated_at = now();
    
    RETURN TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN FALSE;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
`;

// Direct approach for creating/fixing the ban system
async function ensureBanSystemExists() {
  try {
    // Test if we can access the database at all
    console.log('Testing database connection...');
    const { data, error } = await supabase.from('_test_connection')
      .select('*')
      .limit(1)
      .catch(() => ({ data: null, error: { message: 'Connection test failed' } }));
    
    if (error && !error.message.includes('relation "_test_connection" does not exist')) {
      console.error('Database connection error:', error);
      return false;
    }
    
    console.log('Connection test successful');
    
    // Check if the ban table already exists
    console.log('Checking if ban table exists...');
    const { error: tableError } = await supabase
      .from('user_ban_status')
      .select('user_id')
      .limit(1);
    
    // Create the table if needed
    if (tableError) {
      console.log('Ban table needs to be created or fixed');
      
      // Try direct SQL through RPC
      try {
        console.log('Attempting to create ban table through SQL...');
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: createBanTableSQL });
        
        if (sqlError) {
          console.error('SQL execution error:', sqlError);
          
          // Try direct table creation using insert
          console.log('Trying alternative table creation approach...');
          try {
            const { error: insertError } = await supabase
              .from('user_ban_status')
              .insert({
                user_id: '00000000-0000-0000-0000-000000000000',
                is_banned: false,
                banned_by: 'system',
                ban_reason: 'system test'
              });
            
            if (insertError && !insertError.message.includes('duplicate')) {
              console.error('Direct insert error:', insertError);
              return false;
            }
            
            console.log('Ban table created through direct insert');
            return true;
          } catch (insertErr) {
            console.error('Insert approach failed:', insertErr);
            return false;
          }
        } else {
          console.log('Ban table created through SQL');
          return true;
        }
      } catch (sqlErr) {
        console.error('SQL approach failed:', sqlErr);
        return false;
      }
    }
    
    console.log('Ban table already exists');
    return true;
  } catch (err) {
    console.error('Unexpected error in ban system setup:', err);
    return false;
  }
}

// Test ban functionality
async function testBanSystem() {
  try {
    const testUserId = '00000000-0000-0000-0000-000000000000';
    
    console.log('Testing ban functionality...');
    
    // Test ban
    const { error: banError } = await supabase
      .from('user_ban_status')
      .upsert({
        user_id: testUserId,
        is_banned: true,
        banned_at: new Date().toISOString(),
        banned_by: 'test-script',
        ban_reason: 'Testing ban functionality',
        updated_at: new Date().toISOString()
      });
    
    if (banError) {
      console.error('Error in ban test:', banError);
      return false;
    }
    
    // Test unban
    const { error: unbanError } = await supabase
      .from('user_ban_status')
      .update({ 
        is_banned: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testUserId);
    
    if (unbanError) {
      console.error('Error in unban test:', unbanError);
      return false;
    }
    
    console.log('Ban functionality test successful');
    return true;
  } catch (err) {
    console.error('Error testing ban functionality:', err);
    return false;
  }
}

// Run the setup
async function run() {
  try {
    console.log('Starting ban system setup and testing...');
    console.log(`Using Supabase URL: ${supabaseUrl}`);
    console.log(`API Key (first 5 chars): ${supabaseKey.substring(0, 5)}...`);
    
    // Ensure the ban system exists
    const systemSetup = await ensureBanSystemExists();
    
    if (!systemSetup) {
      console.error('Failed to set up ban system');
      return;
    }
    
    // Test ban functionality
    const testResult = await testBanSystem();
    
    if (testResult) {
      console.log('Ban system is working properly!');
      
      // Write instruction to a file
      const instructions = `
===== USER BAN SYSTEM SETUP COMPLETE =====

Your user ban system is now properly set up and working! The admin panel should now
be able to ban and unban users successfully.

If you still experience issues, please:
1. Check browser console for any error messages
2. Ensure your admin account has proper permissions
3. Try refreshing the admin panel page

===========================================
      `;
      
      try {
        fs.writeFileSync('ban_system_setup_complete.txt', instructions);
        console.log('Setup instructions written to ban_system_setup_complete.txt');
      } catch (fileError) {
        console.log('Could not write instruction file:', fileError);
      }
    } else {
      console.error('Ban system test failed');
    }
  } catch (err) {
    console.error('Error in setup process:', err);
  }
}

// Execute the script
run(); 
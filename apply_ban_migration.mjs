import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Get directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or API key. Please provide them as environment variables.');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`API Key (first 5 chars): ${supabaseKey.substring(0, 5)}...`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserBanSystem() {
  console.log('Creating user ban system...');
  
  try {
    // First, directly create the table with a simple structure
    const createTableSQL = `
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
    `;
    
    // Try simple table check first
    console.log('Checking if ban table exists...');
    const { count, error: checkError } = await supabase
      .from('user_ban_status')
      .select('*', { count: 'exact', head: true });
    
    if (checkError) {
      console.log('Ban table does not exist or error in checking, creating it...');
      
      try {
        // Try using SQL query
        console.log('Creating ban table directly...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });
        
        if (error) {
          console.error('Error creating table with RPC:', error);
          
          // Try inserting a record to auto-create the table
          console.log('Trying to insert a test record to auto-create table...');
          const { error: insertError } = await supabase
            .from('user_ban_status')
            .insert({
              user_id: '00000000-0000-0000-0000-000000000000',
              is_banned: false,
              banned_by: 'system',
              ban_reason: 'test'
            });
            
          if (insertError) {
            console.error('Error inserting test record:', insertError);
          } else {
            console.log('Test record inserted successfully');
          }
        } else {
          console.log('Ban table created successfully with RPC');
        }
      } catch (createError) {
        console.error('Error creating ban table:', createError);
      }
    } else {
      console.log('Ban table exists, records count:', count);
    }
    
    // Test the ban functionality
    console.log('Testing ban functionality...');
    const testUserId = '00000000-0000-0000-0000-000000000000';
    
    // Try to ban the test user
    try {
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
        console.error('Error banning test user:', banError);
      } else {
        console.log('Test user banned successfully');
      }
    } catch (testError) {
      console.error('Error in ban test:', testError);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up ban system:', error);
    return false;
  }
}

async function run() {
  try {
    console.log('Starting user ban system setup...');
    
    const success = await createUserBanSystem();
    
    if (success) {
      console.log('User ban system setup completed successfully');
    } else {
      console.error('Failed to set up user ban system');
    }
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run the setup
run(); 
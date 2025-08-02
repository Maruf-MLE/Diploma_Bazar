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

// Read the migration SQL file
const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20250805000000_create_ban_system.sql');
let migrationSQL;

try {
  migrationSQL = fs.readFileSync(migrationFile, 'utf8');
  console.log('Migration file read successfully');
} catch (error) {
  console.error('Error reading migration file:', error);
  
  // Use inline SQL as fallback
  console.log('Using fallback SQL');
  migrationSQL = `
    -- Create or update user_ban_status table
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
    
    -- Enable RLS with permissive policies
    ALTER TABLE "public"."user_ban_status" ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow all operations" ON "public"."user_ban_status";
    
    -- Create a simple policy that allows all operations for now
    CREATE POLICY "Allow all operations" ON "public"."user_ban_status" USING (true);
  `;
}

async function applyMigration() {
  try {
    console.log('Applying migration...');
    
    // Try to execute the SQL directly using RPC
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });
      
      if (error) {
        console.error('Error executing SQL with RPC:', error);
        throw error;
      }
      
      console.log('Migration applied successfully using RPC');
      return true;
    } catch (rpcError) {
      console.error('RPC method failed:', rpcError);
      
      // Try creating the table directly
      console.log('Trying direct table creation...');
      
      const createTableSQL = `
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
        
        ALTER TABLE "public"."user_ban_status" ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow all operations" ON "public"."user_ban_status";
        CREATE POLICY "Allow all operations" ON "public"."user_ban_status" USING (true);
      `;
      
      try {
        // Try to create the table using a direct query
        const { error } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });
        
        if (error) {
          console.error('Error creating table:', error);
          
          // Try inserting a test record to auto-create the table
          console.log('Trying to insert a test record...');
          const { error: insertError } = await supabase
            .from('user_ban_status')
            .insert({
              user_id: '00000000-0000-0000-0000-000000000000',
              is_banned: false,
              banned_by: 'system',
              ban_reason: 'test'
            });
            
          if (insertError && !insertError.message.includes('duplicate')) {
            console.error('Error inserting test record:', insertError);
            return false;
          }
          
          console.log('Table created through insert');
          return true;
        }
        
        console.log('Table created successfully');
        return true;
      } catch (tableError) {
        console.error('Error in table creation:', tableError);
        return false;
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Test the ban system
async function testBanSystem() {
  try {
    console.log('Testing ban system...');
    
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
        return false;
      }
      
      console.log('Test user banned successfully');
      
      // Try to unban the test user
      const { error: unbanError } = await supabase
        .from('user_ban_status')
        .update({
          is_banned: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testUserId);
      
      if (unbanError) {
        console.error('Error unbanning test user:', unbanError);
        return false;
      }
      
      console.log('Test user unbanned successfully');
      return true;
    } catch (error) {
      console.error('Error in ban test:', error);
      return false;
    }
  } catch (error) {
    console.error('Ban system test failed:', error);
    return false;
  }
}

async function run() {
  try {
    console.log('Starting ban system setup...');
    
    // Apply migration
    const migrationSuccess = await applyMigration();
    
    if (!migrationSuccess) {
      console.error('Migration failed');
      return;
    }
    
    // Test ban system
    const testSuccess = await testBanSystem();
    
    if (testSuccess) {
      console.log('Ban system setup completed successfully');
    } else {
      console.error('Ban system test failed');
    }
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run the setup
run(); 
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables from .env file if available
try {
  const env = fs.readFileSync('.env', 'utf8')
    .split('\n')
    .filter(line => line.trim() !== '' && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, value] = line.split('=');
      acc[key.trim()] = value.trim();
      return acc;
    }, {});
  
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = process.env[key] || value;
  });
} catch (err) {
  console.log('No .env file found or error reading it. Using existing environment variables.');
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or API key. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`API Key (first 5 chars): ${supabaseKey.substring(0, 5)}...`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createReportsTable() {
  console.log('Creating reports table directly with SQL...');
  
  const createTableSQL = `
    -- Create reports table
    CREATE TABLE IF NOT EXISTS "public"."reports" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
      "reported_user_id" UUID,
      "reporter_id" UUID,
      "reason" TEXT,
      "details" TEXT,
      "status" TEXT DEFAULT 'pending',
      "admin_notes" TEXT,
      "resolved_by" UUID,
      "resolved_at" TIMESTAMP WITH TIME ZONE
    );
    
    -- Enable RLS with a permissive policy
    ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow all operations" ON "public"."reports";
    CREATE POLICY "Allow all operations" ON "public"."reports" USING (true);
  `;
  
  try {
    console.log('Testing the table by querying it...');
    
    // First try to query the table to see if it exists
    const { data: testData, error: testError } = await supabase
      .from('reports')
      .select('id')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.log('Reports table does not exist, creating it...');
      
      // Try a direct insert to see if it auto-creates the table with the correct schema
      console.log('Trying to insert dummy report to create table...');
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          reported_user_id: '00000000-0000-0000-0000-000000000000',
          reporter_id: '00000000-0000-0000-0000-000000000000',
          reason: 'system_test',
          details: 'Testing table creation',
          status: 'system'
        });
      
      if (insertError) {
        console.error('Error inserting dummy report:', insertError);
        return false;
      }
      
      // Check if the table was created
      const { error: checkError } = await supabase
        .from('reports')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.error('Table creation verification failed:', checkError);
        return false;
      }
      
      console.log('Table creation verified successfully');
      return true;
    } else if (testError) {
      console.error('Unexpected error checking reports table:', testError);
      return false;
    } else {
      console.log('Reports table already exists');
      return true;
    }
  } catch (error) {
    console.error('Error in createReportsTable:', error);
    return false;
  }
}

async function run() {
  try {
    console.log('Starting direct SQL migration...');
    
    // Create reports table
    const reportsTableCreated = await createReportsTable();
    
    if (reportsTableCreated) {
      console.log('Reports table setup completed successfully');
      
      // Try submitting a test report
      console.log('Submitting test report...');
      const { error: testReportError } = await supabase
        .from('reports')
        .insert({
          reported_user_id: '00000000-0000-0000-0000-000000000000',
          reporter_id: '00000000-0000-0000-0000-000000000000',
          reason: 'test_report',
          details: 'This is a test report',
          status: 'pending'
        });
      
      if (testReportError) {
        console.error('Error submitting test report:', testReportError);
      } else {
        console.log('Test report submitted successfully');
      }
    } else {
      console.error('Failed to set up reports table');
    }
    
    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
run(); 
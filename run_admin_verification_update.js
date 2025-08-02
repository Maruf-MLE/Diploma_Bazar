// Script to update verification system to require admin approval
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load SQL file
const sqlFile = fs.readFileSync('./supabase/migrations/20250830000000_update_verification_admin_approval.sql', 'utf8');

// Supabase connection details
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  if (!supabaseKey) {
    console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
    process.exit(1);
  }

  try {
    console.log('Applying verification system update to require admin approval...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlFile });
    
    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('Verification system successfully updated to require admin approval');
    console.log('SQL execution result:', data);
    
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main(); 
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Get Supabase credentials from environment variables or replace with your values
const supabaseUrl = process.env.SUPABASE_URL || 'your_supabase_url';
const supabaseKey = process.env.SUPABASE_KEY || 'your_supabase_service_key'; // Should be service key

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Starting reports system migration...');
    
    // Read the migration files
    const migrationFiles = [
      'supabase/migrations/20250801000000_create_reports_table.sql',
      'supabase/migrations/20250802000000_create_exec_sql_function.sql',
      'supabase/migrations/20250803000000_create_simple_reports_helper.sql'
    ];
    
    for (const filePath of migrationFiles) {
      try {
        console.log(`Reading file: ${filePath}`);
        const sql = await fs.readFile(path.join(process.cwd(), filePath), 'utf8');
        
        console.log(`Executing SQL from ${filePath}...`);
        const { data, error } = await supabase.rpc('exec_sql_unsafe', { sql });
        
        if (error) {
          console.error(`Error applying migration from ${filePath}:`, error);
          
          // Try running as direct query if RPC fails
          console.log('Trying direct query...');
          const { error: directError } = await supabase.rpc('exec_sql', { sql_query: sql });
          
          if (directError) {
            console.error('Direct query also failed:', directError);
          } else {
            console.log(`Successfully applied ${filePath} via direct query`);
          }
        } else {
          console.log(`Successfully applied ${filePath}`);
        }
      } catch (fileError) {
        console.error(`Error processing file ${filePath}:`, fileError);
      }
    }
    
    // Test creating a reports table with the simple function
    try {
      console.log('Testing create_reports_table_simple function...');
      const { data, error } = await supabase.rpc('create_reports_table_simple');
      
      if (error) {
        console.error('Error creating reports table with simple function:', error);
      } else {
        console.log('Reports table created or already exists');
      }
    } catch (functionError) {
      console.error('Error testing report table creation:', functionError);
    }
    
    // Check if the reports table exists
    try {
      console.log('Checking if reports table exists...');
      const { data, error } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error checking reports table:', error);
      } else {
        console.log('Reports table exists and is accessible');
      }
    } catch (checkError) {
      console.error('Error checking reports table:', checkError);
    }
    
    console.log('Migration completed');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Execute migration
applyMigration(); 
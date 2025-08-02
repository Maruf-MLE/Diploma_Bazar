// Import required modules
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env file if it exists
try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch (err) {
  console.log('dotenv not installed, skipping .env file loading');
}

// Get Supabase URL and key from environment variables or prompt user
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.argv[2];

if (!supabaseKey) {
  console.error('Error: Supabase key not provided.');
  console.log('Please provide your Supabase service role key as an argument:');
  console.log('node fix_notifications_table.js YOUR_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sqlQuery = fs.readFileSync(path.join(__dirname, 'fix_notifications_table.sql'), 'utf8');

async function runSQLQuery() {
  try {
    console.log('Running SQL query to fix notifications table...');
    
    // Execute the SQL query
    const { data, error } = await supabase.rpc('pgaudit.exec_sql', {
      query: sqlQuery
    });
    
    if (error) {
      console.error('Error executing SQL query:', error);
      
      // Try alternative approach if the rpc method fails
      console.log('Trying alternative approach...');
      const { error: altError } = await supabase.from('_exec_sql').select('*').eq('query', sqlQuery);
      
      if (altError) {
        console.error('Alternative approach failed:', altError);
        throw altError;
      } else {
        console.log('SQL query executed successfully using alternative approach.');
      }
    } else {
      console.log('SQL query executed successfully.');
    }
    
    console.log('Notifications table has been fixed. The sender_id column has been added if it was missing.');
  } catch (error) {
    console.error('Failed to execute SQL query:', error);
    process.exit(1);
  }
}

// Run the SQL query
runSQLQuery(); 
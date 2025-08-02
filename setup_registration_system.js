// Script to set up the registration system
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase connection details
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to read SQL files
function readSqlFile(filePath) {
  try {
    return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
  } catch (error) {
    console.error(`Error reading SQL file ${filePath}:`, error);
    return null;
  }
}

// Execute SQL queries
async function executeSql(sql, name) {
  try {
    console.log(`Running SQL script: ${name}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Error executing ${name}:`, error);
      return false;
    }
    
    console.log(`Successfully executed ${name}`);
    return true;
  } catch (error) {
    console.error(`Error executing ${name}:`, error);
    return false;
  }
}

// Main function to set up the registration system
async function setupRegistrationSystem() {
  console.log('Setting up registration system...');
  
  // Read SQL files
  const createProfilesTableSql = readSqlFile('./create_profiles_table.sql');
  const disableEmailVerificationSql = readSqlFile('./disable_email_verification_all.sql');
  
  if (!createProfilesTableSql || !disableEmailVerificationSql) {
    console.error('Failed to read SQL files');
    return;
  }
  
  // Execute SQL scripts
  const profilesTableCreated = await executeSql(createProfilesTableSql, 'create_profiles_table.sql');
  const emailVerificationDisabled = await executeSql(disableEmailVerificationSql, 'disable_email_verification_all.sql');
  
  if (profilesTableCreated && emailVerificationDisabled) {
    console.log('✅ Registration system setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start your development server with: npm run dev');
    console.log('2. Navigate to http://localhost:8082/register to test registration');
  } else {
    console.error('❌ Registration system setup failed');
    console.log('');
    console.log('Manual setup required:');
    console.log('1. Go to your Supabase dashboard and run the SQL scripts manually');
    console.log('2. Check the SETUP_INSTRUCTIONS.md file for detailed steps');
  }
}

// Run the setup
setupRegistrationSystem().catch(console.error); 
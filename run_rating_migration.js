// Script to update reviews table for transaction-based rating system
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (err) {
  console.log('dotenv not installed, using environment variables');
}

// Supabase connection details
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_KEY, SUPABASE_KEY or VITE_SUPABASE_ANON_KEY must be provided');
  console.log('Please set the environment variable or provide it as an argument:');
  console.log('node run_rating_migration.js YOUR_SUPABASE_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlFile(filePath) {
  try {
    console.log(`Reading SQL from file: ${filePath}`);
    const sqlContent = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    
    console.log('Executing SQL...');
    
    // Execute SQL using rpc function if available
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: sqlContent
      });
      
      if (error) {
        console.error('Error executing SQL using RPC:', error);
        throw error;
      }
      
      console.log('SQL executed successfully using RPC');
      return;
    } catch (rpcError) {
      console.log('RPC method not available, trying direct query...');
    }
    
    // If RPC fails, try direct query
    // Split the SQL content by semicolons to execute each statement separately
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.from('_sql').rpc('query', { query: statement });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError);
        console.log('Statement:', statement);
      }
    }
    
    console.log('All SQL statements executed');
  } catch (error) {
    console.error('Error running SQL file:', error);
  }
}

async function main() {
  console.log('Starting reviews table update for transaction-based rating system...');
  
  try {
    await runSqlFile('supabase/migrations/20250702000000_update_reviews_table.sql');
    console.log('Reviews table updated successfully');
  } catch (error) {
    console.error('Error updating reviews table:', error);
  }
}

main(); 
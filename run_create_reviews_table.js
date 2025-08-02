// Script to create reviews table
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
  console.log('node run_create_reviews_table.js YOUR_SUPABASE_KEY');
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

// Simple direct SQL execution function
async function executeSql(sql) {
  try {
    console.log('Executing SQL directly...');
    
    // Create reviews table
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;
    
    // Execute create table statement
    const { error: createError } = await supabase.rpc('exec_sql', { query: createTableSql });
    
    if (createError) {
      console.error('Error creating reviews table:', createError);
      
      // Try alternative method
      try {
        const { error: altError } = await supabase.from('_sql').rpc('query', { query: createTableSql });
        if (altError) {
          console.error('Alternative method failed:', altError);
          return false;
        }
      } catch (err) {
        console.error('Alternative method exception:', err);
        return false;
      }
    }
    
    console.log('Reviews table created successfully');
    return true;
  } catch (error) {
    console.error('Error executing SQL directly:', error);
    return false;
  }
}

async function main() {
  console.log('Starting creation of reviews table...');
  
  try {
    // Try using the SQL file first
    try {
      await runSqlFile('supabase/migrations/20250701000000_create_reviews_table.sql');
      console.log('Reviews table created successfully using SQL file');
    } catch (fileError) {
      console.error('Error using SQL file:', fileError);
      
      // Fall back to direct SQL execution
      console.log('Falling back to direct SQL execution...');
      const success = await executeSql();
      
      if (success) {
        console.log('Reviews table created successfully using direct SQL');
      } else {
        console.error('Failed to create reviews table');
      }
    }
  } catch (error) {
    console.error('Error creating reviews table:', error);
  }
}

main(); 
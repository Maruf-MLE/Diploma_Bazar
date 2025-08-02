// Supabase-এ SQL কোয়েরি রান করার জন্য স্ক্রিপ্ট
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Supabase client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin privileges

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlFromFile(filePath) {
  try {
    console.log(`Reading SQL from file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL content by semicolons to execute each statement separately
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        query: statement + ';'
      });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('All SQL statements executed');
  } catch (error) {
    console.error('Error running SQL file:', error);
  }
}

// Get the file path from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please provide the path to an SQL file');
  console.log('Usage: node run_sql_query.js <path_to_sql_file>');
  process.exit(1);
}

const filePath = args[0];
runSqlFromFile(filePath); 
// Run Phone Verification Database Fix
// This script applies the phone verification fixes to Supabase

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your_supabase_url_here';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
  console.error('❌ Please set VITE_SUPABASE_URL in your .env file');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runPhoneVerificationFix() {
  try {
    console.log('🚀 Starting Phone Verification Database Fix...');
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'fix_phone_verification_functions_updated.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL by statement (basic split by semicolon)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { data: directData, error: directError } = await supabase
            .from('_sql_exec')
            .select('*')
            .limit(1);
          
          if (directError) {
            console.log(`📋 Statement ${i + 1}: ${statement.substring(0, 100)}...`);
            console.warn(`⚠️  Statement ${i + 1} may need manual execution in Supabase SQL Editor`);
            console.warn(`Error: ${error.message}`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.warn(`⚠️  Statement ${i + 1} execution failed:`, execError.message);
        console.log(`📋 Please execute manually: ${statement.substring(0, 100)}...`);
      }
    }
    
    console.log('\n🎉 Phone Verification Fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. If some statements failed, execute them manually in Supabase SQL Editor');
    console.log('2. Test phone verification by running: npm run test:phone-verification');
    console.log('3. Make sure VITE_ENABLE_SMS=true in your .env file');
    
  } catch (error) {
    console.error('❌ Error running phone verification fix:', error);
    console.log('\n📋 Manual steps required:');
    console.log('1. Open Supabase Dashboard > SQL Editor');
    console.log('2. Copy and run the contents of fix_phone_verification_functions.sql');
    console.log('3. Set VITE_ENABLE_SMS=true in .env file');
  }
}

// Test database connection
async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('📱 Phone Verification Database Fix');
  console.log('=====================================');
  
  const connected = await testConnection();
  
  if (!connected) {
    console.log('\n❌ Database connection failed. Please check your credentials.');
    process.exit(1);
  }
  
  await runPhoneVerificationFix();
}

main().catch(console.error);

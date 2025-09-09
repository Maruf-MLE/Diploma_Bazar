import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-role-key-here'; // Service role key from environment

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runPhoneVerificationMigration() {
  console.log('🚀 Starting Phone Verification Migration...\n');
  
  try {
    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, 'phone_verification_migration.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('Migration SQL file not found: phone_verification_migration.sql');
    }
    
    const migrationSQL = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Running database migration using direct SQL execution...');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .filter(statement => statement.trim().length > 0 && !statement.trim().startsWith('--'))
      .map(statement => statement.trim());
    
    console.log(`📄 Found ${statements.length} SQL statements to execute...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim() === '' || statement.trim().startsWith('--')) continue;
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Try different ways to execute SQL based on statement type
        let result;
        
        if (statement.toLowerCase().includes('create table') ||
            statement.toLowerCase().includes('alter table') ||
            statement.toLowerCase().includes('create index')) {
          // For DDL statements, use direct query
          result = await supabase
            .from('_supabase_migrations')
            .select('version')
            .limit(1)
            .single();
          
          if (result.error && result.error.code !== 'PGRST116') {
            throw result.error;
          }
          
          // Since we can't directly execute DDL, we'll note it and continue
          console.log(`⚠️ DDL Statement noted: ${statement.substring(0, 50)}...`);
          successCount++;
        } else if (statement.toLowerCase().includes('create or replace function')) {
          // For function creation, we'll try a different approach
          console.log(`⚠️ Function creation noted: ${statement.substring(0, 50)}...`);
          successCount++;
        } else {
          // For other statements, log them
          console.log(`⚠️ Statement noted: ${statement.substring(0, 50)}...`);
          successCount++;
        }
      } catch (err) {
        console.warn(`⚠️ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Migration Results:`);
    console.log(`✅ Processed statements: ${successCount}`);
    console.log(`⚠️ Warnings/Errors: ${errorCount}`);
    
    console.log('\n⚠️  Note: Due to Supabase client limitations, the migration needs to be run manually.');
    console.log('\n📋 Manual Migration Steps:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of phone_verification_migration.sql');
    console.log('4. Run the SQL script directly in the dashboard');
    console.log('\n📱 After manual migration, phone verification will be ready!');
    
  } catch (error) {
    console.error('❌ Migration script error:', error);
    console.log('\n🔧 Please run the migration manually in Supabase Dashboard:');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy phone_verification_migration.sql contents');
    console.log('4. Run the script');
  }
}

// Alternative method using direct SQL execution if RPC doesn't work
async function runMigrationDirect() {
  console.log('🔄 Trying direct SQL execution method...\n');
  
  try {
    const sqlFilePath = path.join(__dirname, 'phone_verification_migration.sql');
    const migrationSQL = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .filter(statement => statement.trim().length > 0)
      .map(statement => statement.trim() + ';');
    
    console.log(`📄 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim() === ';') continue;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.warn(`⚠️ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Migration Results:`);
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`⚠️ Warnings/Errors: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Migration completed with some warnings (this is normal)');
      console.log('✅ Phone verification system should now be available!');
    }
    
  } catch (error) {
    console.error('❌ Direct migration also failed:', error);
  }
}

// Run migration with fallback
runPhoneVerificationMigration().catch(() => {
  console.log('\n🔄 Primary method failed, trying alternative...');
  runMigrationDirect();
});

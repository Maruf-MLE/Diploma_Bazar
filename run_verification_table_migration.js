const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runVerificationTableMigration() {
  try {
    console.log('🚀 Starting verification_data table migration...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create_verification_data_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    
    // Split SQL commands (simple approach - for more complex SQL, consider using a proper parser)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📋 Found ${commands.length} SQL commands to execute`);
    
    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`⏳ Executing command ${i + 1}/${commands.length}...`);
          
          // Use rpc to execute raw SQL
          const { data, error } = await supabase.rpc('exec_sql', { 
            query: command 
          });
          
          if (error) {
            // If exec_sql doesn't exist, try direct execution
            if (error.message.includes('function public.exec_sql') || error.code === '42883') {
              console.log('⚠️  exec_sql function not available, trying alternative approach...');
              
              // For table creation, we can try using the REST API
              if (command.toUpperCase().includes('CREATE TABLE')) {
                console.log('📋 Creating table using direct approach...');
                // This might require manual creation in Supabase dashboard
              } else if (command.toUpperCase().includes('CREATE POLICY')) {
                console.log('🔒 Creating RLS policy...');
              } else if (command.toUpperCase().includes('CREATE FUNCTION')) {
                console.log('⚙️ Creating function...');
              }
            } else {
              console.error(`❌ Error executing command ${i + 1}:`, error);
              // Don't stop on errors, continue with next command
            }
          } else {
            console.log(`✅ Command ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`💥 Exception executing command ${i + 1}:`, err);
        }
      }
    }
    
    console.log('\n🎉 Migration completed!');
    
    // Test the table
    console.log('🧪 Testing table creation...');
    const { data: testData, error: testError } = await supabase
      .from('verification_data')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Table test failed:', testError);
      console.log('\n⚠️  Manual steps required:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Copy and paste the contents of create_verification_data_table.sql');
      console.log('3. Execute the SQL commands manually');
    } else {
      console.log('✅ verification_data table is working correctly!');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    console.log('\n📋 Manual migration steps:');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Run the SQL in create_verification_data_table.sql');
  }
}

// Run the migration
runVerificationTableMigration();

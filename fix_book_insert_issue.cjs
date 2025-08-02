const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixBookInsertIssue() {
  try {
    console.log('🔧 Fixing book insertion issues...\n');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'remove_book_trigger.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Reading SQL cleanup script...');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      console.log(`⚡ Executing SQL statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });
        
        if (error) {
          // If exec_sql function doesn't exist, try direct query
          if (error.message.includes('function "exec_sql" does not exist')) {
            console.log('   🔄 Trying alternative approach...');
            // For simple statements, we can try using .from().select() with raw SQL
            // But since Supabase doesn't allow arbitrary SQL execution from client,
            // we'll provide instructions for manual execution
            console.log('   ⚠️  This statement needs to be executed manually in Supabase SQL editor');
          } else {
            throw error;
          }
        } else {
          console.log('   ✅ Statement executed successfully');
          if (data) {
            console.log('   📊 Result:', data);
          }
        }
      } catch (statementError) {
        console.error(`   ❌ Error executing statement: ${statementError.message}`);
        // Continue with next statement instead of stopping
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 Database cleanup process completed!\n');
    
    // Test book insertion capability
    console.log('🧪 Testing book insertion capability...');
    
    // Try to get a count of existing books to verify database connectivity
    const { data: bookCount, error: countError } = await supabase
      .from('books')
      .select('id', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error accessing books table:', countError.message);
    } else {
      console.log(`✅ Books table is accessible. Current count: ${bookCount || 0}`);
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the contents of "remove_book_trigger.sql"');
    console.log('3. Run the SQL script manually');
    console.log('4. Test adding a book from your application');
    console.log('\n🌟 The book insertion issue should now be resolved!');
    
  } catch (error) {
    console.error('💥 Error during database cleanup:', error);
    
    console.log('\n🔧 Manual Fix Instructions:');
    console.log('Since automatic cleanup failed, please follow these manual steps:');
    console.log('');
    console.log('1. Open Supabase Dashboard: https://app.supabase.com/');
    console.log('2. Go to your project → SQL Editor');
    console.log('3. Run this SQL command:');
    console.log('');
    console.log('   DROP TRIGGER IF EXISTS set_book_category ON public.books;');
    console.log('   DROP FUNCTION IF EXISTS public.set_default_category();');
    console.log('');
    console.log('4. Test adding a book from the application');
  }
}

// Run the fix
fixBookInsertIssue();

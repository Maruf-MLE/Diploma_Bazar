const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixBooksTable() {
  console.log('🔧 Fixing Books table structure...\n');

  const sqlCommands = [
    'ALTER TABLE public.books ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id);',
    'ALTER TABLE public.books ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();',
    'ALTER TABLE public.books ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();',
    'ALTER TABLE public.books ADD COLUMN IF NOT EXISTS status text DEFAULT \'available\';',
    'ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_negotiable boolean DEFAULT false;',
    'ALTER TABLE public.books ADD COLUMN IF NOT EXISTS discount_rate numeric(5,2) DEFAULT 0;',
    'ALTER TABLE public.books ADD COLUMN IF NOT EXISTS publisher text;',
    'ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_sold boolean DEFAULT false;'
  ];

  // Execute each SQL command
  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i];
    console.log(`⚡ Executing SQL ${i + 1}/${sqlCommands.length}...`);
    console.log(`   ${sql.substring(0, 50)}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }

  console.log('\n🧪 Testing Books table structure...');
  
  // Test if we can query the books table
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Books table query failed: ${error.message}`);
      console.log('⚠️  You need to run the SQL script manually in Supabase SQL Editor');
    } else {
      console.log('✅ Books table is accessible');
      console.log(`📊 Current books count: ${data?.length || 0}`);
    }
  } catch (err) {
    console.log(`❌ Exception testing books table: ${err.message}`);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Go to your Supabase Dashboard → SQL Editor');
  console.log('2. Copy and paste the contents of "fix_books_table_structure.sql"');
  console.log('3. Run the SQL script manually');
  console.log('4. Test adding a book from your application');
  console.log('\n🌟 After fixing the table structure, book insertion should work!');
}

fixBooksTable().catch(console.error);

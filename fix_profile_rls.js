// প্রোফাইল টেবিলের RLS পলিসি ফিক্স করার স্ক্রিপ্ট
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// সুপাবেস কানেকশন
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// সার্ভিস কী না থাকলে ওয়ার্নিং দেখাবে
if (!supabaseServiceKey) {
  console.warn('\x1b[33m%s\x1b[0m', 'WARNING: SUPABASE_SERVICE_KEY not found in environment variables.');
  console.warn('\x1b[33m%s\x1b[0m', 'You need to use a service key to modify RLS policies.');
  console.warn('\x1b[33m%s\x1b[0m', 'Please set SUPABASE_SERVICE_KEY in your .env file.');
  console.warn('\x1b[33m%s\x1b[0m', 'Attempting to continue with anonymous key, but this may fail...');
}

// সুপাবেস ক্লায়েন্ট তৈরি করি
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// SQL স্ক্রিপ্ট লোড করি
const sqlScript = fs.readFileSync(path.join(__dirname, 'fix_profile_rls_policy.sql'), 'utf8');

// SQL কমান্ডগুলি আলাদা করি
const sqlCommands = sqlScript
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0);

async function fixProfileRLS() {
  console.log('\x1b[36m%s\x1b[0m', '🔧 Starting profiles RLS policy fix...');
  
  try {
    // প্রতিটি SQL কমান্ড রান করি
    for (const cmd of sqlCommands) {
      console.log('\x1b[90m%s\x1b[0m', `Running SQL command: ${cmd.substring(0, 60)}...`);
      
      try {
        // সরাসরি SQL রান করি
        const { data, error } = await supabase.rpc('exec_sql', { sql: cmd });
        
        if (error) {
          if (error.message.includes('function "exec_sql" does not exist')) {
            console.log('\x1b[33m%s\x1b[0m', 'exec_sql function not available. Trying direct query...');
            
            // সরাসরি কুয়েরি রান করি
            await runDirectQuery(cmd);
          } else {
            console.error('\x1b[31m%s\x1b[0m', `Error executing SQL: ${error.message}`);
          }
        } else {
          console.log('\x1b[32m%s\x1b[0m', '✓ SQL command executed successfully');
        }
      } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `Error executing command: ${error.message}`);
      }
    }
    
    console.log('\x1b[36m%s\x1b[0m', '🔍 Checking if fix was successful...');
    
    // প্রোফাইল টেবিলের RLS পলিসি চেক করি
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: `SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'profiles'` 
    });
    
    if (error) {
      console.log('\x1b[33m%s\x1b[0m', 'Could not check policies via RPC. Trying direct query...');
      await runDirectQuery(`SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'profiles'`);
    } else {
      console.log('\x1b[32m%s\x1b[0m', 'Current profiles table policies:');
      console.table(data);
    }
    
    // টেস্ট ইনসার্ট চেষ্টা করি
    console.log('\x1b[36m%s\x1b[0m', 'Testing if we can insert a test profile...');
    const testId = 'test-' + Date.now();
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        name: 'Test User',
        roll_number: 'TEST123',
        semester: '1st',
        department: 'Test Dept',
        institute_name: 'Test Institute'
      });
      
    if (insertError) {
      console.error('\x1b[31m%s\x1b[0m', `Test insert failed: ${insertError.message}`);
      console.log('\x1b[33m%s\x1b[0m', 'RLS policy fix may not have worked completely.');
    } else {
      console.log('\x1b[32m%s\x1b[0m', '✓ Test insert successful! RLS policy fix worked.');
      
      // টেস্ট ডাটা ডিলিট করি
      await supabase.from('profiles').delete().eq('id', testId);
    }
    
    console.log('\x1b[36m%s\x1b[0m', '📋 Next steps:');
    console.log('\x1b[36m%s\x1b[0m', '1. Test registration on your site');
    console.log('\x1b[36m%s\x1b[0m', '2. If issues persist, check the auth.users table permissions');
    console.log('\x1b[36m%s\x1b[0m', '3. Make sure your AuthContext.tsx signUp function is properly configured');
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `Unexpected error: ${error.message}`);
  }
}

// সরাসরি কুয়েরি রান করার ফাংশন
async function runDirectQuery(sql) {
  try {
    // সরাসরি কুয়েরি রান করি
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('\x1b[31m%s\x1b[0m', `Error running query: ${error.message}`);
    } else {
      console.log('\x1b[32m%s\x1b[0m', `Direct query successful. Result:`, data);
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `Error in direct query: ${error.message}`);
  }
}

// স্ক্রিপ্ট রান করি
fixProfileRLS().then(() => {
  console.log('\x1b[36m%s\x1b[0m', '✅ Profile RLS fix script completed');
}); 
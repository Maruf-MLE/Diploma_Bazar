// ইমেইল ভেরিফিকেশন সমস্যা সমাধানের স্ক্রিপ্ট
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
  console.warn('\x1b[33m%s\x1b[0m', 'You need to use a service key to modify auth settings.');
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
const sqlScript = fs.readFileSync(path.join(__dirname, 'remove_auto_email_verification.sql'), 'utf8');

// SQL কমান্ডগুলি আলাদা করি
const sqlCommands = sqlScript
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0);

async function fixEmailVerification() {
  console.log('\x1b[36m%s\x1b[0m', '🔧 Starting email verification fix...');
  
  try {
    // প্রতিটি SQL কমান্ড রান করি
    for (const cmd of sqlCommands) {
      console.log('\x1b[90m%s\x1b[0m', `Running SQL command: ${cmd.substring(0, 60)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: cmd });
      
      if (error) {
        if (error.message.includes('function "exec_sql" does not exist')) {
          // exec_sql ফাংশন না থাকলে সরাসরি SQL রান করার চেষ্টা করি
          console.log('\x1b[33m%s\x1b[0m', 'exec_sql function not available. Trying direct SQL execution...');
          
          // সরাসরি SQL রান করি
          const { error: directError } = await supabase.sql(cmd);
          
          if (directError) {
            console.error('\x1b[31m%s\x1b[0m', `Error executing SQL: ${directError.message}`);
          }
        } else {
          console.error('\x1b[31m%s\x1b[0m', `Error executing SQL: ${error.message}`);
        }
      } else {
        console.log('\x1b[32m%s\x1b[0m', '✓ SQL command executed successfully');
      }
    }
    
    console.log('\x1b[36m%s\x1b[0m', '🔍 Checking current email confirmation settings...');
    
    // ইমেইল কনফার্মেশন সেটিং চেক করি
    const { data: configData, error: configError } = await supabase
      .from('auth.config')
      .select('value->email_confirmations')
      .eq('name', 'auth')
      .single();
    
    if (configError) {
      console.error('\x1b[31m%s\x1b[0m', `Error checking config: ${configError.message}`);
      
      console.log('\x1b[33m%s\x1b[0m', 'Cannot check email confirmation settings via API.');
      console.log('\x1b[33m%s\x1b[0m', 'Please check manually in the Supabase Dashboard:');
      console.log('\x1b[33m%s\x1b[0m', '1. Go to Authentication > Providers > Email');
      console.log('\x1b[33m%s\x1b[0m', '2. Make sure "Confirm Email" is checked');
    } else {
      const isEmailConfirmationEnabled = configData?.value?.email_confirmations === true;
      
      if (isEmailConfirmationEnabled) {
        console.log('\x1b[32m%s\x1b[0m', '✓ Email confirmation is now ENABLED');
      } else {
        console.log('\x1b[31m%s\x1b[0m', '✗ Email confirmation is still DISABLED');
        console.log('\x1b[33m%s\x1b[0m', 'Please enable it manually in the Supabase Dashboard:');
        console.log('\x1b[33m%s\x1b[0m', '1. Go to Authentication > Providers > Email');
        console.log('\x1b[33m%s\x1b[0m', '2. Check the "Confirm Email" option');
      }
    }
    
    console.log('\x1b[36m%s\x1b[0m', '📋 Next steps:');
    console.log('\x1b[36m%s\x1b[0m', '1. Go to the Supabase Dashboard: https://supabase.com/dashboard/project/yryerjgidsyfiohmpeoc');
    console.log('\x1b[36m%s\x1b[0m', '2. Navigate to Authentication > Providers > Email');
    console.log('\x1b[36m%s\x1b[0m', '3. Make sure "Confirm Email" is checked');
    console.log('\x1b[36m%s\x1b[0m', '4. Test registration to confirm email verification is working');
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `Unexpected error: ${error.message}`);
  }
}

// স্ক্রিপ্ট রান করি
fixEmailVerification().then(() => {
  console.log('\x1b[36m%s\x1b[0m', '✅ Email verification fix script completed');
}); 
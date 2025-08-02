// Simple script to fix the messages table

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixMessageTable() {
  try {
    console.log('Fixing messages table...');
    
    // First check if we're authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Error: You need to be logged in to run this migration.');
      console.log('Please sign in first using the application.');
      return;
    }
    
    console.log('Authenticated as:', session.user.email);
    
    // Simple SQL to make content column nullable
    const simpleSql = `
      -- Make content column nullable (simple fix)
      ALTER TABLE public.messages
      ALTER COLUMN content DROP NOT NULL;
    `;
    
    // Run the SQL
    console.log('Running SQL to fix messages table...');
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: simpleSql });
    
    if (sqlError) {
      console.error('Error fixing messages table:', sqlError);
      return;
    }
    
    console.log('Messages table fixed successfully!');
    console.log('Now you can send images without any errors.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixMessageTable(); 
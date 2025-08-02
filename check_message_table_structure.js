// Script to check the structure of the messages table and fix issues

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMessageTable() {
  try {
    console.log('Checking messages table structure...');
    
    // First check if we're authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Error: You need to be logged in to run this script.');
      console.log('Please sign in first using the application.');
      return;
    }
    
    console.log('Authenticated as:', session.user.email);
    
    // Get the structure of the messages table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'messages');
    
    if (columnsError) {
      console.error('Error fetching table structure:', columnsError);
      return;
    }
    
    console.log('Current messages table structure:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Check if content column is nullable
    const contentColumn = columns.find(col => col.column_name === 'content');
    if (contentColumn && contentColumn.is_nullable === 'NO') {
      console.log('\nContent column is NOT nullable. Attempting to fix...');
      
      const fixContentSql = `
        ALTER TABLE public.messages
        ALTER COLUMN content DROP NOT NULL;
      `;
      
      const { error: fixError } = await supabase.rpc('exec_sql', { sql: fixContentSql });
      
      if (fixError) {
        console.error('Error making content column nullable:', fixError);
      } else {
        console.log('Successfully made content column nullable!');
      }
    } else {
      console.log('\nContent column is already nullable. No fix needed.');
    }
    
    // Check for message_type column
    const messageTypeColumn = columns.find(col => col.column_name === 'message_type');
    if (!messageTypeColumn) {
      console.log('\nmessage_type column is missing. Attempting to add it...');
      
      const addMessageTypeSql = `
        ALTER TABLE public.messages
        ADD COLUMN message_type VARCHAR(50) DEFAULT 'text';
      `;
      
      const { error: addError } = await supabase.rpc('exec_sql', { sql: addMessageTypeSql });
      
      if (addError) {
        console.error('Error adding message_type column:', addError);
      } else {
        console.log('Successfully added message_type column!');
      }
    } else {
      console.log('\nmessage_type column already exists.');
    }
    
    // Check for file columns
    const fileColumns = ['file_url', 'file_type', 'file_name'];
    const missingColumns = fileColumns.filter(col => !columns.some(c => c.column_name === col));
    
    if (missingColumns.length > 0) {
      console.log(`\nMissing file columns: ${missingColumns.join(', ')}. Attempting to add them...`);
      
      const addFileColumnsSql = missingColumns.map(col => `
        ALTER TABLE public.messages
        ADD COLUMN ${col} TEXT;
      `).join('\n');
      
      const { error: addFileError } = await supabase.rpc('exec_sql', { sql: addFileColumnsSql });
      
      if (addFileError) {
        console.error('Error adding file columns:', addFileError);
      } else {
        console.log(`Successfully added missing file columns: ${missingColumns.join(', ')}!`);
      }
    } else {
      console.log('\nAll file columns already exist.');
    }
    
    // Try to insert a test message to verify everything works
    console.log('\nInserting a test message to verify table structure...');
    
    const testMessage = {
      sender_id: session.user.id,
      receiver_id: session.user.id, // Send to self for testing
      content: 'This is a test message to verify table structure',
      message_type: 'text',
      status: 'sent'
    };
    
    const { data: insertedMessage, error: insertError } = await supabase
      .from('messages')
      .insert(testMessage)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting test message:', insertError);
      console.log('There may still be issues with the table structure.');
    } else {
      console.log('Successfully inserted test message!');
      console.log('Message table structure is now correct.');
      
      // Delete the test message
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', insertedMessage.id);
      
      if (deleteError) {
        console.error('Error deleting test message:', deleteError);
      } else {
        console.log('Test message deleted.');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkMessageTable(); 
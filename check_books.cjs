// Script to check books table data
const { createClient } = require('@supabase/supabase-js');

// Supabase connection details
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBooks() {
  console.log('Checking books table...');
  
  try {
    // Check table structure
    console.log('Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('books')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing books table:', tableError);
      return;
    }
    
    // Check if the table has any records
    console.log('Checking for records...');
    const { data, count, error } = await supabase
      .from('books')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error fetching books data:', error);
      return;
    }
    
    console.log(`Found ${count} records in books table`);
    
    if (count === 0) {
      console.log('No records found in books table');
      console.log('This is why the books tab is empty');
      return;
    }
    
    // Check first record
    const firstRecord = data[0];
    console.log('First book record:', firstRecord);
    
    // Check user's books
    console.log('\nChecking for a sample user...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    if (users && users.length > 0) {
      const userId = users[0].id;
      console.log(`Checking books for user ${userId}...`);
      
      const { data: userBooks, count: userBookCount, error: userBookError } = await supabase
        .from('books')
        .select('*', { count: 'exact' })
        .eq('seller_id', userId);
      
      if (userBookError) {
        console.error('Error fetching user books:', userBookError);
        return;
      }
      
      console.log(`Found ${userBookCount} books for user ${userId}`);
      
      if (userBookCount > 0) {
        console.log('First user book:', userBooks[0]);
      }
    }
  } catch (error) {
    console.error('Error checking books table:', error);
  }
}

// Run the check
checkBooks(); 
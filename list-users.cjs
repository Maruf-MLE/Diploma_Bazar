// @ts-check
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listUsers() {
  try {
    console.log('Listing all users...');
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, institute_name, review_count, avg_rating')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.id})`);
      console.log(`   Institute: ${user.institute_name || 'Not specified'}`);
      console.log(`   Rating: ${user.avg_rating || 0} (${user.review_count || 0} reviews)`);
      console.log('');
    });
    
    // Now check which users have books
    console.log('\nChecking which users have books:');
    
    for (const user of users) {
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('id, status')
        .eq('seller_id', user.id);
        
      if (booksError) {
        console.error(`Error fetching books for user ${user.id}:`, booksError);
        continue;
      }
      
      const availableBooks = books?.filter(book => book.status === 'available').length || 0;
      const soldBooks = books?.filter(book => book.status === 'sold').length || 0;
      
      console.log(`${user.name} (${user.id}): ${books?.length || 0} books (${availableBooks} available, ${soldBooks} sold)`);
    }
    
  } catch (error) {
    console.error('Error in script:', error);
  }
}

listUsers(); 
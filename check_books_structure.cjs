const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBooksStructure() {
  try {
    console.log('=== Books Table Structure ===');
    
    // Get books with available columns
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('Error fetching books:', error);
      return;
    }
    
    if (books.length > 0) {
      console.log('Available columns in books table:');
      console.log(Object.keys(books[0]));
      
      console.log('\nFirst book sample:');
      console.log(books[0]);
    } else {
      console.log('No books found in database');
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

checkBooksStructure();

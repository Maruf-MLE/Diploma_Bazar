// @ts-check
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBooks() {
  try {
    console.log('Checking books table...');
    
    // Check books table structure
    console.log('\nChecking books table structure:');
    const { data: bookSample, error: bookError } = await supabase
      .from('books')
      .select('*')
      .limit(1);
    
    if (bookError) {
      console.error('Error fetching book sample:', bookError);
    } else if (bookSample && bookSample.length > 0) {
      console.log('Book table columns:', Object.keys(bookSample[0]));
      console.log('Sample book data:', bookSample[0]);
    } else {
      console.log('No books found');
    }
    
    // Check for inconsistent book status
    console.log('\nChecking for inconsistent book status:');
    
    // Books with status 'sold' but is_sold is not true
    const { data: inconsistentSold, error: inconsistentSoldError } = await supabase
      .from('books')
      .select('*')
      .eq('status', 'sold')
      .not('is_sold', 'eq', true);
    
    if (inconsistentSoldError) {
      console.error('Error checking inconsistent sold books:', inconsistentSoldError);
    } else {
      console.log(`Found ${inconsistentSold?.length || 0} books with status 'sold' but is_sold is not true`);
      if (inconsistentSold && inconsistentSold.length > 0) {
        console.log('Sample inconsistent sold book:', inconsistentSold[0]);
      }
    }
    
    // Books with is_sold true but status is not 'sold'
    const { data: inconsistentStatus, error: inconsistentStatusError } = await supabase
      .from('books')
      .select('*')
      .eq('is_sold', true)
      .not('status', 'eq', 'sold');
    
    if (inconsistentStatusError) {
      console.error('Error checking inconsistent status books:', inconsistentStatusError);
    } else {
      console.log(`Found ${inconsistentStatus?.length || 0} books with is_sold true but status is not 'sold'`);
      if (inconsistentStatus && inconsistentStatus.length > 0) {
        console.log('Sample inconsistent status book:', inconsistentStatus[0]);
      }
    }
    
    // Check books for a specific user
    const testUserId = 'ee1ddbe9-0689-4dbf-8300-6eb2c7c9b5ef'; // Replace with a real user ID from your database
    console.log(`\nChecking books for user ${testUserId}:`);
    
    const { data: userBooks, error: userBooksError } = await supabase
      .from('books')
      .select('*')
      .eq('seller_id', testUserId);
    
    if (userBooksError) {
      console.error('Error fetching user books:', userBooksError);
    } else {
      console.log(`Found ${userBooks?.length || 0} books for user ${testUserId}`);
      
      // Count available and sold books
      const availableBooks = userBooks?.filter(book => 
        (book.status === 'available' || book.status === 'pending') && book.is_sold !== true
      ) || [];
      
      const soldBooks = userBooks?.filter(book => 
        book.status === 'sold' || book.is_sold === true
      ) || [];
      
      console.log(`Available books: ${availableBooks.length}`);
      console.log(`Sold books: ${soldBooks.length}`);
      
      // Print details of a few books
      if (availableBooks.length > 0) {
        console.log('\nSample available book:');
        console.log('ID:', availableBooks[0].id);
        console.log('Title:', availableBooks[0].title);
        console.log('Status:', availableBooks[0].status);
        console.log('is_sold:', availableBooks[0].is_sold);
      }
      
      if (soldBooks.length > 0) {
        console.log('\nSample sold book:');
        console.log('ID:', soldBooks[0].id);
        console.log('Title:', soldBooks[0].title);
        console.log('Status:', soldBooks[0].status);
        console.log('is_sold:', soldBooks[0].is_sold);
      }
    }
    
  } catch (error) {
    console.error('Error in script:', error);
  }
}

checkBooks(); 
// @ts-check
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get user ID from command line arguments
const userId = process.argv[2] || 'ee1ddbe9-0689-4dbf-8300-6eb2c7c9b5ef';

async function findUserBooks(userId) {
  try {
    console.log(`Searching for books by user: ${userId}`);
    
    // First, check if the user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('name, institute_name')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }
    
    console.log(`Found user: ${userData.name} from ${userData.institute_name || 'Unknown Institution'}`);
    
    // Get all books by this user
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('*')
      .eq('seller_id', userId);
    
    if (booksError) {
      console.error('Error fetching books:', booksError);
      return;
    }
    
    console.log(`\nFound ${books.length} books for this user:`);
    
    // Group books by status
    const availableBooks = books.filter(book => book.status === 'available');
    const pendingBooks = books.filter(book => book.status === 'pending');
    const soldBooks = books.filter(book => book.status === 'sold');
    const otherBooks = books.filter(book => !['available', 'pending', 'sold'].includes(book.status));
    
    console.log(`- Available books: ${availableBooks.length}`);
    console.log(`- Pending books: ${pendingBooks.length}`);
    console.log(`- Sold books: ${soldBooks.length}`);
    console.log(`- Other status: ${otherBooks.length}`);
    
    // Print details of a few books from each category
    if (availableBooks.length > 0) {
      console.log('\nSample available books:');
      availableBooks.slice(0, 3).forEach((book, index) => {
        console.log(`${index + 1}. ${book.title} by ${book.author} - ${book.price} Tk (${book.status})`);
      });
    }
    
    if (soldBooks.length > 0) {
      console.log('\nSample sold books:');
      soldBooks.slice(0, 3).forEach((book, index) => {
        console.log(`${index + 1}. ${book.title} by ${book.author} - ${book.price} Tk (${book.status})`);
      });
    }
    
    // List all books with their status
    console.log('\nAll books:');
    books.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title} - Status: ${book.status}`);
    });
    
  } catch (error) {
    console.error('Error in script:', error);
  }
}

findUserBooks(userId); 
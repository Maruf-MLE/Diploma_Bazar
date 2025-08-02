// @ts-check
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixBookStatus() {
  try {
    console.log('Starting book status fix migration...');
    
    // Get all books
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('*');
    
    if (booksError) {
      console.error('Error fetching books:', booksError);
      return;
    }
    
    console.log(`Found ${books.length} books to check.`);
    
    // Track statistics
    let updatedBooks = 0;
    let alreadyCorrect = 0;
    let errors = 0;
    
    // Process each book
    for (const book of books) {
      try {
        // Check if status and is_sold are consistent
        if (book.is_sold === true && book.status !== 'sold') {
          // Update book to have status 'sold'
          const { error: updateError } = await supabase
            .from('books')
            .update({ status: 'sold' })
            .eq('id', book.id);
            
          if (updateError) {
            console.error(`Error updating book ${book.id}:`, updateError);
            errors++;
          } else {
            console.log(`Updated book ${book.id} status to 'sold'`);
            updatedBooks++;
          }
        } else if (book.is_sold === false && book.status === 'sold') {
          // Update book to have is_sold = true
          const { error: updateError } = await supabase
            .from('books')
            .update({ is_sold: true })
            .eq('id', book.id);
            
          if (updateError) {
            console.error(`Error updating book ${book.id}:`, updateError);
            errors++;
          } else {
            console.log(`Updated book ${book.id} is_sold to true`);
            updatedBooks++;
          }
        } else {
          alreadyCorrect++;
        }
      } catch (error) {
        console.error(`Error processing book ${book.id}:`, error);
        errors++;
      }
    }
    
    console.log('\nMigration complete:');
    console.log(`- Total books: ${books.length}`);
    console.log(`- Already correct: ${alreadyCorrect}`);
    console.log(`- Updated: ${updatedBooks}`);
    console.log(`- Errors: ${errors}`);
    
  } catch (error) {
    console.error('Error in migration script:', error);
  }
}

fixBookStatus(); 
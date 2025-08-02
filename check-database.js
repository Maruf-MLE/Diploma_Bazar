const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  try {
    console.log('Checking database tables...');
    
    // Check books table
    console.log('\nChecking books table:');
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('*')
      .limit(5);
    
    if (booksError) {
      console.error('Error fetching books:', booksError);
    } else {
      console.log(`Found ${books.length} books:`);
      console.log(books);
    }
    
    // Check reviews table
    console.log('\nChecking reviews table:');
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .limit(5);
    
    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    } else {
      console.log(`Found ${reviews.length} reviews:`);
      console.log(reviews);
    }
    
    // Check profiles table
    console.log('\nChecking profiles table:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avg_rating, review_count')
      .limit(5);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else {
      console.log(`Found ${profiles.length} profiles:`);
      console.log(profiles);
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase(); 
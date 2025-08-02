const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugInstitutionMatching() {
  try {
    console.log('=== Institution Matching Debug ===');
    
    // Get all profiles with institution names
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, institute_name')
      .not('institute_name', 'is', null)
      .limit(10);
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    
    console.log('Found profiles:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.name} - "${profile.institute_name}" (ID: ${profile.id})`);
    });
    
    // Test institution matching logic
    if (profiles.length >= 2) {
      const user1 = profiles[0];
      const user2 = profiles[1];
      
      console.log('\n=== Testing Institution Match ===');
      console.log(`User 1: "${user1.institute_name}"`);
      console.log(`User 2: "${user2.institute_name}"`);
      
      const match1 = user1.institute_name.trim().toLowerCase() === user2.institute_name.trim().toLowerCase();
      console.log(`Match result: ${match1 ? '✅ MATCH' : '❌ NO MATCH'}`);
      
      // Test with same institution
      const sameInstitutionMatch = user1.institute_name.trim().toLowerCase() === user1.institute_name.trim().toLowerCase();
      console.log(`Same user match test: ${sameInstitutionMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    }
    
    // Check if there are books with seller information
    console.log('\n=== Books with Seller Info ===');
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, seller_id, seller_name, institute_name')
      .limit(5);
    
    if (booksError) {
      console.error('Error fetching books:', booksError);
    } else {
      books.forEach((book, index) => {
        console.log(`${index + 1}. "${book.title}" by ${book.seller_name} (Institute: ${book.institute_name})`);
      });
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugInstitutionMatching();

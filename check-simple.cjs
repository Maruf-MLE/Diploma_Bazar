// @ts-check
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Starting database check...');
  
  try {
    // Check reviews table
    console.log('\nChecking reviews table:');
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .limit(3);
    
    console.log('Reviews error:', reviewsError);
    console.log('Reviews data:', reviews);
    
    // Check profiles table
    console.log('\nChecking profiles table:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avg_rating, review_count')
      .limit(3);
    
    console.log('Profiles error:', profilesError);
    console.log('Profiles data:', profiles);
    
  } catch (error) {
    console.error('Error in script:', error);
  }
  
  console.log('\nCheck completed.');
}

// Run the function
checkTables().catch(console.error); 
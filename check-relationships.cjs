// @ts-check
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRelationships() {
  try {
    console.log('Checking database relationships...');
    
    // Check reviews table structure
    console.log('\nChecking reviews table structure:');
    const { data: reviewSample, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .limit(1);
    
    if (reviewError) {
      console.error('Error fetching review sample:', reviewError);
    } else if (reviewSample && reviewSample.length > 0) {
      console.log('Review table columns:', Object.keys(reviewSample[0]));
      console.log('Sample review data:', reviewSample[0]);
    } else {
      console.log('No reviews found');
    }
    
    // Try a join query to check relationships
    console.log('\nTrying a join query with reviews and profiles:');
    const { data: joinData, error: joinError } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(name, avatar_url)
      `)
      .limit(1);
    
    if (joinError) {
      console.error('Error with join query:', joinError);
    } else {
      console.log('Join query result:', joinData);
    }
    
    // Try alternative join syntax
    console.log('\nTrying alternative join syntax:');
    const { data: altJoinData, error: altJoinError } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles(name, avatar_url)
      `)
      .limit(1);
    
    if (altJoinError) {
      console.error('Error with alternative join query:', altJoinError);
    } else {
      console.log('Alternative join query result:', altJoinData);
    }
    
    // Check foreign key relationships
    console.log('\nChecking foreign key relationships:');
    const { data: foreignKeys, error: fkError } = await supabase
      .rpc('get_foreign_keys', { table_name: 'reviews' })
      .select('*');
    
    if (fkError) {
      console.error('Error fetching foreign keys:', fkError);
      console.log('Note: get_foreign_keys function may not exist in your database');
    } else {
      console.log('Foreign keys for reviews table:', foreignKeys);
    }
    
  } catch (error) {
    console.error('Error in script:', error);
  }
}

checkRelationships(); 
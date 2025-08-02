// @ts-check
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReviewsTable() {
  try {
    console.log('Checking reviews table...');
    
    // Check if we can access the reviews table
    console.log('\nChecking reviews data:');
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error fetching reviews:', error);
    } else {
      console.log(`Found ${data?.length || 0} reviews:`);
      console.log(data);
    }
    
    // Try to check the structure of the reviews table
    console.log('\nTrying to get reviews table structure:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('reviews')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error getting table structure:', tableError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('Reviews table columns:', Object.keys(tableInfo[0]));
    } else {
      console.log('No reviews found to determine structure');
    }
    
    // Check RLS policies
    console.log('\nChecking if we can create a review:');
    const testReview = {
      id: 'test-review-' + Date.now(),
      seller_id: 'test-seller-id',
      buyer_id: 'test-buyer-id',
      transaction_id: 'test-transaction-id',
      rating: 5,
      comment: 'Test review',
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('reviews')
      .insert(testReview)
      .select();
    
    if (insertError) {
      console.error('Error inserting test review (this may be expected due to RLS):', insertError);
    } else {
      console.log('Successfully inserted test review:', insertData);
      
      // Delete the test review
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', testReview.id);
        
      if (deleteError) {
        console.error('Error deleting test review:', deleteError);
      } else {
        console.log('Successfully deleted test review');
      }
    }
    
  } catch (error) {
    console.error('Error checking reviews table:', error);
  }
}

checkReviewsTable(); 
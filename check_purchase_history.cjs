// Script to check purchase_history table data
const { createClient } = require('@supabase/supabase-js');

// Supabase connection details
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPurchaseHistory() {
  console.log('Checking purchase_history table...');
  
  try {
    // Check table structure
    console.log('Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('purchase_history')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing purchase_history table:', tableError);
      return;
    }
    
    // Check if the table has any records
    console.log('Checking for records...');
    const { data, count, error } = await supabase
      .from('purchase_history')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('Error fetching purchase_history data:', error);
      return;
    }
    
    console.log(`Found ${count} records in purchase_history table`);
    
    if (count === 0) {
      console.log('No records found in purchase_history table');
      console.log('This is why the purchase history tab is empty');
      return;
    }
    
    // Check if the columns exist
    const firstRecord = data[0];
    console.log('First record:', firstRecord);
    console.log('Has buyer_has_reviewed column:', 'buyer_has_reviewed' in firstRecord);
    console.log('Has seller_has_reviewed column:', 'seller_has_reviewed' in firstRecord);
    
    // Check reviews table
    console.log('\nChecking reviews table...');
    const { data: reviews, count: reviewCount, error: reviewError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact' });
    
    if (reviewError) {
      console.error('Error fetching reviews data:', reviewError);
      return;
    }
    
    console.log(`Found ${reviewCount} records in reviews table`);
    
    if (reviewCount > 0) {
      console.log('First review:', reviews[0]);
    }
  } catch (error) {
    console.error('Error checking purchase_history table:', error);
  }
}

// Run the check
checkPurchaseHistory(); 
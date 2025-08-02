// Script to update profile ratings
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (err) {
  console.log('dotenv not installed, using environment variables');
}

// Supabase connection details
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_KEY, SUPABASE_KEY or VITE_SUPABASE_ANON_KEY must be provided');
  console.log('Please set the environment variable or provide it as an argument:');
  console.log('node run_profile_rating_migration.js YOUR_SUPABASE_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlFile(filePath) {
  try {
    console.log(`Reading SQL from file: ${filePath}`);
    const sqlContent = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    
    console.log('Executing SQL...');
    
    // Execute SQL using rpc function if available
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: sqlContent
      });
      
      if (error) {
        console.error('Error executing SQL using RPC:', error);
        throw error;
      }
      
      console.log('SQL executed successfully using RPC');
      return;
    } catch (rpcError) {
      console.log('RPC method not available, trying direct query...');
    }
    
    // If RPC fails, try direct query
    // Split the SQL content by semicolons to execute each statement separately
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.from('_sql').rpc('query', { query: statement });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError);
        console.log('Statement:', statement);
      }
    }
    
    console.log('All SQL statements executed');
  } catch (error) {
    console.error('Error running SQL file:', error);
  }
}

async function updateAllProfileRatings() {
  console.log('Starting profile ratings update...');
  
  try {
    // Get all unique seller IDs from reviews
    const { data: sellerIds, error: sellerError } = await supabase
      .from('reviews')
      .select('seller_id')
      .limit(1000);
    
    if (sellerError) {
      console.error('Error fetching seller IDs:', sellerError);
      return;
    }
    
    if (!sellerIds || sellerIds.length === 0) {
      console.log('No reviews found. Nothing to update.');
      return;
    }
    
    // Get unique seller IDs
    const uniqueSellerIds = [...new Set(sellerIds.map(item => item.seller_id))];
    console.log(`Found ${uniqueSellerIds.length} unique sellers with reviews`);
    
    // Update each profile
    for (const sellerId of uniqueSellerIds) {
      // Calculate average rating
      const { data: ratingData, error: ratingError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', sellerId);
      
      if (ratingError) {
        console.error(`Error calculating rating for seller ${sellerId}:`, ratingError);
        continue;
      }
      
      const ratings = ratingData.map(r => r.rating);
      const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      const reviewCount = ratings.length;
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avg_rating: avgRating,
          review_count: reviewCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', sellerId);
      
      if (updateError) {
        console.error(`Error updating profile for seller ${sellerId}:`, updateError);
      } else {
        console.log(`Updated profile for seller ${sellerId}: Rating = ${avgRating.toFixed(1)}, Reviews = ${reviewCount}`);
      }
    }
    
    console.log('Profile ratings update completed');
  } catch (error) {
    console.error('Error updating profile ratings:', error);
  }
}

async function main() {
  console.log('Starting profile ratings migration...');
  
  try {
    // First run the SQL migration
    await runSqlFile('supabase/migrations/20250703000000_update_profile_ratings.sql');
    console.log('SQL migration completed');
    
    // Then update all profiles directly
    await updateAllProfileRatings();
  } catch (error) {
    console.error('Error in profile ratings migration:', error);
  }
}

main(); 
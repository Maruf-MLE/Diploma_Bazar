// Script to update all profile ratings based on reviews
const { createClient } = require('@supabase/supabase-js');

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
  console.log('node update_profile_ratings.js YOUR_SUPABASE_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

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
  try {
    await updateAllProfileRatings();
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main(); 
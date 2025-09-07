// Clear Rate Limit Data for Fresh Testing
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

const clearData = async () => {
  console.log('🧹 Clearing rate limit data for fresh testing...\n');
  
  try {
    // Clear tracker data
    const { error: trackerError } = await supabase
      .from('rate_limit_tracker')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (trackerError) {
      console.log(`⚠️  Tracker clear error: ${trackerError.message}`);
    } else {
      console.log(`✅ Rate limit tracker cleared`);
    }
    
    // Clear violations
    const { error: violationsError } = await supabase
      .from('rate_limit_violations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (violationsError) {
      console.log(`⚠️  Violations clear error: ${violationsError.message}`);
    } else {
      console.log(`✅ Rate limit violations cleared`);
    }
    
    // Clear blocks
    const { error: blocksError } = await supabase
      .from('rate_limit_blocks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (blocksError) {
      console.log(`⚠️  Blocks clear error: ${blocksError.message}`);
    } else {
      console.log(`✅ Rate limit blocks cleared`);
    }
    
    console.log(`\n🎯 Fresh start ready! Now test the server.`);
    
  } catch (error) {
    console.error(`❌ Clear failed: ${error.message}`);
  }
};

clearData();

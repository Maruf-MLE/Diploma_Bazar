// Update Existing Rate Limit Entries
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const updateExistingLimits = async () => {
  console.log('🔄 UPDATING EXISTING RATE LIMITS');
  console.log('=================================\n');
  
  const updates = [
    { endpoint: '/api/auth/login', method: 'POST', min: 15, hour: 300, day: 1000 },
    { endpoint: '/api/auth/register', method: 'POST', min: 8, hour: 100, day: 200 },
    { endpoint: '/api/auth/reset-password', method: 'POST', min: 5, hour: 50, day: 100 },
    { endpoint: '/api/books', method: 'POST', min: 30, hour: 500, day: 1000 },
    { endpoint: '/api/messages', method: 'POST', min: 50, hour: 1000, day: 3000 },
    { endpoint: '/api/upload', method: 'POST', min: 20, hour: 300, day: 500 },
    { endpoint: '/api/test', method: 'GET', min: 10, hour: 100, day: 500 }
  ];
  
  for (const update of updates) {
    const { error } = await supabase
      .from('rate_limit_config')
      .update({
        requests_per_minute: update.min,
        requests_per_hour: update.hour,
        requests_per_day: update.day,
        updated_at: new Date().toISOString()
      })
      .eq('endpoint', update.endpoint)
      .eq('method', update.method);
    
    if (error) {
      console.log(`❌ ${update.endpoint} ${update.method}:`, error.message);
    } else {
      console.log(`✅ ${update.endpoint} ${update.method}: ${update.min}/min`);
    }
  }
  
  console.log('\n✅ All existing limits updated!');
};

updateExistingLimits();

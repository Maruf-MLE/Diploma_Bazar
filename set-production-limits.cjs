// Set Production-Ready Rate Limits
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const setProductionLimits = async () => {
  console.log('🚀 SETTING PRODUCTION-READY RATE LIMITS');
  console.log('=======================================\n');
  
  try {
    // 1. Default limits (for all endpoints)
    console.log('1️⃣ Setting default limits...');
    const { error: defaultError } = await supabase
      .from('rate_limit_config')
      .update({
        requests_per_minute: 60,    // 60/minute for normal usage
        requests_per_hour: 1800,    // 30 requests per minute * 60 minutes
        requests_per_day: 10000,    // Reasonable daily limit
        updated_at: new Date().toISOString()
      })
      .eq('endpoint', '*')
      .eq('method', 'ALL');
    
    if (defaultError) {
      console.log('❌ Default limits error:', defaultError.message);
    } else {
      console.log('✅ Default limits: 60/minute, 1800/hour, 10000/day');
    }

    // 2. Authentication endpoints (more restrictive)
    console.log('\n2️⃣ Setting auth endpoint limits...');
    
    const authConfigs = [
      { endpoint: '/api/auth/login', limits: { min: 15, hour: 300, day: 1000 } },
      { endpoint: '/api/auth/register', limits: { min: 8, hour: 100, day: 200 } },
      { endpoint: '/api/auth/reset-password', limits: { min: 5, hour: 50, day: 100 } },
      { endpoint: '/api/auth/verify-otp', limits: { min: 20, hour: 200, day: 500 } }
    ];
    
    for (const config of authConfigs) {
      const { error } = await supabase
        .from('rate_limit_config')
        .upsert({
          endpoint: config.endpoint,
          method: 'POST',
          requests_per_minute: config.limits.min,
          requests_per_hour: config.limits.hour,
          requests_per_day: config.limits.day,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.log(`❌ ${config.endpoint} error:`, error.message);
      } else {
        console.log(`✅ ${config.endpoint}: ${config.limits.min}/min, ${config.limits.hour}/hour`);
      }
    }

    // 3. API endpoints (moderate limits)
    console.log('\n3️⃣ Setting API endpoint limits...');
    
    const apiConfigs = [
      { endpoint: '/api/books', method: 'GET', limits: { min: 100, hour: 3000, day: 15000 } },
      { endpoint: '/api/books', method: 'POST', limits: { min: 30, hour: 500, day: 1000 } },
      { endpoint: '/api/messages', method: 'GET', limits: { min: 80, hour: 2000, day: 8000 } },
      { endpoint: '/api/messages', method: 'POST', limits: { min: 50, hour: 1000, day: 3000 } },
      { endpoint: '/api/upload', method: 'POST', limits: { min: 20, hour: 300, day: 500 } },
      { endpoint: '/api/notifications', method: 'GET', limits: { min: 40, hour: 800, day: 2000 } }
    ];
    
    for (const config of apiConfigs) {
      const { error } = await supabase
        .from('rate_limit_config')
        .upsert({
          endpoint: config.endpoint,
          method: config.method,
          requests_per_minute: config.limits.min,
          requests_per_hour: config.limits.hour,
          requests_per_day: config.limits.day,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.log(`❌ ${config.endpoint} ${config.method} error:`, error.message);
      } else {
        console.log(`✅ ${config.endpoint} ${config.method}: ${config.limits.min}/min`);
      }
    }

    // 4. Admin endpoints (restrictive)
    console.log('\n4️⃣ Setting admin endpoint limits...');
    const { error: adminError } = await supabase
      .from('rate_limit_config')
      .upsert({
        endpoint: '/api/admin',
        method: 'ALL',
        requests_per_minute: 30,
        requests_per_hour: 600,
        requests_per_day: 2000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (adminError) {
      console.log('❌ Admin limits error:', adminError.message);
    } else {
      console.log('✅ Admin endpoints: 30/minute, 600/hour, 2000/day');
    }

    // 5. Test endpoint (keep low for testing)
    console.log('\n5️⃣ Keeping test endpoint limits low...');
    const { error: testError } = await supabase
      .from('rate_limit_config')
      .upsert({
        endpoint: '/api/test',
        method: 'GET',
        requests_per_minute: 10,   // Keep low for easy testing
        requests_per_hour: 100,
        requests_per_day: 500,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (testError) {
      console.log('❌ Test endpoint error:', testError.message);
    } else {
      console.log('✅ /api/test: 10/minute (kept low for testing)');
    }

    console.log('\n📊 PRODUCTION LIMITS SUMMARY:');
    console.log('=============================');
    console.log('🔹 Default: 60/minute (normal API usage)');
    console.log('🔸 Auth Login: 15/minute (prevent brute force)');
    console.log('🔸 Auth Register: 8/minute (prevent spam accounts)');
    console.log('🔸 Password Reset: 5/minute (very restrictive)');
    console.log('🔹 Books GET: 100/minute (browsing)');
    console.log('🔹 Books POST: 30/minute (creating posts)');
    console.log('🔹 Messages: 50-80/minute (chatting)');
    console.log('🔸 File Upload: 20/minute (prevent abuse)');
    console.log('🔴 Admin: 30/minute (admin operations)');
    console.log('🧪 Test: 10/minute (for testing)');

    console.log('\n🎉 ✅ Production limits successfully configured!');
    
  } catch (error) {
    console.error('🚨 Failed to set production limits:', error.message);
  }
};

setProductionLimits();

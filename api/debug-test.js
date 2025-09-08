// Simple debug endpoint for Vercel testing
// Check if middleware is working properly

module.exports = async (req, res) => {
  console.log('🔍 DEBUG TEST ENDPOINT CALLED');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Environment Variables:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('  SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING');
  console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');
  
  try {
    // Test Supabase connection
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      throw new Error('No Supabase key available');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test simple query
    const { data, error } = await supabase.from('rate_limit_requests').select('count').limit(1);
    
    console.log('Supabase test result:', { data, error });
    
    res.status(200).json({
      message: 'Debug test successful',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        has_supabase_url: !!process.env.SUPABASE_URL,
        has_service_key: !!process.env.SUPABASE_SERVICE_KEY,
        has_anon_key: !!process.env.SUPABASE_ANON_KEY,
        has_jwt_secret: !!process.env.JWT_SECRET
      },
      supabase_test: {
        connected: !error,
        error: error?.message || null
      },
      request_info: {
        method: req.method,
        url: req.url,
        ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
        user_agent: req.headers['user-agent']
      }
    });
  } catch (error) {
    console.error('Debug test error:', error);
    
    res.status(200).json({
      message: 'Debug test with error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        has_supabase_url: !!process.env.SUPABASE_URL,
        has_service_key: !!process.env.SUPABASE_SERVICE_KEY,
        has_anon_key: !!process.env.SUPABASE_ANON_KEY,
        has_jwt_secret: !!process.env.JWT_SECRET
      }
    });
  }
};

// Debug Middleware to find where execution stops
const { createClient } = require('@supabase/supabase-js');

console.log('📝 DEBUG MIDDLEWARE LOADING...');

// Test basic functions
const testBasicFunctions = async () => {
  console.log('🔬 Testing basic functions...');
  
  try {
    // Test normalizeEndpoint
    const normalizeEndpoint = (path) => {
      const cleanPath = path.split('?')[0].replace(/\/$/, '');
      const withoutVersion = cleanPath.replace(/\/v\d+/, '');
      return withoutVersion || '/';
    };
    
    const testPath = '/api/test';
    const normalized = normalizeEndpoint(testPath);
    console.log(`✅ normalizeEndpoint test: ${testPath} -> ${normalized}`);
    
    // Test skip logic
    const skipEndpoints = ['/health', '/status', '/ping', '/favicon.ico'];
    const shouldSkip = skipEndpoints.includes(normalized);
    console.log(`✅ Skip logic test: ${normalized} shouldSkip: ${shouldSkip}`);
    
    // Test Supabase connection
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase credentials missing!');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');
    
    // Test database call
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: 'test-debug',
      p_identifier_type: 'IP',
      p_endpoint: '/api/test',
      p_method: 'GET'
    });
    
    if (error) {
      console.log('❌ Database test failed:', error.message);
    } else {
      console.log('✅ Database test passed:', data);
    }
    
  } catch (error) {
    console.log('❌ Basic function test failed:', error.message);
    console.log('Stack:', error.stack);
  }
};

// Debug middleware
const debugMiddleware = async (req, res, next) => {
  console.log('🚀 [DEBUG] Starting debug middleware...');
  
  try {
    console.log('🔍 [DEBUG] Step 1: Basic info');
    console.log(`   Method: ${req.method}`);
    console.log(`   Path: ${req.path}`);
    console.log(`   URL: ${req.url}`);
    
    console.log('🔍 [DEBUG] Step 2: Normalize path');
    const normalizeEndpoint = (path) => {
      const cleanPath = path.split('?')[0].replace(/\/$/, '');
      const withoutVersion = cleanPath.replace(/\/v\d+/, '');
      return withoutVersion || '/';
    };
    
    const normalizedPath = normalizeEndpoint(req.path);
    console.log(`   Normalized: ${normalizedPath}`);
    
    console.log('🔍 [DEBUG] Step 3: Check skip logic');
    const skipEndpoints = ['/health', '/status', '/ping', '/favicon.ico'];
    const shouldSkip = skipEndpoints.includes(normalizedPath);
    console.log(`   Should skip: ${shouldSkip}`);
    
    if (shouldSkip) {
      console.log('⏩ [DEBUG] Skipping...');
      return next();
    }
    
    console.log('🔍 [DEBUG] Step 4: Extract request info');
    const getClientIP = (req) => {
      return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.connection?.remoteAddress ||
             req.socket?.remoteAddress ||
             req.ip ||
             '127.0.0.1';
    };
    
    const identifier = req.requestIdentifier || getClientIP(req);
    const identifierType = req.identifierType || 'IP';
    console.log(`   Identifier: ${identifierType}:${identifier}`);
    
    console.log('🔍 [DEBUG] Step 5: Initialize Supabase');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`   Supabase initialized`);
    
    console.log('🔍 [DEBUG] Step 6: Call check_rate_limit');
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_endpoint: normalizedPath,
      p_method: req.method.toUpperCase()
    });
    
    if (error) {
      console.log(`❌ [DEBUG] Database error:`, error);
      return next(); // Continue even if database fails
    }
    
    console.log('📊 [DEBUG] Rate limit result:', {
      allowed: data.allowed,
      current: data.current,
      limits: data.limits
    });
    
    console.log('🔍 [DEBUG] Step 7: Check if rate limited');
    if (!data.allowed) {
      console.log('🚨 [DEBUG] RATE LIMITED! Returning 429');
      
      // Record violation
      try {
        await supabase.from('rate_limit_violations').insert({
          identifier,
          identifier_type: identifierType,
          endpoint: normalizedPath,
          method: req.method.toUpperCase(),
          request_count: data.current.minute,
          limit_exceeded: 'per_minute',
          user_agent: req.headers['user-agent']
        });
        console.log('✅ [DEBUG] Violation logged');
      } catch (logError) {
        console.log('⚠️ [DEBUG] Violation logging failed:', logError.message);
      }
      
      // Set headers
      res.set({
        'X-RateLimit-Limit': data.limits.per_minute,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': Math.floor((Date.now() + 60000) / 1000)
      });
      
      return res.status(429).json({
        error: {
          status: 429,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.'
        },
        details: 'Rate limit exceeded',
        current: data.current,
        limits: data.limits,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('🔍 [DEBUG] Step 8: Record request');
    await supabase.rpc('record_request', {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_endpoint: normalizedPath,
      p_method: req.method.toUpperCase()
    });
    console.log('✅ [DEBUG] Request recorded');
    
    console.log('🔍 [DEBUG] Step 9: Set success headers');
    res.set({
      'X-RateLimit-Limit': data.limits.per_minute,
      'X-RateLimit-Remaining': Math.max(0, data.limits.per_minute - data.current.minute - 1),
      'X-RateLimit-Reset': Math.floor((Date.now() + 60000) / 1000)
    });
    
    console.log('✅ [DEBUG] Middleware completed successfully');
    next();
    
  } catch (error) {
    console.log('💥 [DEBUG] MIDDLEWARE ERROR:', error.message);
    console.log('Stack:', error.stack);
    
    // Always continue to next middleware even on error
    next();
  }
};

// Test basic functions on load
testBasicFunctions();

module.exports = { debugMiddleware };

// Check Rate Limit Database Tables and Data
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

const checkRateLimitDatabase = async () => {
  console.log('🔍 Checking Rate Limit Database Setup...\n');
  
  try {
    // Check if rate_limit_requests table exists
    console.log('1️⃣ Checking rate_limit_requests table...');
    const { data: requestsData, error: requestsError } = await supabase
      .from('rate_limit_requests')
      .select('*')
      .limit(5);
    
    if (requestsError) {
      console.log(`❌ rate_limit_requests table error: ${requestsError.message}`);
    } else {
      console.log(`✅ rate_limit_requests table exists`);
      console.log(`📊 Recent entries: ${requestsData.length}`);
      if (requestsData.length > 0) {
        console.log('📝 Sample data:', requestsData[0]);
      }
    }
    console.log('');
    
    // Check if rate_limit_violations table exists
    console.log('2️⃣ Checking rate_limit_violations table...');
    const { data: violationsData, error: violationsError } = await supabase
      .from('rate_limit_violations')
      .select('*')
      .limit(5);
    
    if (violationsError) {
      console.log(`❌ rate_limit_violations table error: ${violationsError.message}`);
    } else {
      console.log(`✅ rate_limit_violations table exists`);
      console.log(`📊 Recent violations: ${violationsData.length}`);
      if (violationsData.length > 0) {
        console.log('📝 Sample violation:', violationsData[0]);
      }
    }
    console.log('');
    
    // Check if rate_limit_blocks table exists
    console.log('3️⃣ Checking rate_limit_blocks table...');
    const { data: blocksData, error: blocksError } = await supabase
      .from('rate_limit_blocks')
      .select('*')
      .limit(5);
    
    if (blocksError) {
      console.log(`❌ rate_limit_blocks table error: ${blocksError.message}`);
    } else {
      console.log(`✅ rate_limit_blocks table exists`);
      console.log(`📊 Active blocks: ${blocksData.length}`);
      if (blocksData.length > 0) {
        console.log('📝 Sample block:', blocksData[0]);
      }
    }
    console.log('');
    
    // Test rate limit function
    console.log('4️⃣ Testing check_rate_limit function...');
    const { data: rateLimitResult, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_identifier: '127.0.0.1',
        p_identifier_type: 'IP',
        p_endpoint: '/api/test',
        p_method: 'GET'
      });
    
    if (rateLimitError) {
      console.log(`❌ check_rate_limit function error: ${rateLimitError.message}`);
      console.log('This means the rate limiting functions are not properly installed.');
    } else {
      console.log(`✅ check_rate_limit function works`);
      console.log('📊 Function response:', rateLimitResult);
    }
    console.log('');
    
    // Test record request function
    console.log('5️⃣ Testing record_request function...');
    const { data: recordResult, error: recordError } = await supabase
      .rpc('record_request', {
        p_identifier: '127.0.0.1',
        p_identifier_type: 'IP',
        p_endpoint: '/api/test',
        p_method: 'GET'
      });
    
    if (recordError) {
      console.log(`❌ record_request function error: ${recordError.message}`);
    } else {
      console.log(`✅ record_request function works`);
    }
    console.log('');
    
    // Summary
    console.log('📋 Summary:');
    const hasRequestsTable = !requestsError;
    const hasViolationsTable = !violationsError;
    const hasBlocksTable = !blocksError;
    const hasFunctions = !rateLimitError;
    
    if (hasRequestsTable && hasViolationsTable && hasBlocksTable && hasFunctions) {
      console.log('🎉 ✅ Rate limiting database is properly set up!');
      console.log('The rate limiting should be working in production.');
    } else {
      console.log('⚠️ ❌ Rate limiting database has issues:');
      if (!hasRequestsTable) console.log('   - Missing rate_limit_requests table');
      if (!hasViolationsTable) console.log('   - Missing rate_limit_violations table');
      if (!hasBlocksTable) console.log('   - Missing rate_limit_blocks table');
      if (!hasFunctions) console.log('   - Missing database functions');
      
      console.log('\n🔧 To fix this, run the database setup scripts:');
      console.log('   node setup_rate_limiting.cjs');
    }
    
  } catch (error) {
    console.error('🚨 Database check failed:', error.message);
    console.log('\nPossible issues:');
    console.log('- Database connection problems');
    console.log('- Missing environment variables');
    console.log('- Insufficient database permissions');
  }
};

console.log('🚀 Rate Limit Database Check Starting...\n');
checkRateLimitDatabase().catch(console.error);

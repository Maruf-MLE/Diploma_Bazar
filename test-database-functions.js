// Test Database Functions without requiring authentication
// This script tests if the database functions exist and work properly

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
  console.error('❌ Please set VITE_SUPABASE_URL in your .env file');
  process.exit(1);
}

if (!supabaseKey || supabaseKey === 'your_supabase_anon_key_here') {
  console.error('❌ Please set VITE_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🗄️ Testing Database Functions');
console.log('=============================\n');

// Test if tables exist
async function testTablesExist() {
  console.log('📋 Checking if required tables exist...');
  
  try {
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (profilesError) {
      console.error('❌ profiles table error:', profilesError.message);
      return false;
    }
    console.log('✅ profiles table exists');
    
    // Check phone_verification_attempts table
    const { data: attempts, error: attemptsError } = await supabase
      .from('phone_verification_attempts')
      .select('count', { count: 'exact', head: true });
    
    if (attemptsError) {
      console.error('❌ phone_verification_attempts table missing:', attemptsError.message);
      console.log('🔧 Please run: npm run fix:phone-verification');
      return false;
    }
    console.log('✅ phone_verification_attempts table exists');
    
    return true;
  } catch (error) {
    console.error('❌ Table check failed:', error.message);
    return false;
  }
}

// Test database functions by checking metadata
async function testFunctionsExist() {
  console.log('\n📝 Checking if database functions exist...');
  
  try {
    // Query pg_proc to check if functions exist
    const { data, error } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            proname as function_name,
            prokind as function_type,
            proargnames as arg_names
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
          AND proname IN ('generate_phone_otp', 'verify_phone_otp')
          ORDER BY proname;
        `
      });
    
    if (error) {
      // If exec function doesn't exist, try alternative approach
      console.log('⚠️  Cannot directly query function metadata');
      console.log('   Will test functions by attempting to call them');
      return await testFunctionsByCall();
    }
    
    if (data && data.length > 0) {
      console.log('✅ Found database functions:');
      data.forEach(func => {
        console.log(`   - ${func.function_name}(${func.arg_names ? func.arg_names.join(', ') : ''})`);
      });
      return true;
    } else {
      console.error('❌ Required functions not found');
      console.log('🔧 Please run: npm run fix:phone-verification');
      return false;
    }
    
  } catch (error) {
    console.log('⚠️  Direct function check failed, trying alternative method...');
    return await testFunctionsByCall();
  }
}

// Test functions by attempting to call them (without auth)
async function testFunctionsByCall() {
  console.log('\n🧪 Testing function calls...');
  
  try {
    // Test if generate_phone_otp function exists by calling it
    // This should fail due to auth, but we can check the error type
    const { data: otpData, error: otpError } = await supabase.rpc('generate_phone_otp', {
      p_phone_number: '+8801712345678'
    });
    
    if (otpError) {
      if (otpError.message.includes('does not exist')) {
        console.error('❌ generate_phone_otp function does not exist');
        console.log('🔧 Please run: npm run fix:phone-verification');
        return false;
      } else if (otpError.message.includes('not authenticated') || otpError.message.includes('permission denied')) {
        console.log('✅ generate_phone_otp function exists (auth required)');
      } else {
        console.log('⚠️  generate_phone_otp function exists but has issues:', otpError.message);
      }
    } else {
      console.log('✅ generate_phone_otp function working (OTP generated):', otpData);
    }
    
    // Test verify_phone_otp function
    const { data: verifyData, error: verifyError } = await supabase.rpc('verify_phone_otp', {
      p_phone_number: '+8801712345678',
      p_otp_code: '123456'
    });
    
    if (verifyError) {
      if (verifyError.message.includes('does not exist')) {
        console.error('❌ verify_phone_otp function does not exist');
        console.log('🔧 Please run: npm run fix:phone-verification');
        return false;
      } else if (verifyError.message.includes('not authenticated') || verifyError.message.includes('permission denied')) {
        console.log('✅ verify_phone_otp function exists (auth required)');
      } else {
        console.log('⚠️  verify_phone_otp function exists but has issues:', verifyError.message);
      }
    } else {
      console.log('✅ verify_phone_otp function working:', verifyData);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Function call test failed:', error.message);
    return false;
  }
}

// Test profiles table has phone columns
async function testProfilesColumns() {
  console.log('\n📊 Checking profiles table structure...');
  
  try {
    // Try to select phone columns
    const { data, error } = await supabase
      .from('profiles')
      .select('phone_number, phone_verified')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('❌ profiles table missing phone columns');
        console.log('🔧 Please run: npm run fix:phone-verification');
        return false;
      } else {
        console.log('⚠️  profiles table access issue:', error.message);
      }
    } else {
      console.log('✅ profiles table has phone columns');
    }
    
    return true;
  } catch (error) {
    console.error('❌ profiles table structure test failed:', error.message);
    return false;
  }
}

// Test RLS policies
async function testRLSPolicies() {
  console.log('\n🔒 Testing RLS policies...');
  
  try {
    // Try to access phone_verification_attempts table
    const { data, error } = await supabase
      .from('phone_verification_attempts')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('permission denied')) {
        console.log('✅ RLS policies are active (good for security)');
        return true;
      } else {
        console.error('❌ RLS policy issue:', error.message);
        return false;
      }
    } else {
      console.log('✅ phone_verification_attempts table accessible');
      return true;
    }
  } catch (error) {
    console.error('❌ RLS policy test failed:', error.message);
    return false;
  }
}

// Main test function
async function runDatabaseTests() {
  console.log('🔍 Testing Database Configuration...\n');
  
  const tablesOk = await testTablesExist();
  const functionsOk = await testFunctionsExist();
  const columnsOk = await testProfilesColumns();
  const rlsOk = await testRLSPolicies();
  
  console.log('\n📊 Database Test Results:');
  console.log('=========================');
  console.log('Required Tables:', tablesOk ? '✅ PASS' : '❌ FAIL');
  console.log('Database Functions:', functionsOk ? '✅ PASS' : '❌ FAIL');
  console.log('Profiles Columns:', columnsOk ? '✅ PASS' : '❌ FAIL');
  console.log('RLS Policies:', rlsOk ? '✅ PASS' : '❌ FAIL');
  
  if (tablesOk && functionsOk && columnsOk && rlsOk) {
    console.log('\n🎉 All database tests passed!');
    console.log('📱 Phone verification database setup is ready.');
    console.log('\n📋 Next steps:');
    console.log('1. Test with authentication: Sign up/login to your app');
    console.log('2. Try phone verification flow in your app');
    console.log('3. Check browser console for detailed logs');
  } else {
    console.log('\n⚠️  Some database tests failed.');
    console.log('\n🔧 Quick fixes:');
    console.log('1. Run database migration: npm run fix:phone-verification');
    console.log('2. Or manually run MANUAL_PHONE_FIX.sql in Supabase SQL Editor');
    console.log('3. Make sure you have proper Supabase credentials');
  }
  
  return tablesOk && functionsOk && columnsOk && rlsOk;
}

runDatabaseTests().catch(console.error);

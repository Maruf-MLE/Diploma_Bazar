const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testVerificationTable() {
  try {
    console.log('🔍 Testing verification_data table...');
    
    // First, let's check if the table exists by trying to select from it
    const { data: tableCheck, error: tableError } = await supabase
      .from('verification_data')
      .select('count', { count: 'exact', head: true });
    
    if (tableError) {
      console.error('❌ Table verification_data does not exist or has permission issues:', tableError);
      return;
    }
    
    console.log('✅ Table verification_data exists and accessible');
    console.log(`📊 Table is accessible, checking records...`);
    
    // Get actual count
    const { data: countData, error: countError } = await supabase
      .from('verification_data')
      .select('*', { count: 'exact' });
    
    if (!countError) {
      console.log(`📊 Current record count: ${countData?.length || 0}`);
    }
    
    // Get a sample user ID to test with
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, roll_number, department, institute_name')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('ℹ️ No users found in profiles table');
      return;
    }
    
    const testUser = users[0];
    console.log('👤 Testing with user:', testUser);
    
    // Test creating verification data (similar to what RegistrationPage will do)
    const testVerificationData = {
      user_id: testUser.id,
      name: testUser.name || 'Test User',
      roll_no: testUser.roll_number || 'TEST123',
      reg_no: `REG-${testUser.roll_number || 'TEST123'}-${Date.now()}`,
      is_verified: true,
      status: 'approved',
      department: testUser.department || 'কম্পিউটার টেকনোলজি',
      institute_name: testUser.institute_name || 'ঢাকা পলিটেকনিক ইনস্টিটিউট',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🧪 Testing verification data creation...');
    console.log('📝 Data to insert:', testVerificationData);
    
    // Check if verification data already exists for this user
    const { data: existingData, error: checkError } = await supabase
      .from('verification_data')
      .select('*')
      .eq('user_id', testUser.id)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing verification data:', checkError);
      return;
    }
    
    let insertResult;
    let insertError;
    
    if (existingData) {
      console.log('📝 Updating existing verification data...');
      const { data, error } = await supabase
        .from('verification_data')
        .update({
          name: testVerificationData.name,
          roll_no: testVerificationData.roll_no,
          reg_no: testVerificationData.reg_no,
          is_verified: testVerificationData.is_verified,
          status: testVerificationData.status,
          department: testVerificationData.department,
          institute_name: testVerificationData.institute_name,
          updated_at: testVerificationData.updated_at
        })
        .eq('user_id', testUser.id)
        .select()
        .single();
      insertResult = data;
      insertError = error;
    } else {
      console.log('🆕 Creating new verification data...');
      const { data, error } = await supabase
        .from('verification_data')
        .insert(testVerificationData)
        .select()
        .single();
      insertResult = data;
      insertError = error;
    }
    
    if (insertError) {
      console.error('❌ Error inserting verification data:', insertError);
      
      // Provide specific error help
      if (insertError.code === '23505') {
        console.log('💡 This is a unique constraint violation. Checking existing data...');
        
        const { data: existing, error: checkError } = await supabase
          .from('verification_data')
          .select('*')
          .eq('user_id', testUser.id);
        
        if (!checkError && existing) {
          console.log('📋 Existing verification data:', existing);
        }
      } else if (insertError.code === '42501') {
        console.log('💡 Permission denied. Make sure RLS policies allow this operation.');
      } else if (insertError.code === '23503') {
        console.log('💡 Foreign key constraint violation. Check if user_id exists in auth.users table.');
      }
      
      return;
    }
    
    console.log('✅ Verification data created successfully:', insertResult);
    
    // Test reading the created data
    const { data: readResult, error: readError } = await supabase
      .from('verification_data')
      .select('*')
      .eq('user_id', testUser.id)
      .single();
    
    if (readError) {
      console.error('❌ Error reading verification data:', readError);
      return;
    }
    
    console.log('✅ Verification data read successfully:', readResult);
    
    // Test the verification status check
    console.log('🧪 Testing verification status check...');
    
    const isVerified = readResult.is_verified === true && readResult.status === 'approved';
    console.log(`✅ User verification status: ${isVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
    
    console.log('\n🎉 All tests passed! The verification_data table is working correctly.');
    console.log('📝 Next steps:');
    console.log('   1. Profile completion will now automatically create verification entries');
    console.log('   2. Users will be verified immediately after registration');
    console.log('   3. They can access all features like book selling');
    
  } catch (error) {
    console.error('💥 Test script error:', error);
  }
}

// Run the test
testVerificationTable();

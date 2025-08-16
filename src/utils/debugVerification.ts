// Debug utility to check user verification status
const debugVerification = async () => {
  try {
    // Get current user from Supabase auth
    const { supabase } = await import('../lib/supabase');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth Error:', authError);
      return;
    }
    
    if (!user) {
      console.log('❌ No user is currently logged in');
      return;
    }
    
    console.log('🔍 === VERIFICATION DEBUG REPORT ===');
    console.log('👤 Current User:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at
    });
    
    // Check verification_data table directly
    console.log('\n📊 Checking verification_data table...');
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_data')
      .select('*')
      .eq('user_id', user.id);
    
    if (verificationError) {
      console.error('❌ Verification Data Error:', verificationError);
    } else {
      console.log('✅ Verification Data Query Result:', {
        recordCount: verificationData?.length || 0,
        records: verificationData
      });
      
      if (verificationData && verificationData.length > 0) {
        const record = verificationData[0];
        console.log('\n📝 First Verification Record:', {
          id: record.id,
          user_id: record.user_id,
          is_verified: record.is_verified,
          status: record.status,
          name: record.name,
          roll_no: record.roll_no,
          reg_no: record.reg_no,
          created_at: record.created_at,
          updated_at: record.updated_at,
          document_url: record.document_url
        });
        
        console.log('\n🎯 Verification Status Check:', {
          'record.is_verified': record.is_verified,
          'record.is_verified === true': record.is_verified === true,
          'Boolean(record.is_verified)': Boolean(record.is_verified),
          'typeof record.is_verified': typeof record.is_verified
        });
      } else {
        console.log('⚠️ No verification records found for this user');
      }
    }
    
    // Test the getUserVerificationStatus function
    console.log('\n🔧 Testing getUserVerificationStatus function...');
    const { getUserVerificationStatus } = await import('../lib/supabase');
    const verificationResult = await getUserVerificationStatus(user.id);
    console.log('📋 Function Result:', verificationResult);
    
    // Check profiles table for reference
    console.log('\n👤 Checking profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('❌ Profile Error:', profileError);
    } else if (profileData) {
      console.log('✅ Profile Data:', {
        id: profileData.id,
        name: profileData.name,
        institute_name: profileData.institute_name,
        department: profileData.department,
        semester: profileData.semester,
        roll_number: profileData.roll_number
      });
    } else {
      console.log('⚠️ No profile found for this user');
    }
    
    console.log('\n🔍 === END DEBUG REPORT ===');
    
  } catch (error) {
    console.error('❌ Debug utility error:', error);
  }
};

// Make it available globally
(window as any).debugVerification = debugVerification;

console.log('🐛 Debug utility loaded. Run `window.debugVerification()` to check verification status.');

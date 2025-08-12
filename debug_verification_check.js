const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugVerificationCheck() {
  try {
    console.log('🔍 Starting verification system debug...\n');
    
    // 1. Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log('👥 Found users:', users.length);
    
    // 2. Check verification data for each user
    for (const user of users) {
      console.log(`\n📋 Checking user: ${user.name} (${user.id})`);
      
      // Check verification_data table
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (verificationError) {
        console.error(`  ❌ Error checking verification_data:`, verificationError);
        continue;
      }
      
      if (!verificationData) {
        console.log(`  ❌ No verification record found`);
      } else {
        console.log(`  ✅ Verification record found:`);
        console.log(`     - is_verified: ${verificationData.is_verified}`);
        console.log(`     - status: ${verificationData.status}`);
        console.log(`     - roll_no: ${verificationData.roll_no}`);
        console.log(`     - reg_no: ${verificationData.reg_no}`);
        console.log(`     - created_at: ${verificationData.created_at}`);
        console.log(`     - updated_at: ${verificationData.updated_at}`);
      }
      
      // Test the is_user_verified function (if it exists)
      try {
        const { data: isVerifiedRPC, error: rpcError } = await supabase
          .rpc('is_user_verified', { user_id_param: user.id });
        
        if (!rpcError) {
          console.log(`  🔧 is_user_verified() function result: ${isVerifiedRPC}`);
        } else {
          console.log(`  ⚠️  is_user_verified() function not available or error:`, rpcError.message);
        }
      } catch (rpcEx) {
        console.log(`  ⚠️  is_user_verified() function test failed:`, rpcEx.message);
      }
    }
    
    // 3. Check if we can update verification status
    console.log('\n\n🧪 Testing verification status update...');
    
    if (users.length > 0) {
      const testUserId = users[0].id;
      
      // Try to update is_verified to true
      const { data: updateData, error: updateError } = await supabase
        .from('verification_data')
        .update({ 
          is_verified: true, 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testUserId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating verification:', updateError);
      } else {
        console.log('✅ Successfully updated verification status');
        console.log('   Updated data:', updateData);
      }
    }
    
    // 4. Check RLS policies
    console.log('\n\n🔒 Checking RLS policies...');
    
    // Try to select all verification data (should only see your own)
    const { data: allData, error: allError } = await supabase
      .from('verification_data')
      .select('user_id, is_verified, status');
    
    if (!allError) {
      console.log(`✅ Can read ${allData.length} verification records`);
    } else {
      console.log('❌ Cannot read verification records:', allError.message);
    }
    
  } catch (error) {
    console.error('💥 Debug script error:', error);
  }
}

// Run the debug
debugVerificationCheck();

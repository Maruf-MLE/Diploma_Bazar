const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to manually verify a user (for testing)
async function verifyUserManually(userId, rollNo = null, regNo = null) {
  try {
    console.log(`🔧 Manually verifying user: ${userId}`);
    
    // Check if user already has verification record
    const { data: existing, error: checkError } = await supabase
      .from('verification_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Error checking existing data:', checkError);
      return { success: false, error: checkError };
    }
    
    if (existing) {
      // Update existing record to verified
      const { data: updated, error: updateError } = await supabase
        .from('verification_data')
        .update({ 
          is_verified: true, 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating verification:', updateError);
        return { success: false, error: updateError };
      }
      
      console.log('✅ Updated existing verification record:', updated);
      return { success: true, data: updated, action: 'updated' };
    } else {
      // Create new verified record
      const { data: created, error: createError } = await supabase
        .from('verification_data')
        .insert({
          user_id: userId,
          name: 'Test User',
          roll_no: rollNo || `TEST${Math.floor(Math.random() * 10000)}`,
          reg_no: regNo || `REG${Date.now()}`,
          is_verified: true,
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating verification:', createError);
        return { success: false, error: createError };
      }
      
      console.log('✅ Created new verification record:', created);
      return { success: true, data: created, action: 'created' };
    }
  } catch (error) {
    console.error('💥 Exception in verifyUserManually:', error);
    return { success: false, error };
  }
}

async function testVerificationStatus() {
  try {
    console.log('🔍 Checking verification_data table structure...');
    
    // First, let's see what users exist
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log('📋 Available users:', users);
    
    if (users && users.length > 0) {
      const testUserId = users[0].id;
      console.log(`\n🧪 Testing with user: ${users[0].name} (${testUserId})`);
      
      // Check current verification status
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_data')
        .select('*')
        .eq('user_id', testUserId)
        .maybeSingle();
      
      if (verificationError) {
        console.error('❌ Error checking verification:', verificationError);
        return;
      }
      
      if (!verificationData) {
        console.log('📝 No verification record found. Creating a verified test record...');
        
        // Create a verified test record
        const { data: newRecord, error: insertError } = await supabase
          .from('verification_data')
          .insert({
            user_id: testUserId,
            name: users[0].name || 'Test User',
            roll_no: 'TEST001',
            reg_no: 'REG001',
            is_verified: true,
            status: 'approved'
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Error creating verification record:', insertError);
          return;
        }
        
        console.log('✅ Created verified test record:', newRecord);
      } else {
        console.log('📋 Current verification data:', verificationData);
        
        // Toggle verification status for testing
        const newStatus = !verificationData.is_verified;
        console.log(`🔄 Toggling verification status to: ${newStatus}`);
        
        const { data: updatedRecord, error: updateError } = await supabase
          .from('verification_data')
          .update({ 
            is_verified: newStatus,
            status: newStatus ? 'approved' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', testUserId)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Error updating verification:', updateError);
          return;
        }
        
        console.log('✅ Updated verification record:', updatedRecord);
      }
    }
    
    // Test verification function
    console.log('\n🧪 Testing getUserVerificationStatus function...');
    const testUserId = users[0].id;
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('verification_data')
      .select('is_verified, status, name, roll_no, reg_no')
      .eq('user_id', testUserId)
      .maybeSingle();
    
    if (finalError) {
      console.error('❌ Final check error:', finalError);
      return;
    }
    
    if (finalCheck) {
      console.log('✅ Final verification status:', {
        userId: testUserId,
        isVerified: finalCheck.is_verified,
        status: finalCheck.status,
        hasName: !!finalCheck.name,
        hasRollNo: !!finalCheck.roll_no,
        hasRegNo: !!finalCheck.reg_no
      });
    } else {
      console.log('❌ No verification data found in final check');
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

// Run the test
testVerificationStatus();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSampleVerificationData() {
  try {
    console.log('🔍 Checking existing verification data...');
    
    // Check if there's any existing verification data
    const { data: existingData, error: checkError } = await supabase
      .from('verification_data')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking existing data:', checkError);
      return;
    }
    
    if (existingData && existingData.length > 0) {
      console.log('✅ Verification data already exists. No need to create sample data.');
      return;
    }
    
    console.log('📝 No verification data found. Creating sample data...');
    
    // Get a random user from profiles table to use as sample
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, institute_name')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('📝 No profiles found. Creating a dummy verification entry...');
      
      // Create a dummy verification entry with a fake UUID
      const dummyUserId = '00000000-0000-0000-0000-000000000001';
      
      const { data: insertData, error: insertError } = await supabase
        .from('verification_data')
        .insert([
          {
            user_id: dummyUserId,
            name: 'John Doe (Sample)',
            roll_no: '12345',
            reg_no: 'REG123',
            document_url: 'https://example.com/sample-document.jpg',
            is_verified: false,
            status: 'pending'
          }
        ]);
      
      if (insertError) {
        console.error('❌ Error creating sample verification data:', insertError);
        return;
      }
      
      console.log('✅ Sample verification data created successfully');
      
    } else {
      // Use an existing profile
      const profile = profiles[0];
      
      const { data: insertData, error: insertError } = await supabase
        .from('verification_data')
        .insert([
          {
            user_id: profile.id,
            name: profile.name + ' (Verification Request)',
            roll_no: '12345',
            reg_no: 'REG123',
            document_url: 'https://example.com/sample-document.jpg',
            is_verified: false,
            status: 'pending'
          }
        ]);
      
      if (insertError) {
        console.error('❌ Error creating verification data:', insertError);
        return;
      }
      
      console.log('✅ Verification data created successfully for existing profile');
    }
    
    // Test the function again
    console.log('🧪 Testing verification function with new data...');
    const { data: testData, error: testError } = await supabase.rpc('get_combined_verification_data');
    
    if (testError) {
      console.error('❌ Function test failed:', testError);
      return;
    }
    
    console.log('✅ Function test successful!');
    console.log(`📊 Found ${testData?.length || 0} verification records`);
    
    if (testData && testData.length > 0) {
      console.log('📄 Sample record:');
      console.log(JSON.stringify(testData[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
createSampleVerificationData();

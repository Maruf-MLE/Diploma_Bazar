import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSimpleVerificationFunction() {
  try {
    console.log('🗑️ Dropping existing function...');
    
    // Drop the existing function
    const dropSQL = `DROP FUNCTION IF EXISTS public.get_combined_verification_data();`;
    
    const { data: dropData, error: dropError } = await supabase.rpc('exec_sql', {
      sql_query: dropSQL
    });
    
    if (dropError) {
      console.error('❌ Error dropping function:', dropError);
      return;
    }
    
    console.log('✅ Function dropped successfully');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🔧 Creating simple verification function...');
    
    // Create the new function without auth.users access
    const createSQL = `
    CREATE OR REPLACE FUNCTION public.get_combined_verification_data()
    RETURNS TABLE (
      id UUID,
      user_id UUID,
      email TEXT,
      name TEXT,
      roll_no TEXT,
      reg_no TEXT,
      document_url TEXT,
      photo_url TEXT,
      status TEXT,
      is_verified BOOLEAN,
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ,
      institute_name TEXT
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        v.id,
        v.user_id,
        ''::TEXT as email, -- Empty email since we can't access auth.users
        COALESCE(v.name, p.name, '')::TEXT as name,
        COALESCE(v.roll_no, '')::TEXT as roll_no,
        COALESCE(v.reg_no, '')::TEXT as reg_no,
        COALESCE(v.document_url, '')::TEXT as document_url,
        COALESCE(f.photo_url, '')::TEXT as photo_url,
        COALESCE(f.status, 'pending')::TEXT as status,
        COALESCE(v.is_verified, false) AS is_verified,
        v.created_at,
        v.updated_at,
        COALESCE(p.institute_name, '')::TEXT as institute_name
      FROM
        public.verification_data v
      LEFT JOIN
        public.profiles p ON v.user_id = p.id
      LEFT JOIN
        public.face_verification f ON v.user_id = f.user_id
      ORDER BY
        v.created_at DESC;
    END;
    $$ LANGUAGE plpgsql;

    -- Grant necessary permissions
    GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_combined_verification_data() TO anon;
    `;
    
    const { data: createData, error: createError } = await supabase.rpc('exec_sql', {
      sql_query: createSQL
    });
    
    if (createError) {
      console.error('❌ Error creating function:', createError);
      return;
    }
    
    console.log('✅ Function created successfully');
    
    // Test the function
    console.log('🧪 Testing the function...');
    const { data: testData, error: testError } = await supabase.rpc('get_combined_verification_data');
    
    if (testError) {
      console.error('❌ Function test failed:', testError);
      return;
    }
    
    console.log('✅ Function test successful!');
    console.log(`📊 Found ${testData?.length || 0} verification records`);
    
    if (testData && testData.length > 0) {
      console.log('📄 Sample record structure:');
      console.log(JSON.stringify(testData[0], null, 2));
    } else {
      console.log('📝 No verification data found. This is normal if no users have submitted verification requests yet.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
createSimpleVerificationFunction();

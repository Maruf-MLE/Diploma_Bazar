import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runFixVerificationFunction() {
  try {
    console.log('🔧 Starting verification function fix...');
    
    // Read the SQL command from file
    const sqlFilePath = path.join(process.cwd(), 'fix_verification_function_v2.sql');
    const sqlCommand = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 Running SQL command...');
    
    // Execute the SQL command to update the function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlCommand
    });
    
    if (error) {
      console.error('❌ Error running SQL command:', error);
      
      // Try alternative approach - direct function creation
      console.log('🔄 Trying alternative approach...');
      
      const functionSQL = `
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
          COALESCE(u.email, '')::TEXT as email,
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
        JOIN
          auth.users u ON v.user_id = u.id
        LEFT JOIN
          public.profiles p ON v.user_id = p.id
        LEFT JOIN
          public.face_verification f ON v.user_id = f.user_id
        ORDER BY
          v.created_at DESC;
      END;
      $$ LANGUAGE plpgsql;
      `;
      
      const { data: altData, error: altError } = await supabase.rpc('exec_sql', {
        sql_query: functionSQL
      });
      
      if (altError) {
        console.error('❌ Alternative approach also failed:', altError);
        return;
      }
      
      console.log('✅ Function updated successfully with alternative approach');
    } else {
      console.log('✅ Function updated successfully');
    }
    
    // Test the function
    console.log('🧪 Testing the updated function...');
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
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
runFixVerificationFunction();

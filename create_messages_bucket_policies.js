// Script to create the necessary storage policies for the messages bucket

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL statements to create policies
const CREATE_UPLOAD_POLICY = `
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'messages');
`;

const CREATE_SELECT_POLICY = `
CREATE POLICY "Allow authenticated users to view files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'messages');
`;

const CREATE_UPDATE_POLICY = `
CREATE POLICY "Allow authenticated users to update their files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'messages');
`;

const CREATE_DELETE_POLICY = `
CREATE POLICY "Allow authenticated users to delete their files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'messages');
`;

async function createPolicies() {
  try {
    console.log('Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('You need to be signed in to create storage policies.');
      console.log('Please run this command after signing in through the app.');
      return;
    }
    
    console.log('Authenticated as:', session.user.email);
    
    // Check if the messages bucket exists
    console.log('Checking if messages bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const messagesBucket = buckets.find(b => b.name === 'messages');
    
    if (!messagesBucket) {
      console.error('Messages bucket does not exist! Please create it first.');
      return;
    }
    
    console.log('Messages bucket found. Creating policies...');
    
    // Create policies using SQL
    try {
      // Upload policy
      console.log('Creating upload policy...');
      await supabase.rpc('exec_sql', { query: CREATE_UPLOAD_POLICY });
      console.log('✅ Upload policy created');
      
      // Select policy
      console.log('Creating select policy...');
      await supabase.rpc('exec_sql', { query: CREATE_SELECT_POLICY });
      console.log('✅ Select policy created');
      
      // Update policy
      console.log('Creating update policy...');
      await supabase.rpc('exec_sql', { query: CREATE_UPDATE_POLICY });
      console.log('✅ Update policy created');
      
      // Delete policy
      console.log('Creating delete policy...');
      await supabase.rpc('exec_sql', { query: CREATE_DELETE_POLICY });
      console.log('✅ Delete policy created');
      
    } catch (sqlError) {
      console.error('Error creating policies with SQL:', sqlError);
      console.log('\nYou may need to create the policies manually in the Supabase dashboard:');
      console.log('1. Go to Storage section > messages bucket > Policies');
      console.log('2. Create the following policies:');
      console.log('   - Allow authenticated users to upload files (INSERT)');
      console.log('   - Allow authenticated users to view files (SELECT)');
      console.log('   - Allow authenticated users to update their files (UPDATE)');
      console.log('   - Allow authenticated users to delete their files (DELETE)');
    }
    
    console.log('\nSetup complete! The messages bucket should now have the necessary policies.');
    console.log('\nIf you are still having issues with file uploads, please check:');
    console.log('1. Make sure you have created the messages bucket in the Supabase dashboard');
    console.log('2. Verify that the authenticated user has permission to upload files');
    console.log('3. Check the browser console for any specific error messages');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createPolicies(); 
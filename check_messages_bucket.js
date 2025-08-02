#!/usr/bin/env node

// Script to check if the messages bucket exists and report its status
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Main function to check the messages bucket
async function checkMessagesBucket() {
  console.log('Checking messages bucket status...');
  
  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      console.log('Please sign in to the app first, then run this script again.');
      return;
    }
    
    if (!session) {
      console.log('No active session found. Please sign in to the app first, then run this script again.');
      return;
    }
    
    console.log(`Authenticated as: ${session.user.email}`);
    
    // Check if the messages bucket exists
    console.log('Checking if messages bucket exists...');
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        console.log('You may not have permission to list buckets. Trying direct access...');
        
        // Try to directly access the messages bucket
        await checkDirectAccess();
        return;
      }
      
      const messagesBucket = buckets.find(b => b.name === 'messages');
      
      if (messagesBucket) {
        console.log('✅ Messages bucket exists!');
        console.log('Bucket details:', messagesBucket);
        
        // Check folders
        await checkFolders();
        
        // Check policies
        await checkPolicies();
        
        // Test upload
        await testUpload();
      } else {
        console.log('❌ Messages bucket does NOT exist!');
        console.log('Available buckets:', buckets.map(b => b.name).join(', '));
        console.log('\nYou need to create the messages bucket. You can:');
        console.log('1. Run the setup script: npm run setup:message-uploads');
        console.log('2. Manually create it through the Supabase dashboard');
        console.log('3. Run the SQL script: create_messages_bucket_only.sql');
      }
    } catch (error) {
      console.error('Error checking buckets:', error);
      console.log('Trying direct access method instead...');
      
      // Try to directly access the messages bucket
      await checkDirectAccess();
    }
  } catch (error) {
    console.error('Unexpected error during bucket check:', error);
  }
}

// Function to check direct access to the messages bucket
async function checkDirectAccess() {
  try {
    console.log('Attempting to directly access the messages bucket...');
    
    // Try to list files in the messages bucket
    const { data, error } = await supabase.storage
      .from('messages')
      .list();
    
    if (error) {
      console.error('Error accessing messages bucket:', error);
      console.log('❌ Messages bucket likely does NOT exist or you do not have access to it.');
      return;
    }
    
    console.log('✅ Messages bucket exists and is accessible!');
    console.log('Files/folders in root:', data.map(item => item.name).join(', ') || 'None');
    
    // Check folders
    await checkFolders();
    
    // Test upload
    await testUpload();
  } catch (error) {
    console.error('Error during direct access check:', error);
    console.log('❌ Could not access the messages bucket.');
  }
}

// Function to check if required folders exist
async function checkFolders() {
  try {
    console.log('\nChecking required folders...');
    
    // Check message_images folder
    const { data: imagesFolder, error: imagesFolderError } = await supabase.storage
      .from('messages')
      .list('message_images');
    
    if (imagesFolderError) {
      console.log('❌ message_images folder does not exist or is not accessible');
    } else {
      console.log('✅ message_images folder exists');
    }
    
    // Check message_documents folder
    const { data: docsFolder, error: docsFolderError } = await supabase.storage
      .from('messages')
      .list('message_documents');
    
    if (docsFolderError) {
      console.log('❌ message_documents folder does not exist or is not accessible');
    } else {
      console.log('✅ message_documents folder exists');
    }
    
    // If folders don't exist, provide instructions
    if (imagesFolderError || docsFolderError) {
      console.log('\nYou need to create the following folders in the messages bucket:');
      console.log('1. message_images');
      console.log('2. message_documents');
      console.log('\nYou can create them through the Supabase dashboard or by running the setup script.');
    }
  } catch (error) {
    console.error('Error checking folders:', error);
  }
}

// Function to check bucket policies
async function checkPolicies() {
  try {
    console.log('\nChecking bucket policies...');
    console.log('Note: We cannot directly check policies via the JavaScript client.');
    console.log('Please verify in the Supabase dashboard that the following policies exist:');
    console.log('1. Allow authenticated users to upload files (INSERT)');
    console.log('2. Allow authenticated users to view files (SELECT)');
    console.log('3. Allow authenticated users to update their files (UPDATE)');
    console.log('4. Allow authenticated users to delete their files (DELETE)');
  } catch (error) {
    console.error('Error checking policies:', error);
  }
}

// Function to test uploading a file
async function testUpload() {
  try {
    console.log('\nTesting file upload...');
    
    // Create a small test file
    const testContent = new Blob(['This is a test file to check bucket permissions.'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    const testFilePath = `test/${testFileName}`;
    
    // Try to upload the test file
    const { data, error } = await supabase.storage
      .from('messages')
      .upload(testFilePath, testContent);
    
    if (error) {
      console.error('❌ Test upload failed:', error);
      console.log('You may not have the correct permissions to upload files.');
      console.log('Please check the bucket policies in the Supabase dashboard.');
    } else {
      console.log('✅ Test upload successful!');
      console.log('File path:', data.path);
      
      // Get the URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(testFilePath);
      
      console.log('File URL:', publicUrl);
      
      // Try to delete the test file
      try {
        const { error: deleteError } = await supabase.storage
          .from('messages')
          .remove([testFilePath]);
        
        if (deleteError) {
          console.log('❌ Could not delete test file:', deleteError);
        } else {
          console.log('✅ Test file deleted successfully');
        }
      } catch (deleteError) {
        console.error('Error deleting test file:', deleteError);
      }
    }
  } catch (error) {
    console.error('Error during test upload:', error);
  }
}

// Run the check
checkMessagesBucket(); 
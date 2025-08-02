#!/usr/bin/env node

// Script to check if the messages bucket exists and report its status without requiring authentication
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
  console.log('Checking messages bucket status (no auth required)...');
  
  try {
    // Try to directly access the messages bucket
    await checkDirectAccess();
    
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
      
      // Check if the error is specifically about the bucket not existing
      if (error.message && (
          error.message.includes('bucket') || 
          error.message.includes('not found') || 
          error.message.includes('does not exist'))) {
        console.log('\nThe messages bucket does not exist. You need to create it by:');
        console.log('1. Running the setup script: npm run setup:message-uploads');
        console.log('2. Manually creating it through the Supabase dashboard');
        console.log('3. Running the SQL script: create_messages_bucket_only.sql');
      }
      
      return;
    }
    
    console.log('✅ Messages bucket exists and is accessible!');
    console.log('Files/folders in root:', data.map(item => item.name).join(', ') || 'None');
    
    // Check folders
    await checkFolders();
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
    
    console.log('\nBucket Policies:');
    console.log('Note: We cannot directly check policies via the JavaScript client.');
    console.log('Please verify in the Supabase dashboard that the following policies exist:');
    console.log('1. Allow authenticated users to upload files (INSERT)');
    console.log('2. Allow authenticated users to view files (SELECT)');
    console.log('3. Allow authenticated users to update their files (UPDATE)');
    console.log('4. Allow authenticated users to delete their files (DELETE)');
    
  } catch (error) {
    console.error('Error checking folders:', error);
  }
}

// Run the check
checkMessagesBucket(); 
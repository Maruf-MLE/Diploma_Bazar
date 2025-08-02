// Script to create the messages storage bucket in Supabase

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createMessagesBucket() {
  try {
    console.log('Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return;
    }
    
    if (!session) {
      console.log('You need to be signed in to create buckets and set policies.');
      console.log('Please run this command after signing in through the app.');
      return;
    }
    
    console.log('Authenticated as:', session.user.email);
    
    // Check if the bucket already exists
    console.log('Checking if messages bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const messagesBucket = buckets.find(b => b.name === 'messages');
    
    if (messagesBucket) {
      console.log('✅ Messages bucket already exists.');
    } else {
      // Create the messages bucket
      console.log('Creating messages bucket...');
      const { data, error } = await supabase.storage.createBucket('messages', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }
      
      console.log('✅ Messages bucket created successfully!');
    }
    
    // Create folders inside the bucket
    console.log('Creating folders inside the bucket...');
    
    // Create a simple text file to represent a folder
    const folderMarker = new Blob([''], { type: 'text/plain' });
    
    // Create message_images folder
    try {
      const { error: imagesFolderError } = await supabase.storage
        .from('messages')
        .upload('message_images/.folder', folderMarker);
      
      if (!imagesFolderError || imagesFolderError.message.includes('already exists')) {
        console.log('✅ message_images folder created or already exists');
      } else {
        console.warn('Warning creating message_images folder:', imagesFolderError);
      }
    } catch (error) {
      console.warn('Error creating message_images folder:', error);
    }
    
    // Create message_documents folder
    try {
      const { error: docsFolderError } = await supabase.storage
        .from('messages')
        .upload('message_documents/.folder', folderMarker);
      
      if (!docsFolderError || docsFolderError.message.includes('already exists')) {
        console.log('✅ message_documents folder created or already exists');
      } else {
        console.warn('Warning creating message_documents folder:', docsFolderError);
      }
    } catch (error) {
      console.warn('Error creating message_documents folder:', error);
    }
    
    console.log('\nSetup complete! The messages bucket is now ready for use.');
    console.log('\nIf you are still having issues with file uploads, please check:');
    console.log('1. Make sure you have the correct bucket policies in the Supabase dashboard');
    console.log('2. Verify that the authenticated user has permission to upload files');
    console.log('3. Check the browser console for any specific error messages');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createMessagesBucket(); 
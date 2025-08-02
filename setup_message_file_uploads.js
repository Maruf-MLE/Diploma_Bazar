#!/usr/bin/env node

// Script to set up message file uploads in Supabase

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a log file
const logFile = path.join(__dirname, 'message_upload_setup.log');
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, logMessage);
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const errorDetails = error ? `\n${error.stack || error}` : '';
    const logMessage = `[${timestamp}] ERROR: ${message}${errorDetails}\n`;
    console.error(message);
    if (error) console.error(error);
    fs.appendFileSync(logFile, logMessage);
  }
};

// Initialize log file
fs.writeFileSync(logFile, `=== Message Upload Setup Log - ${new Date().toISOString()} ===\n`);

async function setupMessageUploads() {
  logger.log('Starting message upload setup...');
  
  try {
    // Check authentication
    logger.log('Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logger.error('Error getting session:', sessionError);
      logger.log('Please sign in to the app first, then run this script again.');
      return;
    }
    
    if (!session) {
      logger.log('No active session found. Please sign in to the app first, then run this script again.');
      return;
    }
    
    logger.log(`Authenticated as: ${session.user.email}`);
    
    // Check if the messages bucket exists
    logger.log('Checking if messages bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      logger.error('Error listing buckets:', bucketsError);
      return;
    }
    
    let messagesBucket = buckets.find(b => b.name === 'messages');
    
    // Create the bucket if it doesn't exist
    if (!messagesBucket) {
      logger.log('Messages bucket does not exist. Creating...');
      
      try {
        const { data, error } = await supabase.storage.createBucket('messages', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (error) {
          logger.error('Error creating bucket:', error);
          logger.log('\nYou may need to create the bucket manually in the Supabase dashboard:');
          logger.log('1. Go to Storage section');
          logger.log('2. Click "New Bucket"');
          logger.log('3. Name the bucket "messages"');
          logger.log('4. Uncheck "Public bucket"');
          logger.log('5. Click "Create bucket"');
          return;
        }
        
        logger.log('Messages bucket created successfully!');
        
        // Refresh the bucket list
        const { data: updatedBuckets } = await supabase.storage.listBuckets();
        messagesBucket = updatedBuckets.find(b => b.name === 'messages');
      } catch (createError) {
        logger.error('Error creating bucket:', createError);
        return;
      }
    } else {
      logger.log('Messages bucket already exists.');
    }
    
    // Create folders inside the bucket
    logger.log('Creating folders inside the bucket...');
    
    // Create a simple text file to represent a folder
    const folderMarker = new Blob([''], { type: 'text/plain' });
    
    // Create message_images folder
    try {
      logger.log('Creating message_images folder...');
      const { error: imagesFolderError } = await supabase.storage
        .from('messages')
        .upload('message_images/.folder', folderMarker);
      
      if (!imagesFolderError || imagesFolderError.message.includes('already exists')) {
        logger.log('✅ message_images folder created or already exists');
      } else {
        logger.error('Warning creating message_images folder:', imagesFolderError);
      }
    } catch (error) {
      logger.error('Error creating message_images folder:', error);
    }
    
    // Create message_documents folder
    try {
      logger.log('Creating message_documents folder...');
      const { error: docsFolderError } = await supabase.storage
        .from('messages')
        .upload('message_documents/.folder', folderMarker);
      
      if (!docsFolderError || docsFolderError.message.includes('already exists')) {
        logger.log('✅ message_documents folder created or already exists');
      } else {
        logger.error('Warning creating message_documents folder:', docsFolderError);
      }
    } catch (error) {
      logger.error('Error creating message_documents folder:', error);
    }
    
    // Create policies
    logger.log('Setting up storage policies...');
    
    // Create a test file to check permissions
    logger.log('Testing upload permissions...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = new Blob(['This is a test file to check bucket permissions.'], { type: 'text/plain' });
    
    const { error: testUploadError } = await supabase.storage
      .from('messages')
      .upload(testFileName, testContent);
    
    if (testUploadError) {
      logger.error('Error uploading test file. This indicates missing permissions:', testUploadError);
      logger.log('\nYou need to set up bucket policies in the Supabase dashboard:');
      logger.log('1. Go to Storage section > messages bucket > Policies');
      logger.log('2. Create the following policies:');
      logger.log('   - Allow authenticated users to upload files (INSERT)');
      logger.log('   - Allow authenticated users to view files (SELECT)');
      
      // Try to create policies using SQL
      logger.log('\nAttempting to create policies automatically...');
      
      try {
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
        
        // Try to execute the SQL
        logger.log('Creating upload policy...');
        await supabase.rpc('exec_sql', { query: CREATE_UPLOAD_POLICY });
        
        logger.log('Creating select policy...');
        await supabase.rpc('exec_sql', { query: CREATE_SELECT_POLICY });
        
        logger.log('Policies created successfully!');
        
        // Test upload again
        const { error: retryUploadError } = await supabase.storage
          .from('messages')
          .upload(`test-retry-${Date.now()}.txt`, testContent);
        
        if (retryUploadError) {
          logger.error('Still having issues with uploads after creating policies:', retryUploadError);
          logger.log('You may need to set up policies manually in the Supabase dashboard.');
        } else {
          logger.log('✅ Upload now works correctly!');
        }
        
      } catch (sqlError) {
        logger.error('Error creating policies with SQL:', sqlError);
        logger.log('You will need to create the policies manually in the Supabase dashboard.');
      }
    } else {
      logger.log('✅ Upload permissions are correctly set up!');
      
      // Try to get the URL to verify download permissions
      const { data: { publicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(testFileName);
      
      logger.log(`Test file URL: ${publicUrl}`);
    }
    
    logger.log('\nSetup complete! The messages bucket should now be ready for use.');
    logger.log('\nIf you are still having issues with file uploads, please check:');
    logger.log('1. Make sure you have created the messages bucket in the Supabase dashboard');
    logger.log('2. Verify that the authenticated user has permission to upload files');
    logger.log('3. Check the browser console for any specific error messages');
    logger.log(`4. Review the setup log file at: ${logFile}`);
    
  } catch (error) {
    logger.error('Unexpected error during setup:', error);
  }
}

// Run the setup
setupMessageUploads(); 
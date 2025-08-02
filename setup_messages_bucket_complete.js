#!/usr/bin/env node

// Comprehensive script to set up the messages bucket in Supabase

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
const logFile = path.join(__dirname, 'messages_bucket_setup.log');
fs.writeFileSync(logFile, `=== Messages Bucket Setup Log - ${new Date().toISOString()} ===\n`);

// Helper function to log messages
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
};

// Helper function to log errors
const logError = (message, error) => {
  const timestamp = new Date().toISOString();
  const errorDetails = error ? `\n${error.stack || error}` : '';
  const logMessage = `[${timestamp}] ERROR: ${message}${errorDetails}\n`;
  console.error(message);
  if (error) console.error(error);
  fs.appendFileSync(logFile, logMessage);
};

// SQL statements for creating bucket and policies
const SQL_CREATE_BUCKET = `
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'messages', 
  'messages', 
  false, 
  10485760, 
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'text/plain', 'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'application/vnd.ms-powerpoint', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO NOTHING;
`;

const SQL_CREATE_POLICIES = `
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow authenticated users to upload files"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to upload files" already exists. Skipping.';
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to view files"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to view files" already exists. Skipping.';
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to update their files"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to update their files" already exists. Skipping.';
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to delete their files"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to delete their files" already exists. Skipping.';
    END;
END
$$;
`;

// Main function to set up the messages bucket
async function setupMessagesBucket() {
  log('Starting messages bucket setup...');
  
  try {
    // Check authentication
    log('Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logError('Error getting session:', sessionError);
      log('Please sign in to the app first, then run this script again.');
      return;
    }
    
    if (!session) {
      log('No active session found. Please sign in to the app first, then run this script again.');
      return;
    }
    
    log(`Authenticated as: ${session.user.email}`);
    
    // Check if the messages bucket exists
    log('Checking if messages bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      logError('Error listing buckets:', bucketsError);
      return;
    }
    
    const messagesBucket = buckets.find(b => b.name === 'messages');
    
    if (messagesBucket) {
      log('Messages bucket already exists.');
    } else {
      log('Messages bucket does not exist. Creating...');
      
      // Try to create the bucket using the API
      try {
        const { data, error } = await supabase.storage.createBucket('messages', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (error) {
          logError('Error creating bucket via API:', error);
          log('Attempting to create bucket using SQL...');
          
          // Try to create the bucket using SQL
          try {
            await supabase.rpc('exec_sql', { query: SQL_CREATE_BUCKET });
            log('Messages bucket created successfully via SQL!');
          } catch (sqlError) {
            logError('Error creating bucket via SQL:', sqlError);
            log('\nYou may need to create the bucket manually in the Supabase dashboard:');
            log('1. Go to Storage section');
            log('2. Click "New Bucket"');
            log('3. Name the bucket "messages"');
            log('4. Uncheck "Public bucket"');
            log('5. Click "Create bucket"');
            return;
          }
        } else {
          log('Messages bucket created successfully via API!');
        }
      } catch (createError) {
        logError('Error creating bucket:', createError);
        return;
      }
    }
    
    // Create folders inside the bucket
    log('Creating folders inside the bucket...');
    
    // Create a simple text file to represent a folder
    const folderMarker = new Blob([''], { type: 'text/plain' });
    
    // Create message_images folder
    try {
      log('Creating message_images folder...');
      const { error: imagesFolderError } = await supabase.storage
        .from('messages')
        .upload('message_images/.folder', folderMarker);
      
      if (!imagesFolderError || imagesFolderError.message.includes('already exists')) {
        log('✅ message_images folder created or already exists');
      } else {
        logError('Warning creating message_images folder:', imagesFolderError);
      }
    } catch (error) {
      logError('Error creating message_images folder:', error);
    }
    
    // Create message_documents folder
    try {
      log('Creating message_documents folder...');
      const { error: docsFolderError } = await supabase.storage
        .from('messages')
        .upload('message_documents/.folder', folderMarker);
      
      if (!docsFolderError || docsFolderError.message.includes('already exists')) {
        log('✅ message_documents folder created or already exists');
      } else {
        logError('Warning creating message_documents folder:', docsFolderError);
      }
    } catch (error) {
      logError('Error creating message_documents folder:', error);
    }
    
    // Create policies
    log('Setting up storage policies...');
    
    try {
      log('Creating policies via SQL...');
      await supabase.rpc('exec_sql', { query: SQL_CREATE_POLICIES });
      log('✅ Storage policies created successfully!');
    } catch (policiesError) {
      logError('Error creating policies via SQL:', policiesError);
      log('\nYou may need to create the policies manually in the Supabase dashboard:');
      log('1. Go to Storage section > messages bucket > Policies');
      log('2. Create the following policies:');
      log('   - Allow authenticated users to upload files (INSERT)');
      log('   - Allow authenticated users to view files (SELECT)');
      log('   - Allow authenticated users to update their files (UPDATE)');
      log('   - Allow authenticated users to delete their files (DELETE)');
    }
    
    // Test upload to verify everything is working
    log('Testing upload permissions...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = new Blob(['This is a test file to check bucket permissions.'], { type: 'text/plain' });
    
    try {
      const { error: testUploadError } = await supabase.storage
        .from('messages')
        .upload(testFileName, testContent);
      
      if (testUploadError) {
        logError('Error uploading test file:', testUploadError);
        log('There might be issues with the bucket permissions.');
      } else {
        log('✅ Test upload successful! The messages bucket is ready for use.');
        
        // Get the public URL to verify download permissions
        const { data: { publicUrl } } = supabase.storage
          .from('messages')
          .getPublicUrl(testFileName);
        
        log(`Test file URL: ${publicUrl}`);
      }
    } catch (testError) {
      logError('Error during test upload:', testError);
    }
    
    log('\nSetup complete! The messages bucket should now be ready for use.');
    log('\nIf you are still having issues with file uploads, please check:');
    log('1. Make sure you have created the messages bucket in the Supabase dashboard');
    log('2. Verify that the authenticated user has permission to upload files');
    log('3. Check the browser console for any specific error messages');
    log(`4. Review the setup log file at: ${logFile}`);
    
  } catch (error) {
    logError('Unexpected error during setup:', error);
  }
}

// Run the setup
setupMessagesBucket(); 
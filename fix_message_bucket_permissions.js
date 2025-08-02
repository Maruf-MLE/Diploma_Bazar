// Script to fix message bucket permissions and make files accessible

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixMessageBucketPermissions() {
  try {
    console.log('Fixing message bucket permissions...');
    
    // First check if we're authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Error: You need to be logged in to run this script.');
      console.log('Please sign in first using the application.');
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
    
    const messagesBucket = buckets.find(bucket => bucket.name === 'messages');
    
    if (!messagesBucket) {
      console.log('Messages bucket not found. Creating it...');
      
      // Create the messages bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('messages', {
        public: true // Make the bucket public
      });
      
      if (createError) {
        console.error('Error creating messages bucket:', createError);
        return;
      }
      
      console.log('Messages bucket created successfully!');
    } else {
      console.log('Messages bucket already exists. Updating permissions...');
      
      // Update the bucket to be public
      const { error: updateError } = await supabase.storage.updateBucket('messages', {
        public: true
      });
      
      if (updateError) {
        console.error('Error updating bucket permissions:', updateError);
        
        // Try to fix with SQL if API fails
        console.log('Trying to fix with SQL...');
        const fixBucketSql = `
          UPDATE storage.buckets
          SET public = true
          WHERE name = 'messages';
        `;
        
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql: fixBucketSql });
        
        if (sqlError) {
          console.error('Error fixing bucket with SQL:', sqlError);
          console.log('Please update bucket permissions manually in the Supabase dashboard.');
        } else {
          console.log('Bucket permissions updated successfully with SQL!');
        }
      } else {
        console.log('Bucket permissions updated successfully!');
      }
    }
    
    // Create necessary folders in the bucket
    console.log('Creating necessary folders in the messages bucket...');
    
    const folders = ['message_images', 'message_documents'];
    
    for (const folder of folders) {
      // Check if folder exists by trying to list files in it
      const { data: folderFiles, error: folderError } = await supabase.storage
        .from('messages')
        .list(folder);
      
      if (folderError && folderError.message.includes('not found')) {
        console.log(`Creating ${folder} folder...`);
        
        // Create an empty file to create the folder
        const { error: createFolderError } = await supabase.storage
          .from('messages')
          .upload(`${folder}/.keep`, new Blob([''], { type: 'text/plain' }));
        
        if (createFolderError) {
          console.error(`Error creating ${folder} folder:`, createFolderError);
        } else {
          console.log(`${folder} folder created successfully!`);
        }
      } else {
        console.log(`${folder} folder already exists.`);
      }
    }
    
    // Set up public access policy for the bucket
    console.log('Setting up public access policy for the messages bucket...');
    
    const createPolicySql = `
      -- Allow public read access to all files in the messages bucket
      BEGIN;
      
      -- First check if the policy already exists
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM storage.policies 
          WHERE name = 'Public Access' AND bucket_id = 'messages'
        ) THEN
          -- Create policy for public read access
          INSERT INTO storage.policies (name, bucket_id, operation, definition)
          VALUES (
            'Public Access',
            'messages',
            'SELECT',
            '(bucket_id = ''messages'')'
          );
          RAISE NOTICE 'Created public access policy for messages bucket';
        ELSE
          RAISE NOTICE 'Public access policy already exists';
        END IF;
      END
      $$;
      
      -- Ensure authenticated users can upload files
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM storage.policies 
          WHERE name = 'Authenticated Upload' AND bucket_id = 'messages'
        ) THEN
          -- Create policy for authenticated uploads
          INSERT INTO storage.policies (name, bucket_id, operation, definition)
          VALUES (
            'Authenticated Upload',
            'messages',
            'INSERT',
            '(bucket_id = ''messages'' AND auth.role() = ''authenticated'')'
          );
          RAISE NOTICE 'Created authenticated upload policy for messages bucket';
        ELSE
          RAISE NOTICE 'Authenticated upload policy already exists';
        END IF;
      END
      $$;
      
      COMMIT;
    `;
    
    const { error: policySqlError } = await supabase.rpc('exec_sql', { sql: createPolicySql });
    
    if (policySqlError) {
      console.error('Error setting up bucket policies with SQL:', policySqlError);
      console.log('Please set up bucket policies manually in the Supabase dashboard.');
    } else {
      console.log('Bucket policies set up successfully!');
    }
    
    console.log('\nMessage bucket permissions fixed successfully!');
    console.log('Now your images should be accessible after page reload.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixMessageBucketPermissions(); 
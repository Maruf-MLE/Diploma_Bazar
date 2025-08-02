// Script to run the SQL migration for adding file attachments to messages

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    console.log('Running file attachments migration...');
    
    // First check if we're authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Error: You need to be logged in to run this migration.');
      console.log('Please sign in first using the application.');
      return;
    }
    
    console.log('Authenticated as:', session.user.email);
    
    // Add the columns to messages table
    const addColumnsSQL = `
      -- Add file columns to messages table if they don't exist
      BEGIN;
      
      -- Add file_url column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'messages' 
          AND column_name = 'file_url'
        ) THEN
          ALTER TABLE public.messages 
          ADD COLUMN file_url TEXT;
          RAISE NOTICE 'Added file_url column to messages table';
        ELSE
          RAISE NOTICE 'file_url column already exists';
        END IF;
      END
      $$;

      -- Add file_type column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'messages' 
          AND column_name = 'file_type'
        ) THEN
          ALTER TABLE public.messages 
          ADD COLUMN file_type TEXT;
          RAISE NOTICE 'Added file_type column to messages table';
        ELSE
          RAISE NOTICE 'file_type column already exists';
        END IF;
      END
      $$;

      -- Add file_name column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'messages' 
          AND column_name = 'file_name'
        ) THEN
          ALTER TABLE public.messages 
          ADD COLUMN file_name TEXT;
          RAISE NOTICE 'Added file_name column to messages table';
        ELSE
          RAISE NOTICE 'file_name column already exists';
        END IF;
      END
      $$;
      
      COMMIT;
    `;
    
    // Run the migration SQL
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: addColumnsSQL });
    if (migrationError) {
      console.error('Error running migration SQL:', migrationError);
      return;
    }
    
    console.log('Successfully added file attachment columns to messages table');
    
    // Save the migration SQL to a file in the migrations directory
    const migrationFilePath = 'supabase/migrations/20250807000000_add_file_attachments_to_messages.sql';
    fs.writeFileSync(migrationFilePath, 
      `-- Add file attachment columns to messages table
      ${addColumnsSQL}`
    );
    console.log(`Migration SQL saved to ${migrationFilePath}`);
    
    // Try to create the storage bucket
    console.log('\nChecking if the messages bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      console.log('Could not check if messages bucket exists.');
      console.log('Please create the bucket manually via the Supabase dashboard.');
      return;
    }
    
    const messagesBucket = buckets.find(b => b.name === 'messages');
    
    if (!messagesBucket) {
      console.log('Messages bucket does not exist. Attempting to create it...');
      
      try {
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('messages', {
          public: false,
        });
        
        if (createError) {
          console.error('Error creating messages bucket:', createError);
          console.log('Please create the bucket manually via the Supabase dashboard.');
          return;
        }
        
        console.log('Successfully created messages bucket!');
      } catch (error) {
        console.error('Error creating bucket:', error);
        console.log('Please create the bucket manually via the Supabase dashboard.');
        return;
      }
    } else {
      console.log('Messages bucket already exists.');
    }
    
    console.log('\nFile attachments migration complete!');
    console.log('Next steps:');
    console.log('1. Ensure you have proper storage policies set up in the Supabase dashboard');
    console.log('2. Run node check_messages_bucket.js to verify the setup');
    console.log('3. Read SETUP_FILE_UPLOAD.md for detailed instructions');
    
  } catch (error) {
    console.error('Unexpected error running migration:', error);
  }
}

runMigration(); 
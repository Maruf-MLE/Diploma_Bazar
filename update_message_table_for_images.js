// Script to update the messages table to support storing images directly

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateMessageTable() {
  try {
    console.log('Checking authentication...');
    
    // First check if we're authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Error: You need to be logged in to run this migration.');
      console.log('Please sign in first using the application.');
      return;
    }
    
    console.log('Authenticated as:', session.user.email);
    
    // Update the messages table to ensure it has all the required columns
    const updateTableSQL = `
      -- Update messages table structure
      BEGIN;
      
      -- Make sure content can be NULL (for image-only messages)
      DO $$
      BEGIN
        ALTER TABLE public.messages
        ALTER COLUMN content DROP NOT NULL;
        RAISE NOTICE 'Made content column nullable';
      EXCEPTION
        WHEN others THEN
          RAISE NOTICE 'Error making content nullable: %', SQLERRM;
      END
      $$;
      
      -- Add image_data column if it doesn't exist (for storing images directly in the table)
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'messages' 
          AND column_name = 'image_data'
        ) THEN
          ALTER TABLE public.messages 
          ADD COLUMN image_data BYTEA;
          RAISE NOTICE 'Added image_data column to messages table';
        ELSE
          RAISE NOTICE 'image_data column already exists';
        END IF;
      END
      $$;
      
      -- Add image_format column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'messages' 
          AND column_name = 'image_format'
        ) THEN
          ALTER TABLE public.messages 
          ADD COLUMN image_format TEXT;
          RAISE NOTICE 'Added image_format column to messages table';
        ELSE
          RAISE NOTICE 'image_format column already exists';
        END IF;
      END
      $$;
      
      -- Ensure message_type column exists and has the right default
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'messages' 
          AND column_name = 'message_type'
        ) THEN
          ALTER TABLE public.messages 
          ADD COLUMN message_type VARCHAR(50) DEFAULT 'text';
          RAISE NOTICE 'Added message_type column to messages table';
        ELSE
          RAISE NOTICE 'message_type column already exists';
        END IF;
      END
      $$;
      
      -- Ensure file_url column exists
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
      
      -- Ensure file_type column exists
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
      
      -- Ensure file_name column exists
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
    
    // Run the SQL
    console.log('Running SQL to update messages table...');
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: updateTableSQL });
    
    if (sqlError) {
      console.error('Error updating messages table:', sqlError);
      return;
    }
    
    console.log('Messages table updated successfully!');
    console.log('\nNow updating the MessageService.ts file to handle image data...');
    
    console.log('\nUpdate complete! Now you can store images directly in the messages table.');
    console.log('To use this feature, update your sendMessageWithFile function in MessageService.ts.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateMessageTable(); 
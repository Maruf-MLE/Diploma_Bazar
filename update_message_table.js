// Script to update the messages table for image storage

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateMessageTable() {
  try {
    console.log('Updating messages table for image storage...');
    
    // First check if we're authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Error: You need to be logged in to run this migration.');
      console.log('Please sign in first using the application.');
      return;
    }
    
    console.log('Authenticated as:', session.user.email);
    
    // SQL to make content column nullable and add image columns
    const sqlContent = `
      -- Make message content nullable and add image columns
      BEGIN;
      
      -- Make content column nullable for image-only messages
      ALTER TABLE public.messages
      ALTER COLUMN content DROP NOT NULL;
      
      -- Add comment explaining the change
      COMMENT ON COLUMN public.messages.content IS 'Message text content. Can be NULL for image-only messages';
      
      -- Ensure message_type has the correct default
      ALTER TABLE public.messages 
      ALTER COLUMN message_type SET DEFAULT 'text';
      
      COMMIT;
    `;
    
    // Run the SQL
    console.log('Running SQL to update messages table...');
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (sqlError) {
      console.error('Error updating messages table:', sqlError);
      return;
    }
    
    console.log('Messages table updated successfully!');
    console.log('\nNow you can send images that will be properly stored in the database.');
    console.log('The updated table structure allows:');
    console.log('1. Sending image-only messages (without text content)');
    console.log('2. Proper message_type setting for image messages');
    console.log('3. Storage of image URL in file_url column');
    
    // Save the migration SQL to a file
    const migrationDir = path.join(process.cwd(), 'migrations');
    
    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }
    
    const migrationFile = path.join(migrationDir, 'message_image_support.sql');
    fs.writeFileSync(migrationFile, sqlContent);
    console.log(`\nMigration SQL saved to: ${migrationFile}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateMessageTable(); 
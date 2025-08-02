// Script to create a separate table for message images

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createMessageImagesTable() {
  try {
    console.log('Creating message_images table...');
    
    // First check if we're authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Error: You need to be logged in to run this script.');
      console.log('Please sign in first using the application.');
      return;
    }
    
    console.log('Authenticated as:', session.user.email);
    
    // Create the message_images table using SQL
    const createTableSQL = `
      -- Create a separate table for message images
      CREATE TABLE IF NOT EXISTS public.message_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        image_path TEXT,
        file_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_message_images_message_id ON public.message_images(message_id);
      
      -- Add RLS policies
      ALTER TABLE public.message_images ENABLE ROW LEVEL SECURITY;
      
      -- Policy for viewing message images (same as messages)
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'message_images' AND policyname = 'View message images'
        ) THEN
          CREATE POLICY "View message images" ON public.message_images
            FOR SELECT USING (
              auth.uid() IN (
                SELECT sender_id FROM public.messages WHERE id = message_id
                UNION
                SELECT receiver_id FROM public.messages WHERE id = message_id
              )
            );
        END IF;
      END $$;
      
      -- Policy for inserting message images
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'message_images' AND policyname = 'Insert message images'
        ) THEN
          CREATE POLICY "Insert message images" ON public.message_images
            FOR INSERT WITH CHECK (
              auth.uid() IN (
                SELECT sender_id FROM public.messages WHERE id = message_id
              )
            );
        END IF;
      END $$;
    `;
    
    // Execute the SQL
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('Error creating message_images table:', createError);
      
      // Try a simpler approach if the first one fails
      console.log('Trying a simpler approach...');
      
      const simpleCreateSQL = `
        -- Create a simple message_images table without complex policies
        CREATE TABLE IF NOT EXISTS public.message_images (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          message_id UUID NOT NULL,
          image_url TEXT NOT NULL,
          image_path TEXT,
          file_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `;
      
      const { error: simpleError } = await supabase.rpc('exec_sql', { sql: simpleCreateSQL });
      
      if (simpleError) {
        console.error('Error with simple approach:', simpleError);
        console.log('Please create the table manually in the Supabase dashboard.');
        return;
      }
      
      console.log('Created a simple message_images table successfully!');
    } else {
      console.log('Message_images table created successfully with policies!');
    }
    
    // Create a function to store image data in the table
    const createFunctionSQL = `
      -- Create a function to store message images
      CREATE OR REPLACE FUNCTION public.store_message_image(
        p_message_id UUID,
        p_image_url TEXT,
        p_image_path TEXT DEFAULT NULL,
        p_file_name TEXT DEFAULT NULL
      )
      RETURNS UUID
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_id UUID;
      BEGIN
        INSERT INTO public.message_images (message_id, image_url, image_path, file_name)
        VALUES (p_message_id, p_image_url, p_image_path, p_file_name)
        RETURNING id INTO v_id;
        
        RETURN v_id;
      END;
      $$;
      
      -- Grant execute permission to authenticated users
      GRANT EXECUTE ON FUNCTION public.store_message_image TO authenticated;
    `;
    
    // Execute the function creation SQL
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (functionError) {
      console.error('Error creating store_message_image function:', functionError);
      console.log('You can still use the table without the function.');
    } else {
      console.log('Store_message_image function created successfully!');
    }
    
    console.log('Setup complete! You can now store message images separately.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createMessageImagesTable(); 
// Supabase API এর মাধ্যমে বইয়ের টেবিল আপডেট করার স্ক্রিপ্ট
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno'

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// SQL queries to update books table
const updateBooksTable = async () => {
  try {
    // Recreate books table with proper schema
    const { error: dropError } = await supabase.rpc('execute_sql', { 
      sql_query: `
        DROP TABLE IF EXISTS public.books CASCADE;
        
        CREATE TABLE IF NOT EXISTS public.books (
          id UUID PRIMARY KEY,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          description TEXT NOT NULL,
          price NUMERIC(10, 2) NOT NULL,
          condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'acceptable', 'poor')),
          condition_description TEXT,
          category TEXT NOT NULL,
          semester TEXT,
          department TEXT,
          institute_name TEXT,
          cover_image_url TEXT,
          additional_images TEXT[],
          seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          location TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ,
          status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'sold')),
          is_negotiable BOOLEAN NOT NULL DEFAULT true
        );
        
        ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can view available books" 
          ON public.books
          FOR SELECT 
          USING (status = 'available');
        
        CREATE POLICY "Users can update their own books" 
          ON public.books
          FOR UPDATE
          USING (auth.uid() = seller_id);
        
        CREATE POLICY "Users can delete their own books" 
          ON public.books
          FOR DELETE
          USING (auth.uid() = seller_id);
        
        CREATE POLICY "Authenticated users can create books" 
          ON public.books
          FOR INSERT
          WITH CHECK (auth.uid() = seller_id);
        
        CREATE POLICY "Users can view all their own books" 
          ON public.books
          FOR SELECT
          USING (auth.uid() = seller_id);
      `
    });

    if (dropError) {
      console.error('Error updating books table:', dropError);
      return;
    }

    // Create storage bucket if it doesn't exist
    const { error: storageError } = await supabase.rpc('execute_sql', {
      sql_query: `
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('books', 'books', true)
        ON CONFLICT (id) DO NOTHING;
        
        CREATE POLICY "Books images are publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'books');
        
        CREATE POLICY "Authenticated users can upload book images"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'books' AND auth.role() = 'authenticated');
        
        CREATE POLICY "Users can update their own book images"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'books' AND auth.uid() = owner);
        
        CREATE POLICY "Users can delete their own book images"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'books' AND auth.uid() = owner);
      `
    });

    if (storageError) {
      console.error('Error setting up storage policies:', storageError);
      return;
    }

    console.log('Books table and storage policies updated successfully');
  } catch (error) {
    console.error('Error in update script:', error);
  }
};

// Run the update function
updateBooksTable(); 
// Supabase API এর মাধ্যমে সরাসরি SQL কোয়েরি রান করার স্ক্রিপ্ট
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yryerjgidsyfiohmpeoc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno'

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if books table exists
const checkBooksTable = async () => {
  try {
    // Try to get schema information directly
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error checking books table:', error);
      return false;
    }
    
    console.log('Books table exists with data:', data);
    return true;
  } catch (error) {
    console.error('Error checking books table:', error);
    return false;
  }
};

// Create books table from scratch
const recreateBooksTable = async () => {
  try {
    console.log('Recreating books table from scratch...');
    
    // First try to drop the table if it exists
    try {
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `DROP TABLE IF EXISTS public.books CASCADE;`
      });
      
      if (error) console.log('Error dropping table:', error);
      else console.log('Table dropped successfully or did not exist');
    } catch (dropError) {
      console.log('Error dropping table (may not exist yet):', dropError);
    }
    
    // Now create the books table
    try {
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
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
          
          DROP POLICY IF EXISTS "Anyone can view available books" ON public.books;
          CREATE POLICY "Anyone can view available books" 
            ON public.books
            FOR SELECT 
            USING (status = 'available');
          
          DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
          CREATE POLICY "Users can update their own books" 
            ON public.books
            FOR UPDATE
            USING (auth.uid() = seller_id);
          
          DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;
          CREATE POLICY "Users can delete their own books" 
            ON public.books
            FOR DELETE
            USING (auth.uid() = seller_id);
          
          DROP POLICY IF EXISTS "Authenticated users can create books" ON public.books;
          CREATE POLICY "Authenticated users can create books" 
            ON public.books
            FOR INSERT
            WITH CHECK (auth.uid() = seller_id);
          
          DROP POLICY IF EXISTS "Users can view all their own books" ON public.books;
          CREATE POLICY "Users can view all their own books" 
            ON public.books
            FOR SELECT
            USING (auth.uid() = seller_id);
        `
      });
      
      if (error) console.log('Error creating table:', error);
      else console.log('Table created successfully');
    } catch (tableError) {
      console.log('Error creating table:', tableError);
    }
    
    // Setup storage bucket
    try {
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `
          INSERT INTO storage.buckets (id, name, public)
          VALUES ('books', 'books', true)
          ON CONFLICT (id) DO NOTHING;
          
          DROP POLICY IF EXISTS "Books images are publicly accessible" ON storage.objects;
          CREATE POLICY "Books images are publicly accessible"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'books');
          
          DROP POLICY IF EXISTS "Authenticated users can upload book images" ON storage.objects;
          CREATE POLICY "Authenticated users can upload book images"
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = 'books' AND auth.role() = 'authenticated');
          
          DROP POLICY IF EXISTS "Users can update their own book images" ON storage.objects;
          CREATE POLICY "Users can update their own book images"
          ON storage.objects FOR UPDATE
          USING (bucket_id = 'books' AND auth.uid() = owner);
          
          DROP POLICY IF EXISTS "Users can delete their own book images" ON storage.objects;
          CREATE POLICY "Users can delete their own book images"
          ON storage.objects FOR DELETE
          USING (bucket_id = 'books' AND auth.uid() = owner);
        `
      });
      
      if (error) console.log('Error setting up storage:', error);
      else console.log('Storage setup successfully');
    } catch (storageError) {
      console.log('Error setting up storage:', storageError);
    }
    
    console.log('Books table recreation completed');
    
    // Check if the table was created successfully
    await checkBooksTable();
    
  } catch (error) {
    console.error('Error recreating books table:', error);
  }
};

// Run the main function
const main = async () => {
  const tableExists = await checkBooksTable();
  
  if (!tableExists) {
    console.log('Books table does not exist or has issues, recreating...');
    await recreateBooksTable();
  } else {
    console.log('Books table exists and seems to be working correctly.');
  }
};

main(); 
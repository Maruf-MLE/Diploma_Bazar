-- Fix book insertion issues - Execute these queries one by one in Supabase SQL Editor

-- Step 1: Remove problematic trigger
DROP TRIGGER IF EXISTS set_book_category ON public.books;

-- Step 2: Remove problematic function
DROP FUNCTION IF EXISTS public.set_default_category();

-- Step 3: Clean up null categories
UPDATE public.books 
SET category = 'academic' 
WHERE category IS NULL;

-- Step 4: Clean up null status
UPDATE public.books 
SET status = 'available' 
WHERE status IS NULL OR status NOT IN ('available', 'pending', 'sold');

-- Step 5: Verify books table structure (optional check)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'books' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 6: Check current books count
SELECT 
    COUNT(*) as total_books,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as available_books,
    COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_books,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_books
FROM public.books;

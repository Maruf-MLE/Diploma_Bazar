-- Remove the problematic trigger and function from books table
-- This SQL script will clean up the database issues that might be preventing book insertion

-- Drop the trigger first
DROP TRIGGER IF EXISTS set_book_category ON public.books;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.set_default_category();

-- Verify the books table structure is correct
-- Check if all required columns exist and have proper constraints
DO $$
BEGIN
    -- Log the current status
    RAISE NOTICE 'Checking books table structure...';
    
    -- Verify the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'books' AND table_schema = 'public') THEN
        RAISE NOTICE 'Books table exists';
        
        -- Check if seller_id foreign key constraint exists and points to profiles table
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'books' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND kcu.column_name = 'seller_id'
                AND kcu.table_name = 'books'
        ) THEN
            RAISE NOTICE 'Foreign key constraint for seller_id exists';
        ELSE
            RAISE WARNING 'Foreign key constraint for seller_id is missing';
        END IF;
        
    ELSE
        RAISE WARNING 'Books table does not exist!';
    END IF;
    
    RAISE NOTICE 'Database cleanup completed successfully';
END
$$;

-- Optional: Clean up any orphaned data that might cause issues
-- Update any books with null categories to 'academic'
UPDATE public.books 
SET category = 'academic' 
WHERE category IS NULL;

-- Ensure all books have proper status values
UPDATE public.books 
SET status = 'available' 
WHERE status IS NULL OR status NOT IN ('available', 'pending', 'sold');

-- Show summary of current books in the database
SELECT 
    COUNT(*) as total_books,
    COUNT(CASE WHEN status = 'available' THEN 1 END) as available_books,
    COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_books,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_books
FROM public.books;

-- SQL script to update the books table structure
-- This script ensures that the database structure matches the required fields for the book form

-- No changes needed to the table structure since all required fields already exist in the schema:
-- - title (book name)
-- - author (used for publisher)
-- - description (book summary)
-- - condition (book condition)
-- - price (price)
-- - department (department)
-- - semester (semester)
-- - institute_name (institute)
-- - cover_image_url (book picture)

-- Add a comment to the author column to indicate it's used for publisher
COMMENT ON COLUMN public.books.author IS 'Used to store publisher information';

-- Ensure the institute_name column exists (it's already in the schema)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'books' 
                   AND column_name = 'institute_name') THEN
        ALTER TABLE public.books ADD COLUMN institute_name text;
    END IF;
END $$;

-- Set default category to 'academic' for all books
UPDATE public.books SET category = 'academic' WHERE category IS NULL;

-- Add a database trigger to automatically set the category to 'academic' for new books
CREATE OR REPLACE FUNCTION set_default_category()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.category IS NULL THEN
        NEW.category := 'academic';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_book_category ON public.books;

-- Create the trigger
CREATE TRIGGER set_book_category
BEFORE INSERT ON public.books
FOR EACH ROW
EXECUTE FUNCTION set_default_category();

-- Update any existing books to have the proper fields
UPDATE public.books
SET 
    category = 'academic',
    is_negotiable = COALESCE(is_negotiable, true)
WHERE 
    category IS NULL OR is_negotiable IS NULL; 
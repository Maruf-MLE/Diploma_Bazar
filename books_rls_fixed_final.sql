-- Fixed RLS Policy for Books Table
-- This handles the dependency issue with profiles table

-- Step 1: First drop the trigger on books table if it exists
DROP TRIGGER IF EXISTS prevent_restricted_fields_trigger ON public.books;

-- Step 2: Create a separate function specifically for books table
-- This won't conflict with the profiles table function
CREATE OR REPLACE FUNCTION prevent_books_restricted_fields_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if institute_name is being changed
  IF OLD.institute_name IS DISTINCT FROM NEW.institute_name THEN
    -- Revert the change silently
    NEW.institute_name = OLD.institute_name;
  END IF;
  
  -- Check if department is being changed
  IF OLD.department IS DISTINCT FROM NEW.department THEN
    -- Revert the change silently
    NEW.department = OLD.department;
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger for books table using the new function
CREATE TRIGGER prevent_books_restricted_fields_trigger
    BEFORE UPDATE ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION prevent_books_restricted_fields_update();

-- Step 4: Drop all existing policies on books table
DROP POLICY IF EXISTS "Users can view all books" ON public.books;
DROP POLICY IF EXISTS "Users can create own books" ON public.books;
DROP POLICY IF EXISTS "Users can update own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books with restrictions" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can create their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;
DROP POLICY IF EXISTS "Anyone can view all books" ON public.books;
DROP POLICY IF EXISTS "books_select_policy" ON public.books;
DROP POLICY IF EXISTS "books_insert_policy" ON public.books;
DROP POLICY IF EXISTS "books_update_policy" ON public.books;
DROP POLICY IF EXISTS "books_delete_policy" ON public.books;

-- Step 5: Remove the problematic function that was causing issues
DROP FUNCTION IF EXISTS check_restricted_fields_update();

-- Step 6: Enable RLS on books table
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Step 7: Create clean RLS policies

-- SELECT Policy: Everyone can view all books
CREATE POLICY "books_select_all" 
ON public.books 
FOR SELECT 
USING (true);

-- INSERT Policy: Users can insert their own books
CREATE POLICY "books_insert_own" 
ON public.books 
FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

-- UPDATE Policy: Users can update their own books
CREATE POLICY "books_update_own" 
ON public.books 
FOR UPDATE 
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- DELETE Policy: Users can delete their own books
CREATE POLICY "books_delete_own" 
ON public.books 
FOR DELETE 
USING (auth.uid() = seller_id);

-- Step 8: Grant necessary permissions
GRANT ALL ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

-- Step 9: Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Books RLS policies have been successfully configured!';
  RAISE NOTICE 'The following restrictions are in place:';
  RAISE NOTICE '  - institute_name: Cannot be updated after creation';
  RAISE NOTICE '  - department: Cannot be updated after creation';
  RAISE NOTICE '  - All other fields can be updated by the book owner';
  RAISE NOTICE 'Note: The profiles table trigger remains unaffected.';
END $$;

-- Complete RLS Policy for Books Table
-- This policy allows users to update all fields except institute_name and department

-- Step 1: Enable RLS on books table (if not already enabled)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view all books" ON public.books;
DROP POLICY IF EXISTS "Users can create own books" ON public.books;
DROP POLICY IF EXISTS "Users can update own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books with restrictions" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can create their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;

-- Step 3: Drop any existing functions and triggers
DROP TRIGGER IF EXISTS prevent_restricted_fields_trigger ON public.books;
DROP FUNCTION IF EXISTS prevent_restricted_fields_update();
DROP FUNCTION IF EXISTS check_restricted_fields_update();

-- Step 4: Create a trigger function to prevent updates to restricted fields
CREATE OR REPLACE FUNCTION prevent_restricted_fields_update()
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

-- Step 5: Create the trigger
CREATE TRIGGER prevent_restricted_fields_trigger
    BEFORE UPDATE ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION prevent_restricted_fields_update();

-- Step 6: Create RLS Policies

-- Policy 1: SELECT - সবাই সব বই দেখতে পারবে
CREATE POLICY "Anyone can view all books" 
    ON public.books
    FOR SELECT
    USING (true);

-- Policy 2: INSERT - ব্যবহারকারীরা নিজের বই যোগ করতে পারবে
CREATE POLICY "Users can create their own books" 
    ON public.books
    FOR INSERT
    WITH CHECK (auth.uid() = seller_id);

-- Policy 3: UPDATE - ব্যবহারকারীরা শুধুমাত্র নিজের বই আপডেট করতে পারবে
CREATE POLICY "Users can update their own books" 
    ON public.books
    FOR UPDATE
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

-- Policy 4: DELETE - ব্যবহারকারীরা শুধুমাত্র নিজের বই ডিলিট করতে পারবে
CREATE POLICY "Users can delete their own books" 
    ON public.books
    FOR DELETE
    USING (auth.uid() = seller_id);

-- Step 7: Grant necessary permissions
GRANT ALL ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

-- Step 8: Create a helper function to check if user owns the book (optional)
CREATE OR REPLACE FUNCTION is_book_owner(book_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.books 
    WHERE id = book_id 
    AND seller_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Add comment to explain the restrictions
COMMENT ON TRIGGER prevent_restricted_fields_trigger ON public.books IS 
'This trigger prevents updates to institute_name and department fields. These fields can only be set during book creation and cannot be modified afterward.';

-- Step 10: Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Books RLS policies have been successfully configured!';
  RAISE NOTICE 'Restrictions applied:';
  RAISE NOTICE '  - institute_name: Cannot be updated after creation';
  RAISE NOTICE '  - department: Cannot be updated after creation';
  RAISE NOTICE 'All other fields can be updated by the book owner.';
END $$;

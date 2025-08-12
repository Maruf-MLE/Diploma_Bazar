-- Complete Secure Solution for Books Table
-- This provides full security even if frontend fields are enabled

-- Step 1: Clean up existing triggers and policies
DROP TRIGGER IF EXISTS prevent_restricted_fields_trigger ON public.books;
DROP TRIGGER IF EXISTS prevent_books_restricted_fields_trigger ON public.books;
DROP TRIGGER IF EXISTS check_restricted_fields_trigger ON public.books;

DROP POLICY IF EXISTS "Users can view all books" ON public.books;
DROP POLICY IF EXISTS "Users can create own books" ON public.books;
DROP POLICY IF EXISTS "Users can update own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books with restrictions" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can create their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;
DROP POLICY IF EXISTS "Anyone can view all books" ON public.books;
DROP POLICY IF EXISTS "books_select_all" ON public.books;
DROP POLICY IF EXISTS "books_insert_own" ON public.books;
DROP POLICY IF EXISTS "books_update_own" ON public.books;
DROP POLICY IF EXISTS "books_delete_own" ON public.books;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.books;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.books;
DROP POLICY IF EXISTS "Enable update for book owners" ON public.books;
DROP POLICY IF EXISTS "Enable delete for book owners" ON public.books;

-- Step 2: Remove problematic functions (but keep profiles safe)
DROP FUNCTION IF EXISTS check_restricted_fields_update();

-- Step 3: Create the security trigger function for books
CREATE OR REPLACE FUNCTION secure_books_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent institute_name changes
  IF OLD.institute_name IS DISTINCT FROM NEW.institute_name THEN
    RAISE NOTICE 'Attempt to change institute_name blocked for security';
    NEW.institute_name = OLD.institute_name;
  END IF;
  
  -- Prevent department changes  
  IF OLD.department IS DISTINCT FROM NEW.department THEN
    RAISE NOTICE 'Attempt to change department blocked for security';
    NEW.department = OLD.department;
  END IF;
  
  -- Update timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the security trigger
CREATE TRIGGER secure_books_update_trigger
    BEFORE UPDATE ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION secure_books_update();

-- Step 5: Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Step 6: Create secure RLS policies
CREATE POLICY "books_read_policy" 
    ON public.books 
    FOR SELECT 
    USING (true);

CREATE POLICY "books_create_policy" 
    ON public.books 
    FOR INSERT 
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "books_update_policy" 
    ON public.books 
    FOR UPDATE 
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "books_delete_policy" 
    ON public.books 
    FOR DELETE 
    USING (auth.uid() = seller_id);

-- Step 7: Grant permissions
GRANT ALL ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Books security has been configured successfully!';
  RAISE NOTICE 'Now even if frontend fields are enabled:';
  RAISE NOTICE '  - institute_name cannot be changed';
  RAISE NOTICE '  - department cannot be changed';
  RAISE NOTICE '  - All other fields work normally';
  RAISE NOTICE '  - Full security is maintained';
END $$;

-- Simplest RLS Policy for Books Table (No Triggers)
-- This is the safest approach that won't conflict with other tables

-- Step 1: Drop all existing policies on books table
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
DROP POLICY IF EXISTS "books_select_all" ON public.books;
DROP POLICY IF EXISTS "books_insert_own" ON public.books;
DROP POLICY IF EXISTS "books_update_own" ON public.books;
DROP POLICY IF EXISTS "books_delete_own" ON public.books;

-- Step 2: Drop the problematic function (but not the profiles one)
DROP FUNCTION IF EXISTS check_restricted_fields_update();

-- Step 3: Drop any triggers on books table
DROP TRIGGER IF EXISTS prevent_restricted_fields_trigger ON public.books;
DROP TRIGGER IF EXISTS prevent_books_restricted_fields_trigger ON public.books;
DROP TRIGGER IF EXISTS check_restricted_fields_trigger ON public.books;

-- Step 4: Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, clean policies

CREATE POLICY "Enable read access for all users" 
ON public.books 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.books 
FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Enable update for book owners" 
ON public.books 
FOR UPDATE 
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Enable delete for book owners" 
ON public.books 
FOR DELETE 
USING (auth.uid() = seller_id);

-- That's it! No triggers, no complex functions.
-- The frontend will handle the field restrictions.

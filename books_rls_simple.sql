-- Simple RLS Policy for Books Table
-- Run this in Supabase SQL Editor

-- Step 1: Remove all existing policies
DROP POLICY IF EXISTS "Users can view all books" ON public.books;
DROP POLICY IF EXISTS "Users can create own books" ON public.books;
DROP POLICY IF EXISTS "Users can update own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books with restrictions" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can create their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;
DROP POLICY IF EXISTS "Anyone can view all books" ON public.books;

-- Step 2: Remove problematic functions
DROP FUNCTION IF EXISTS check_restricted_fields_update();

-- Step 3: Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple policies

-- SELECT Policy: Everyone can view all books
CREATE POLICY "books_select_policy" 
ON public.books 
FOR SELECT 
USING (true);

-- INSERT Policy: Users can insert their own books
CREATE POLICY "books_insert_policy" 
ON public.books 
FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

-- UPDATE Policy: Users can update their own books
CREATE POLICY "books_update_policy" 
ON public.books 
FOR UPDATE 
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- DELETE Policy: Users can delete their own books
CREATE POLICY "books_delete_policy" 
ON public.books 
FOR DELETE 
USING (auth.uid() = seller_id);

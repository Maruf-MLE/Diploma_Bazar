-- Fix books table seller_id reference to point to auth.users instead of profiles
-- This ensures that books are properly linked to user accounts

-- First, check if any existing data would be affected
SELECT 
  b.id as book_id,
  b.title,
  b.seller_id,
  au.id as auth_user_id,
  p.id as profile_id
FROM books b
LEFT JOIN auth.users au ON b.seller_id = au.id
LEFT JOIN profiles p ON b.seller_id = p.id
WHERE au.id IS NULL AND p.id IS NULL;

-- If no conflicting data, proceed with the fix
-- Drop the existing foreign key constraint
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_seller_id_fkey;

-- Add the correct foreign key constraint pointing to auth.users
ALTER TABLE books 
ADD CONSTRAINT books_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the change
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='books'
    AND kcu.column_name='seller_id';

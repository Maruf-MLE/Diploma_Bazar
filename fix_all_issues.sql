-- সমস্ত সমস্যা সমাধানের জন্য একটি সম্পূর্ণ SQL স্ক্রিপ্ট

-- 1. প্রথমে বই টেবিল স্ট্রাকচার চেক করি
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM
  information_schema.columns
WHERE
  table_name = 'books'
ORDER BY
  ordinal_position;

-- 2. ফরেন কী রিলেশনশিপ ঠিক করি
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_seller_id_fkey;
ALTER TABLE public.books ADD CONSTRAINT books_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. বই টেবিলের জন্য RLS পলিসি আপডেট করি
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

-- 4. ভিউ তৈরি করি
DROP VIEW IF EXISTS public.book_details;
CREATE OR REPLACE VIEW public.book_details AS
SELECT 
  b.*,
  p.name AS seller_name,
  p.avatar_url AS seller_avatar_url,
  p.institute_name AS seller_institute
FROM 
  public.books b
LEFT JOIN 
  public.profiles p ON b.seller_id = p.id;

-- 5. স্কিমা ক্যাশ রিফ্রেশ করি
NOTIFY pgrst, 'reload schema'; 
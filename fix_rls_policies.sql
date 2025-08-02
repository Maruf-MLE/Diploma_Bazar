-- বই টেবিলের জন্য RLS পলিসি আপডেট করি
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- RLS পলিসি আপডেট করি
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

-- স্কিমা ক্যাশ আবার রিফ্রেশ করি
NOTIFY pgrst, 'reload schema'; 
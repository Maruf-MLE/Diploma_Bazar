-- বই টেবিল আপডেট করি
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_seller_id_fkey;
ALTER TABLE public.books ADD CONSTRAINT books_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ভিউ তৈরি করি
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

-- স্কিমা ক্যাশ রিফ্রেশ করি
NOTIFY pgrst, 'reload schema'; 
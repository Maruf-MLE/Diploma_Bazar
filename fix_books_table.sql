-- বইয়ের টেবিল পুনরায় তৈরি করি
DROP TABLE IF EXISTS public.books CASCADE;

CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'acceptable', 'poor')),
  condition_description TEXT,
  category TEXT NOT NULL,
  semester TEXT,
  department TEXT,
  institute_name TEXT,
  cover_image_url TEXT,
  additional_images TEXT[],
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'sold')),
  is_negotiable BOOLEAN NOT NULL DEFAULT true
);

-- বই টেবিলে RLS পলিসি সেট আপ করি
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- সবাই available বই দেখতে পারবে
DROP POLICY IF EXISTS "Anyone can view available books" ON public.books;
CREATE POLICY "Anyone can view available books" 
  ON public.books
  FOR SELECT 
  USING (status = 'available');

-- শুধুমাত্র নিজের বই আপডেট করতে পারবে ইউজার
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
CREATE POLICY "Users can update their own books" 
  ON public.books
  FOR UPDATE
  USING (auth.uid() = seller_id);

-- শুধুমাত্র নিজের বই ডিলিট করতে পারবে ইউজার
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;
CREATE POLICY "Users can delete their own books" 
  ON public.books
  FOR DELETE
  USING (auth.uid() = seller_id);

-- লগড ইন ইউজার বই পোস্ট করতে পারবে
DROP POLICY IF EXISTS "Authenticated users can create books" ON public.books;
CREATE POLICY "Authenticated users can create books" 
  ON public.books
  FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- ইউজার যেকোন স্ট্যাটাসের নিজের বই দেখতে পারবে
DROP POLICY IF EXISTS "Users can view all their own books" ON public.books;
CREATE POLICY "Users can view all their own books" 
  ON public.books
  FOR SELECT
  USING (auth.uid() = seller_id);

-- বইয়ের জন্য স্টোরেজ বাকেট তৈরি করি
INSERT INTO storage.buckets (id, name, public)
VALUES ('books', 'books', true)
ON CONFLICT (id) DO NOTHING;

-- বইয়ের জন্য স্টোরেজ পলিসি সেট করি
-- সবাই বইয়ের ইমেজ দেখতে পারবে
DROP POLICY IF EXISTS "Books images are publicly accessible" ON storage.objects;
CREATE POLICY "Books images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'books');

-- যে কোন অথেনটিকেটেড ইউজার বইয়ের ইমেজ আপলোড করতে পারবে
DROP POLICY IF EXISTS "Authenticated users can upload book images" ON storage.objects;
CREATE POLICY "Authenticated users can upload book images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'books' AND auth.role() = 'authenticated');

-- শুধুমাত্র আপলোডকারী নিজের আপলোড করা বইয়ের ইমেজ আপডেট/ডিলিট করতে পারবে
DROP POLICY IF EXISTS "Users can update their own book images" ON storage.objects;
CREATE POLICY "Users can update their own book images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'books' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own book images" ON storage.objects;
CREATE POLICY "Users can delete their own book images"
ON storage.objects FOR DELETE
USING (bucket_id = 'books' AND auth.uid() = owner);

-- স্কিমা ক্যাশ রিফ্রেশ করি
NOTIFY pgrst, 'reload schema'; 
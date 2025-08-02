-- ফরেন কী রিলেশনশিপ ঠিক করি
-- প্রথমে টেবিল স্ট্রাকচার চেক করি
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

-- প্রোফাইল টেবিল চেক করি
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM
  information_schema.columns
WHERE
  table_name = 'profiles'
ORDER BY
  ordinal_position;

-- বই টেবিল আপডেট করি
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_seller_id_fkey;
ALTER TABLE public.books ADD CONSTRAINT books_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS পলিসি আপডেট করি
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

-- সিকিউরিটি ডিফাইনার ফাংশন তৈরি করি যা বই এবং প্রোফাইল টেবিল থেকে ডাটা নিয়ে আসবে
CREATE OR REPLACE FUNCTION public.get_book_details(book_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  description TEXT,
  price NUMERIC,
  condition TEXT,
  condition_description TEXT,
  category TEXT,
  semester TEXT,
  department TEXT,
  institute_name TEXT,
  cover_image_url TEXT,
  additional_images TEXT[],
  seller_id UUID,
  location TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  status TEXT,
  is_negotiable BOOLEAN,
  seller_name TEXT,
  seller_avatar_url TEXT,
  seller_institute TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.*,
    p.name AS seller_name,
    p.avatar_url AS seller_avatar_url,
    p.institute_name AS seller_institute
  FROM 
    public.books b
  LEFT JOIN 
    public.profiles p ON b.seller_id = p.id
  WHERE 
    b.id = book_id
    AND (b.status = 'available' OR b.seller_id = auth.uid());
END;
$$ LANGUAGE plpgsql;

-- সকল বই নিয়ে আসার ফাংশন
CREATE OR REPLACE FUNCTION public.get_available_books(
  category_filter TEXT DEFAULT NULL,
  department_filter TEXT DEFAULT NULL,
  semester_filter TEXT DEFAULT NULL,
  condition_filter TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  institute_filter TEXT DEFAULT NULL,
  limit_val INTEGER DEFAULT 10,
  offset_val INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  description TEXT,
  price NUMERIC,
  condition TEXT,
  condition_description TEXT,
  category TEXT,
  semester TEXT,
  department TEXT,
  institute_name TEXT,
  cover_image_url TEXT,
  additional_images TEXT[],
  seller_id UUID,
  location TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  status TEXT,
  is_negotiable BOOLEAN,
  seller_name TEXT,
  seller_avatar_url TEXT,
  seller_institute TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.*,
    p.name AS seller_name,
    p.avatar_url AS seller_avatar_url,
    p.institute_name AS seller_institute
  FROM 
    public.books b
  LEFT JOIN 
    public.profiles p ON b.seller_id = p.id
  WHERE 
    b.status = 'available'
    AND (category_filter IS NULL OR b.category = category_filter)
    AND (department_filter IS NULL OR b.department = department_filter)
    AND (semester_filter IS NULL OR b.semester = semester_filter)
    AND (condition_filter IS NULL OR b.condition = condition_filter)
    AND (min_price IS NULL OR b.price >= min_price)
    AND (max_price IS NULL OR b.price <= max_price)
    AND (institute_filter IS NULL OR b.institute_name = institute_filter)
  ORDER BY 
    b.created_at DESC
  LIMIT 
    limit_val
  OFFSET 
    offset_val;
END;
$$ LANGUAGE plpgsql;

-- ইউজারের বই নিয়ে আসার ফাংশন
CREATE OR REPLACE FUNCTION public.get_user_books(user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  author TEXT,
  description TEXT,
  price NUMERIC,
  condition TEXT,
  condition_description TEXT,
  category TEXT,
  semester TEXT,
  department TEXT,
  institute_name TEXT,
  cover_image_url TEXT,
  additional_images TEXT[],
  seller_id UUID,
  location TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  status TEXT,
  is_negotiable BOOLEAN,
  seller_name TEXT,
  seller_avatar_url TEXT,
  seller_institute TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the requesting user is the same as the target user
  IF auth.uid() = user_id THEN
    RETURN QUERY
    SELECT 
      b.*,
      p.name AS seller_name,
      p.avatar_url AS seller_avatar_url,
      p.institute_name AS seller_institute
    FROM 
      public.books b
    LEFT JOIN 
      public.profiles p ON b.seller_id = p.id
    WHERE 
      b.seller_id = user_id
    ORDER BY 
      b.created_at DESC;
  ELSE
    -- If not the same user, return only available books
    RETURN QUERY
    SELECT 
      b.*,
      p.name AS seller_name,
      p.avatar_url AS seller_avatar_url,
      p.institute_name AS seller_institute
    FROM 
      public.books b
    LEFT JOIN 
      public.profiles p ON b.seller_id = p.id
    WHERE 
      b.seller_id = user_id
      AND b.status = 'available'
    ORDER BY 
      b.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ভিউ তৈরি করি (শুধুমাত্র ডেভেলপমেন্ট সুবিধার জন্য)
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

-- স্কিমা ক্যাশ আবার রিফ্রেশ করি
NOTIFY pgrst, 'reload schema'; 
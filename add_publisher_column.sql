-- প্রকাশনী কলাম যোগ করার জন্য SQL স্ক্রিপ্ট
-- এই স্ক্রিপ্টটি Supabase SQL Editor এ রান করুন

-- books টেবিলে publisher কলাম যোগ করি
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS publisher TEXT;

-- কমেন্ট যোগ করি
COMMENT ON COLUMN public.books.publisher IS 'বইয়ের প্রকাশনী';

-- ইনডেক্স যোগ করি দ্রুত সার্চের জন্য
CREATE INDEX IF NOT EXISTS idx_books_publisher ON public.books(publisher);

-- RLS পলিসি আপডেট করি (যদি প্রয়োজন হয়)
-- এই লাইনটি শুধুমাত্র তখনই প্রয়োজন যদি আপনার RLS পলিসিতে publisher ফিল্ড ব্যবহার করতে চান

SELECT 'Publisher column added successfully to books table';


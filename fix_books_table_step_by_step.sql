-- 🔧 Books Table ঠিক করার জন্য Step by Step SQL Commands
-- ⚠️  প্রতিটি command আলাদা আলাদা করে Supabase SQL Editor এ চালান

-- ======== STEP 1: Missing Columns যোগ করা ========
-- seller_id column যোগ করুন (সবচেয়ে গুরুত্বপূর্ণ)
ALTER TABLE public.books ADD COLUMN seller_id uuid;

-- ======== STEP 2: অন্যান্য Missing Columns ========
-- timestamps যোগ করুন
ALTER TABLE public.books ADD COLUMN created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.books ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- status field যোগ করুন
ALTER TABLE public.books ADD COLUMN status text DEFAULT 'available';

-- negotiable এবং discount fields যোগ করুন
ALTER TABLE public.books ADD COLUMN is_negotiable boolean DEFAULT false;
ALTER TABLE public.books ADD COLUMN discount_rate numeric(5,2) DEFAULT 0;

-- is_sold field যোগ করুন (backward compatibility এর জন্য)
ALTER TABLE public.books ADD COLUMN is_sold boolean DEFAULT false;

-- ======== STEP 3: Foreign Key Constraint যোগ করা ========
-- seller_id কে auth.users table এর সাথে connect করুন
ALTER TABLE public.books ADD CONSTRAINT books_seller_id_fkey 
    FOREIGN KEY (seller_id) REFERENCES auth.users(id);

-- ======== STEP 4: seller_id কে NOT NULL করা ========
-- ⚠️  এই command চালানোর আগে নিশ্চিত করুন যে আপনার table এ কোন existing data নেই
-- যদি existing data থাকে তাহলে প্রথমে সেগুলোতে seller_id set করুন
ALTER TABLE public.books ALTER COLUMN seller_id SET NOT NULL;

-- ======== STEP 5: Data Validation Constraints ========
-- status field এর জন্য constraint
ALTER TABLE public.books ADD CONSTRAINT books_status_check 
    CHECK (status IN ('available', 'pending', 'sold'));

-- condition field এর জন্য constraint 
ALTER TABLE public.books ADD CONSTRAINT books_condition_check 
    CHECK (condition IN ('new', 'like_new', 'good', 'acceptable', 'poor'));

-- ======== STEP 6: Performance এর জন্য Indexes ========
-- গুরুত্বপূর্ণ fields এ index তৈরি করুন
CREATE INDEX idx_books_seller_id ON public.books(seller_id);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_category ON public.books(category);
CREATE INDEX idx_books_created_at ON public.books(created_at);

-- ======== STEP 7: Row Level Security (RLS) Enable করা ========
-- Table এ RLS enable করুন
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- ======== STEP 8: RLS Policies তৈরি করা ========
-- সবাই available books দেখতে পারবে
CREATE POLICY "Anyone can view available books" ON public.books
    FOR SELECT USING (status = 'available');

-- Users তাদের নিজের books দেখতে পারবে
CREATE POLICY "Users can view own books" ON public.books
    FOR SELECT USING (auth.uid() = seller_id);

-- Users তাদের নিজের books insert করতে পারবে
CREATE POLICY "Users can insert own books" ON public.books
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Users তাদের নিজের books update করতে পারবে
CREATE POLICY "Users can update own books" ON public.books
    FOR UPDATE USING (auth.uid() = seller_id);

-- Users তাদের নিজের books delete করতে পারবে
CREATE POLICY "Users can delete own books" ON public.books
    FOR DELETE USING (auth.uid() = seller_id);

-- ======== STEP 9: Final Verification ========
-- Table structure check করুন
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'books' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ======== সফল হলে এই message দেখাবে ========
SELECT '✅ Books table structure সফলভাবে ঠিক করা হয়েছে! এখন বই add করার চেষ্টা করুন।' as result;

-- SQL commands to update Supabase auth settings and create profiles table

-- 1. Auto-confirm all existing user emails
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Check users that have been updated
SELECT id, email, email_confirmed_at
FROM auth.users;

-- প্রোফাইল টেবিল রিক্রিয়েট করার SQL কমান্ড

-- 1. আগের টেবিল ডেলিট করি
DROP TABLE IF EXISTS public.profiles;

-- 2. নতুন প্রোফাইল টেবিল তৈরি করি
CREATE TABLE public.profiles (
    -- প্রাইমারি কী এবং অথ ইউজার লিংক
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    
    -- ইউজার ইনফরমেশন ফিল্ড (ফর্মের সাথে মিলিয়ে)
    name TEXT NOT NULL,                    -- নাম
    roll_number TEXT NOT NULL,             -- রোল নাম্বার
    semester TEXT NOT NULL,                -- সেমিস্টার
    department TEXT NOT NULL,              -- বিভাগ
    institute_name TEXT NOT NULL,          -- প্রতিষ্ঠান
    
    -- অপশনাল ফিল্ড
    avatar_url TEXT,                       -- প্রোফাইল ছবি (optional)
    
    -- টাইমস্ট্যাম্প
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 3. রো লেভেল সিকিউরিটি এনাবল করি
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS পলিসি তৈরি করি

-- যে কেউ প্রোফাইল দেখতে পারবে
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (TRUE);

-- শুধুমাত্র অথেনটিকেটেড ইউজার নিজের প্রোফাইল ইনসার্ট করতে পারবে
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ইউজার শুধু নিজের প্রোফাইল আপডেট করতে পারবে
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 5. আপডেটেড_এট ট্রিগার তৈরি করি
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- 6. টেস্টিং এর জন্য আরও পারমিসিভ পলিসি (অস্থায়ী)
-- প্রোডাকশনে এটা কমেন্ট করে দিন
CREATE POLICY "Allow all profile inserts for testing"
    ON public.profiles FOR INSERT
    WITH CHECK (TRUE);

-- 7. বইয়ের টেবিল তৈরি করি (যদি না থাকে)
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    condition TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL,
    status TEXT DEFAULT 'available' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 8. বইয়ের টেবিলে RLS এনাবল করি
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- বইয়ের টেবিলের RLS পলিসি
CREATE POLICY "Books are viewable by everyone"
    ON public.books FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert their own books"
    ON public.books FOR INSERT
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own books"
    ON public.books FOR UPDATE
    USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own books"
    ON public.books FOR DELETE
    USING (auth.uid() = seller_id);

-- বইয়ের টেবিলের আপডেটেড_এট ট্রিগার
CREATE TRIGGER handle_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- 9. মেসেজ টেবিল তৈরি করি (যদি না থাকে)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
    book_id UUID REFERENCES public.books(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 10. মেসেজ টেবিলে RLS এনাবল করি
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- মেসেজ টেবিলের RLS পলিসি
CREATE POLICY "Users can view their own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
    ON public.messages FOR DELETE
    USING (auth.uid() = sender_id);

-- মেসেজ টেবিলের আপডেটেড_এট ট্রিগার
CREATE TRIGGER handle_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at(); 
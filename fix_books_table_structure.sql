-- Fix Books table structure - Missing important columns
-- Execute this in Supabase SQL Editor

-- Add missing required columns
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_negotiable boolean DEFAULT false;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS discount_rate numeric(5,2) DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS publisher text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_sold boolean DEFAULT false;

-- Add constraints for better data integrity
ALTER TABLE public.books ADD CONSTRAINT books_status_check 
    CHECK (status IN ('available', 'pending', 'sold'));

ALTER TABLE public.books ADD CONSTRAINT books_condition_check 
    CHECK (condition IN ('new', 'like_new', 'good', 'acceptable', 'poor'));

-- Make seller_id NOT NULL (every book must have a seller)
ALTER TABLE public.books ALTER COLUMN seller_id SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_seller_id ON public.books(seller_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all available books
CREATE POLICY "Anyone can view available books" ON public.books
    FOR SELECT USING (status = 'available');

-- Users can view their own books (any status)
CREATE POLICY "Users can view own books" ON public.books
    FOR SELECT USING (auth.uid() = seller_id);

-- Users can insert their own books
CREATE POLICY "Users can insert own books" ON public.books
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Users can update their own books
CREATE POLICY "Users can update own books" ON public.books
    FOR UPDATE USING (auth.uid() = seller_id);

-- Users can delete their own books
CREATE POLICY "Users can delete own books" ON public.books
    FOR DELETE USING (auth.uid() = seller_id);

-- Verify the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'books' AND table_schema = 'public'
ORDER BY ordinal_position;

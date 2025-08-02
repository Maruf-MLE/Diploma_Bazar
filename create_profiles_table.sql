-- SQL commands to create the profiles table

-- Create the profiles table with all necessary fields
CREATE TABLE public.profiles (
    -- Primary key and auth user link
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    
    -- User information fields
    name TEXT NOT NULL,                    -- নাম
    roll_number TEXT NOT NULL,             -- রোল নাম্বার
    semester TEXT NOT NULL,                -- সেমিস্টার
    department TEXT NOT NULL,              -- বিভাগ
    institute_name TEXT NOT NULL,          -- প্রতিষ্ঠান
    
    -- Optional fields for future use
    avatar_url TEXT,                       -- প্রোফাইল ছবি (optional)
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table

-- Anyone can view profiles (for public display)
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (TRUE);

-- Only authenticated users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create updated_at trigger
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
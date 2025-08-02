# বই চাপা বাজার ডাটাবেস স্ট্রাকচার

## টেবিল স্কিমা

### 1. profiles
ব্যবহারকারীদের প্রোফাইল তথ্য সংরক্ষণ করে।

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  semester TEXT NOT NULL,
  department TEXT NOT NULL,
  institute_name TEXT NOT NULL,
  avatar_url TEXT,
  is_email_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. books
বইয়ের তালিকা সংরক্ষণ করে।

```sql
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'acceptable', 'poor')),
  category TEXT NOT NULL,
  semester TEXT,
  department TEXT,
  institute_name TEXT,
  cover_image_url TEXT,
  additional_images TEXT[],
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'sold')),
  is_negotiable BOOLEAN DEFAULT TRUE
);
```

### 3. messages
ব্যবহারকারীদের মধ্যে বার্তা আদান-প্রদান সংরক্ষণ করে।

```sql
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. purchase_requests
বই কেনার অনুরোধ সংরক্ষণ করে।

```sql
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meetup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  meetup_location TEXT NOT NULL,
  proposed_price DECIMAL(10, 2) NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. notifications
ব্যবহারকারীদের নোটিফিকেশন সংরক্ষণ করে।

```sql
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ট্রিগার ফাংশন

### 1. handle_updated_at
টেবিলে আপডেট করার সময় updated_at ফিল্ড আপডেট করে।

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## ট্রিগার

### 1. messages টেবিলের জন্য
```sql
DROP TRIGGER IF EXISTS set_messages_updated_at ON public.messages;
CREATE TRIGGER set_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
```

### 2. books টেবিলের জন্য
```sql
DROP TRIGGER IF EXISTS set_books_updated_at ON public.books;
CREATE TRIGGER set_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
```

### 3. purchase_requests টেবিলের জন্য
```sql
DROP TRIGGER IF EXISTS set_purchase_requests_updated_at ON public.purchase_requests;
CREATE TRIGGER set_purchase_requests_updated_at
BEFORE UPDATE ON public.purchase_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
```

## ফাংশন

### 1. confirm_user_email
ব্যবহারকারীর ইমেইল নিশ্চিত করে।

```sql
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = user_id AND email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql;
```

## ইনডেক্স

### books টেবিলের জন্য
```sql
CREATE INDEX IF NOT EXISTS idx_books_seller_id ON public.books(seller_id);
```

### messages টেবিলের জন্য
```sql
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
```

### purchase_requests টেবিলের জন্য
```sql
CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer_id ON public.purchase_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_seller_id ON public.purchase_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_book_id ON public.purchase_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON public.purchase_requests(status);
```

### notifications টেবিলের জন্য
```sql
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
```

## ভিউ

### book_details
বইয়ের বিস্তারিত তথ্য সহ বিক্রেতার তথ্য দেখায়।

```sql
CREATE VIEW IF NOT EXISTS public.book_details AS 
SELECT b.id,
    b.title,
    b.author,
    b.description,
    b.price,
    b.condition,
    b.category,
    b.semester,
    b.department,
    b.institute_name,
    b.cover_image_url,
    b.additional_images,
    b.seller_id,
    p.name AS seller_name,
    p.avatar_url AS seller_avatar_url,
    p.institute_name AS seller_institute
FROM public.books b
LEFT JOIN public.profiles p ON b.seller_id = p.id;
```

## RLS পলিসি

### books টেবিলের জন্য
```sql
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view available books" 
  ON public.books 
  FOR SELECT 
  USING (status = 'available');

CREATE POLICY "Allow sellers to manage their own books" 
  ON public.books 
  FOR ALL 
  USING (auth.uid() = seller_id);
```

### messages টেবিলের জন্য
```sql
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own messages" 
  ON public.messages 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Allow users to send messages" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);
```

### purchase_requests টেবিলের জন্য
```sql
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own purchase requests (as buyer or seller)" 
  ON public.purchase_requests 
  FOR SELECT 
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Allow buyers to create purchase requests" 
  ON public.purchase_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Allow buyers to update their own purchase requests" 
  ON public.purchase_requests 
  FOR UPDATE 
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id AND status = 'pending');

CREATE POLICY "Allow sellers to update status of purchase requests" 
  ON public.purchase_requests 
  FOR UPDATE 
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id AND status = 'pending');
```

### notifications টেবিলের জন্য
```sql
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow any authenticated user to create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
```

## সাধারণ কুয়েরি উদাহরণ

### সব উপলব্ধ বই দেখার কুয়েরি
```sql
SELECT * FROM public.books WHERE status = 'available';
```

### বার্তা পাঠানোর কুয়েরি
```sql
INSERT INTO public.messages (sender_id, receiver_id, book_id, content) 
VALUES ($1, $2, $3, $4);
```

### বই কেনার অনুরোধ তৈরি করার কুয়েরি
```sql
INSERT INTO public.purchase_requests (book_id, buyer_id, seller_id, meetup_date, meetup_location, proposed_price, message, status)
VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending');
```

### নোটিফিকেশন তৈরি করার কুয়েরি
```sql
INSERT INTO public.notifications (user_id, title, message, type, related_id, is_read)
VALUES ($1, $2, $3, $4, $5, false);
``` 
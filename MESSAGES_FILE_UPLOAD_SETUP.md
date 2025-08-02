# মেসেজ ফাইল আপলোড সেটআপ গাইড

এই ডকুমেন্টটি আপনাকে বইচাপা বাজারের মেসেজিং সিস্টেমে ফাইল আপলোড সেটআপ করতে সাহায্য করবে।

## সমস্যা

মেসেজিং সিস্টেমে ফাইল আপলোড কাজ করছে না কারণ Supabase-এ `messages` বাকেট সঠিকভাবে সেটআপ করা হয়নি।

## সমাধান

আমরা নিম্নলিখিত পদ্ধতিগুলো ব্যবহার করে সমস্যাটি সমাধান করতে পারি:

### পদ্ধতি ১: স্ক্রিপ্ট ব্যবহার করে সেটআপ

এই প্রজেক্টে একটি স্ক্রিপ্ট যোগ করা হয়েছে যা স্বয়ংক্রিয়ভাবে `messages` বাকেট সেটআপ করবে:

```bash
npm run setup:message-uploads
```

> **নোট**: স্ক্রিপ্ট চালানোর আগে অবশ্যই অ্যাপে লগইন করুন।

### পদ্ধতি ২: Supabase SQL এডিটর ব্যবহার করে সেটআপ

১. Supabase ড্যাশবোর্ডে লগইন করুন
২. SQL এডিটর খুলুন
৩. নিম্নলিখিত SQL কোড রান করুন:

```sql
-- মেসেজ বাকেট তৈরি করা
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'messages', 
  'messages', 
  false, 
  10485760, 
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'text/plain', 'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'application/vnd.ms-powerpoint', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- পলিসি তৈরি করা
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow authenticated users to upload files"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to upload files" already exists. Skipping.';
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to view files"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to view files" already exists. Skipping.';
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to update their files"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to update their files" already exists. Skipping.';
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to delete their files"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'messages');
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy "Allow authenticated users to delete their files" already exists. Skipping.';
    END;
END
$$;

-- RLS সক্রিয় করা
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### পদ্ধতি ৩: Supabase ড্যাশবোর্ড ব্যবহার করে ম্যানুয়ালি সেটআপ

১. Supabase ড্যাশবোর্ডে লগইন করুন
২. Storage সেকশনে যান
৩. "New Bucket" বাটনে ক্লিক করুন
৪. বাকেটের নাম "messages" দিন
৫. "Public bucket" চেকবক্স আনচেক করুন
৬. "Create bucket" বাটনে ক্লিক করুন
৭. বাকেট তৈরি হওয়ার পর, এতে ক্লিক করে Policies ট্যাবে যান
৮. নিম্নলিখিত পলিসিগুলো তৈরি করুন:
   - Allow authenticated users to upload files (INSERT)
   - Allow authenticated users to view files (SELECT)
   - Allow authenticated users to update their files (UPDATE)
   - Allow authenticated users to delete their files (DELETE)
৯. বাকেটের মধ্যে নিম্নলিখিত ফোল্ডারগুলো তৈরি করুন:
   - message_images
   - message_documents

## ফোল্ডার স্ট্রাকচার

মেসেজিং সিস্টেমে ফাইল আপলোড সঠিকভাবে কাজ করার জন্য নিম্নলিখিত ফোল্ডার স্ট্রাকচার প্রয়োজন:

```
messages (bucket)
├── message_images/
│   └── (ছবি ফাইলগুলো এখানে সংরক্ষিত হবে)
└── message_documents/
    └── (ডকুমেন্ট ফাইলগুলো এখানে সংরক্ষিত হবে)
```

## ট্রাবলশুটিং

যদি ফাইল আপলোড এখনও কাজ না করে, নিম্নলিখিত বিষয়গুলো চেক করুন:

1. আপনি অ্যাপে লগইন আছেন কিনা
2. ব্রাউজার কনসোলে কোন এরর মেসেজ আছে কিনা
3. Supabase ড্যাশবোর্ডে `messages` বাকেট আছে কিনা
4. বাকেটের পলিসিগুলো সঠিকভাবে সেট করা আছে কিনা
5. ফোল্ডার স্ট্রাকচার সঠিক আছে কিনা

## সাপোর্টেড ফাইল টাইপ

মেসেজিং সিস্টেমে নিম্নলিখিত ফাইল টাইপগুলো সাপোর্ট করা হয়:

### ছবি
- JPEG/JPG
- PNG
- GIF
- WebP

### ডকুমেন্ট
- PDF
- DOC/DOCX (Word)
- TXT (Text)
- XLS/XLSX (Excel)
- PPT/PPTX (PowerPoint)

## ফাইল সাইজ লিমিট

সর্বাধিক ফাইল সাইজ: 10MB 
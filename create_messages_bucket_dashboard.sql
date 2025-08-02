-- Messages Bucket Setup Instructions
-- এই ফাইলটি সুপাবেসে messages বাকেট সেটআপ করার জন্য নির্দেশনা দেয়

-- নোট: আপনি "must be owner of table objects" এরর পাচ্ছেন কারণ আপনার সুপাবেস অ্যাকাউন্টে
-- storage.objects টেবিলের উপর পলিসি তৈরি করার পর্যাপ্ত অনুমতি নেই।
-- এই সমস্যা সমাধান করতে, আপনাকে সুপাবেস ড্যাশবোর্ড ব্যবহার করে ম্যানুয়ালি বাকেট এবং পলিসি তৈরি করতে হবে।

-- নিচের SQL কোড শুধুমাত্র বাকেট তৈরি করবে, যা সম্ভবত কাজ করবে:
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

-- পলিসি তৈরি করার জন্য, অনুগ্রহ করে নিচের পদক্ষেপগুলি অনুসরণ করুন:

-- 1. সুপাবেস ড্যাশবোর্ডে লগইন করুন (https://app.supabase.com)
-- 2. আপনার প্রজেক্ট সিলেক্ট করুন
-- 3. বাম সাইডবারে "Storage" এ ক্লিক করুন
-- 4. যদি 'messages' বাকেট না থাকে:
--    a. "New Bucket" বাটনে ক্লিক করুন
--    b. বাকেটের নাম "messages" দিন
--    c. "Public" চেকবক্স আনচেক করুন
--    d. "Create bucket" বাটনে ক্লিক করুন

-- 5. 'messages' বাকেটে ক্লিক করুন
-- 6. "Policies" ট্যাবে ক্লিক করুন
-- 7. "New Policy" বাটনে ক্লিক করুন
-- 8. নিম্নলিখিত পলিসিগুলি একে একে তৈরি করুন:

--    a. আপলোড পলিসি:
--       Policy name: Allow authenticated users to upload files
--       Allowed operations: INSERT
--       Target roles: authenticated
--       Using expression: bucket_id = 'messages'

--    b. ডাউনলোড পলিসি:
--       Policy name: Allow authenticated users to view files
--       Allowed operations: SELECT
--       Target roles: authenticated
--       Using expression: bucket_id = 'messages'

--    c. আপডেট পলিসি:
--       Policy name: Allow authenticated users to update their files
--       Allowed operations: UPDATE
--       Target roles: authenticated
--       Using expression: bucket_id = 'messages'

--    d. ডিলিট পলিসি:
--       Policy name: Allow authenticated users to delete their files
--       Allowed operations: DELETE
--       Target roles: authenticated
--       Using expression: bucket_id = 'messages'

-- 9. ফোল্ডার তৈরি করুন:
--    a. বাকেটে ফিরে যান
--    b. "Create folder" বাটনে ক্লিক করুন
--    c. "message_images" নামে একটি ফোল্ডার তৈরি করুন
--    d. আবার "Create folder" বাটনে ক্লিক করুন
--    e. "message_documents" নামে আরেকটি ফোল্ডার তৈরি করুন

-- এই পদক্ষেপগুলি সম্পূর্ণ করার পর, আপনার মেসেজিং সিস্টেমে ফাইল আপলোড কাজ করা উচিত। 
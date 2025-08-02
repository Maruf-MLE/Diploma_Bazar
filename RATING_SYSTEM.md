# বই-চাপা-বাজার রেটিং সিস্টেম

## ভূমিকা

বই-চাপা-বাজার প্ল্যাটফর্মে ব্যবহারকারীদের মধ্যে বিশ্বাস তৈরি করতে এবং লেনদেনের গুণমান নিশ্চিত করতে রেটিং সিস্টেম যোগ করা হয়েছে। এই সিস্টেমের মাধ্যমে ক্রেতা-বিক্রেতা উভয়েই একে অপরকে রেটিং দিতে পারবেন শুধুমাত্র সফল লেনদেনের পর।

## ফিচার

1. **লেনদেন ভিত্তিক রেটিং**:
   - শুধুমাত্র সম্পূর্ণ হওয়া লেনদেনের জন্য রেটিং দেওয়া যাবে
   - প্রতিটি লেনদেনে ক্রেতা এবং বিক্রেতা উভয়েই একে অপরকে রেটিং দিতে পারবেন
   - একটি লেনদেনের জন্য একজন ব্যবহারকারী শুধুমাত্র একবার রেটিং দিতে পারবেন

2. **রেটিং সিস্টেমের উপাদান**:
   - 1-5 স্টার রেটিং স্কেল
   - ঐচ্ছিক মন্তব্য/কমেন্ট
   - রেটিং দেওয়ার পর নোটিফিকেশন

3. **রেটিং দেখার ব্যবস্থা**:
   - প্রোফাইল পেজে ব্যবহারকারীর গড় রেটিং দেখা যাবে
   - মোট রেটিং সংখ্যা দেখা যাবে
   - সমস্ত রেটিং এবং মন্তব্য দেখার ব্যবস্থা

## রেটিং দেওয়ার প্রক্রিয়া

1. **লেনদেন সম্পন্ন করা**:
   - বিক্রেতা ক্রেতার কেনার অনুরোধ গ্রহণ করলে লেনদেন সম্পন্ন হবে
   - লেনদেন সম্পন্ন হলে পারচেজ হিস্টরি তৈরি হবে

2. **রেটিং দেওয়ার অপশন**:
   - কেনাবেচার ইতিহাস পেজে "রেটিং দিন" বাটন থাকবে
   - অ্যাকসেপ্টেড পারচেজ রিকোয়েস্টে "রেটিং দিন" বাটন থাকবে

3. **রেটিং ফর্ম**:
   - স্টার রেটিং (1-5)
   - ঐচ্ছিক মন্তব্য/কমেন্ট
   - সাবমিট বাটন

4. **রেটিং সাবমিশন**:
   - রেটিং সাবমিট করলে ডাটাবেসে সেভ হবে
   - রেটিং সাবমিট করার পর আর পরিবর্তন করা যাবে না
   - রেটিং সাবমিট করার পর অন্য পক্ষকে নোটিফিকেশন যাবে

## ইনস্টলেশন এবং সেটআপ

1. **রেটিং টেবিল আপডেট**:
   ```bash
   npm run update:rating
   ```

2. **রেটিং সিস্টেম কনফিগারেশন**:
   - RatingDialog কম্পোনেন্টে ট্রানজেকশন ভিত্তিক রেটিং যোগ করা হয়েছে
   - PurchaseHistoryList কম্পোনেন্টে রেটিং বাটন যোগ করা হয়েছে
   - BookPurchaseRequestCard কম্পোনেন্টে ট্রানজেকশন ভিত্তিক রেটিং যোগ করা হয়েছে

## ব্যবহার নির্দেশিকা

### ব্যবহারকারীদের জন্য

1. **রেটিং দেওয়া**:
   - লেনদেন সম্পন্ন করুন
   - কেনাবেচার ইতিহাস পেজে যান
   - "রেটিং দিন" বাটনে ক্লিক করুন
   - স্টার রেটিং এবং মন্তব্য দিন
   - "সাবমিট করুন" বাটনে ক্লিক করুন

2. **রেটিং দেখা**:
   - প্রোফাইল পেজে যান
   - "রিভিউ" ট্যাবে ক্লিক করুন
   - সমস্ত রেটিং এবং মন্তব্য দেখুন

### এডমিনদের জন্য

1. **রেটিং মনিটরিং**:
   - এডমিন ড্যাশবোর্ডে যান
   - "রেটিং" সেকশনে যান
   - সমস্ত রেটিং দেখুন এবং অনুপযুক্ত রেটিং মুছে ফেলুন

## ডাটাবেস স্ট্রাকচার

### reviews টেবিল

```sql
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  purchase_id UUID REFERENCES public.purchase_history(id) ON DELETE SET NULL,
  is_buyer_review BOOLEAN DEFAULT FALSE,
  is_seller_review BOOLEAN DEFAULT FALSE,
  completed_transaction BOOLEAN DEFAULT TRUE
);
```

### purchase_history টেবিল

```sql
CREATE TABLE IF NOT EXISTS public.purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  purchase_request_id UUID REFERENCES public.purchase_requests(id),
  price DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meetup_location TEXT,
  meetup_date TIMESTAMP WITH TIME ZONE,
  book_title TEXT,
  book_author TEXT,
  book_cover_image_url TEXT,
  buyer_has_reviewed BOOLEAN DEFAULT FALSE,
  seller_has_reviewed BOOLEAN DEFAULT FALSE
);
```

## ট্রাবলশুটিং

1. **রেটিং সাবমিট হচ্ছে না**:
   - ইউজার লগইন আছে কিনা চেক করুন
   - লেনদেন সম্পন্ন হয়েছে কিনা চেক করুন
   - ইউজার আগে রেটিং দিয়েছে কিনা চেক করুন

2. **রেটিং দেখা যাচ্ছে না**:
   - প্রোফাইল পেজে "রিভিউ" ট্যাব চেক করুন
   - ডাটাবেসে রেটিং সেভ হয়েছে কিনা চেক করুন

3. **একাধিকবার রেটিং দেওয়া যাচ্ছে**:
   - `buyer_has_reviewed` এবং `seller_has_reviewed` ফিল্ড চেক করুন
   - `unique_review_per_transaction_type` কনস্ট্রেইন্ট চেক করুন

## সিকিউরিটি কনসিডারেশন

- RLS (Row Level Security) পলিসিগুলো ইমপ্লিমেন্ট করা হয়েছে
- শুধুমাত্র লেনদেনের সাথে জড়িত ব্যবহারকারীরা রেটিং দিতে পারবেন
- একটি লেনদেনের জন্য একজন ব্যবহারকারী শুধুমাত্র একবার রেটিং দিতে পারবেন
- এডমিন ছাড়া কেউ অন্যের রেটিং পরিবর্তন করতে পারবে না 
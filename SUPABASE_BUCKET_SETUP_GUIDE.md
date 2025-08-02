# সুপাবেস স্টোরেজ বাকেট সেটআপ গাইড

এই গাইডটি আপনাকে সুপাবেস ড্যাশবোর্ড ব্যবহার করে `messages` বাকেট সেটআপ করতে সাহায্য করবে।

## সমস্যা

আপনি SQL কোড চালানোর সময় নিম্নলিখিত এরর পাচ্ছেন:

```
ERROR: 42501: must be owner of table objects
```

এই এরর দেখাচ্ছে যে আপনার সুপাবেস অ্যাকাউন্টে `storage.objects` টেবিলের উপর পলিসি তৈরি করার পর্যাপ্ত অনুমতি নেই। এই সমস্যা সমাধান করতে, আমরা সুপাবেস ড্যাশবোর্ড ব্যবহার করে ম্যানুয়ালি বাকেট এবং পলিসি তৈরি করব।

## পদক্ষেপ ১: সুপাবেস ড্যাশবোর্ডে লগইন করুন

1. [সুপাবেস ড্যাশবোর্ডে](https://app.supabase.com) যান
2. আপনার অ্যাকাউন্টে লগইন করুন
3. আপনার প্রজেক্ট সিলেক্ট করুন

## পদক্ষেপ ২: বাকেট তৈরি করুন

1. বাম সাইডবারে **Storage** এ ক্লিক করুন
2. **New Bucket** বাটনে ক্লিক করুন
3. বাকেটের নাম `messages` দিন
4. **Public bucket** চেকবক্স **আনচেক** করুন (এটি খুবই গুরুত্বপূর্ণ!)
5. **Create bucket** বাটনে ক্লিক করুন

![বাকেট তৈরি করুন](https://i.imgur.com/example1.png)

## পদক্ষেপ ৩: পলিসি তৈরি করুন

1. নতুন তৈরি করা `messages` বাকেটে ক্লিক করুন
2. উপরের ন্যাভিগেশন বারে **Policies** ট্যাবে ক্লিক করুন
3. **New Policy** বাটনে ক্লিক করুন

![পলিসি ট্যাব](https://i.imgur.com/example2.png)

### পলিসি ১: আপলোড পলিসি

1. **Policy name**: `Allow authenticated users to upload files`
2. **Allowed operations**: `INSERT` চেকবক্স সিলেক্ট করুন
3. **Target roles**: `authenticated` সিলেক্ট করুন
4. **Using expression**: `bucket_id = 'messages'` লিখুন
5. **Save policy** বাটনে ক্লিক করুন

### পলিসি ২: ডাউনলোড পলিসি

1. আবার **New Policy** বাটনে ক্লিক করুন
2. **Policy name**: `Allow authenticated users to view files`
3. **Allowed operations**: `SELECT` চেকবক্স সিলেক্ট করুন
4. **Target roles**: `authenticated` সিলেক্ট করুন
5. **Using expression**: `bucket_id = 'messages'` লিখুন
6. **Save policy** বাটনে ক্লিক করুন

### পলিসি ৩: আপডেট পলিসি

1. আবার **New Policy** বাটনে ক্লিক করুন
2. **Policy name**: `Allow authenticated users to update their files`
3. **Allowed operations**: `UPDATE` চেকবক্স সিলেক্ট করুন
4. **Target roles**: `authenticated` সিলেক্ট করুন
5. **Using expression**: `bucket_id = 'messages'` লিখুন
6. **Save policy** বাটনে ক্লিক করুন

### পলিসি ৪: ডিলিট পলিসি

1. আবার **New Policy** বাটনে ক্লিক করুন
2. **Policy name**: `Allow authenticated users to delete their files`
3. **Allowed operations**: `DELETE` চেকবক্স সিলেক্ট করুন
4. **Target roles**: `authenticated` সিলেক্ট করুন
5. **Using expression**: `bucket_id = 'messages'` লিখুন
6. **Save policy** বাটনে ক্লিক করুন

![পলিসি তৈরি করুন](https://i.imgur.com/example3.png)

## পদক্ষেপ ৪: ফোল্ডার তৈরি করুন

1. উপরের ন্যাভিগেশন বারে **Explorer** ট্যাবে ক্লিক করুন
2. **Create folder** বাটনে ক্লিক করুন
3. ফোল্ডারের নাম `message_images` দিন
4. **Create folder** বাটনে ক্লিক করুন
5. আবার **Create folder** বাটনে ক্লিক করুন
6. ফোল্ডারের নাম `message_documents` দিন
7. **Create folder** বাটনে ক্লিক করুন

![ফোল্ডার তৈরি করুন](https://i.imgur.com/example4.png)

## পদক্ষেপ ৫: পরীক্ষা করুন

এখন আপনার বাকেট সেটআপ সম্পূর্ণ হয়েছে। আপনার অ্যাপে ফিরে যান এবং ফাইল আপলোড করার চেষ্টা করুন।

## ট্রাবলশুটিং

যদি আপনি এখনও সমস্যার সম্মুখীন হন:

1. **লগইন স্ট্যাটাস চেক করুন**: অ্যাপে লগইন আছেন কিনা নিশ্চিত করুন
2. **ব্রাউজার কনসোল চেক করুন**: ব্রাউজারের ডেভেলপার টুলস খুলুন (F12) এবং কনসোলে কোন এরর মেসেজ আছে কিনা দেখুন
3. **বাকেট নাম চেক করুন**: বাকেটের নাম ঠিক `messages` আছে কিনা নিশ্চিত করুন (বড় হাতের অক্ষর নয়)
4. **পলিসি চেক করুন**: সব পলিসি সঠিকভাবে তৈরি করা হয়েছে কিনা নিশ্চিত করুন
5. **ফোল্ডার চেক করুন**: `message_images` এবং `message_documents` ফোল্ডার আছে কিনা নিশ্চিত করুন

## অতিরিক্ত সাহায্য

যদি আপনি এখনও সমস্যার সম্মুখীন হন, অনুগ্রহ করে নিম্নলিখিত তথ্য সহ সাহায্য চান:

1. ব্রাউজার কনসোলের এরর মেসেজ
2. সুপাবেস ড্যাশবোর্ডের স্ক্রিনশট
3. আপনি কোন পদক্ষেপে আটকে আছেন 
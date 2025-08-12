# 🔧 Verification System Fix Guide

## সমস্যা
"বই বিক্রি করুন" পেজে verified user রা access পাচ্ছিল না। System ভুল table check করছিল।

## সমাধান
আমরা verification system কে আপডেট করেছি যাতে এটি আপনার নির্দিষ্ট করা `verification_data` table ব্যবহার করে।

## 🛠️ Setup Steps

### 1. Database Table তৈরি করুন
```bash
# Option A: Automatic migration (recommended)
npm run migrate:verification-table

# Option B: Manual SQL execution
# Go to Supabase Dashboard > SQL Editor
# Copy and paste contents of create_verification_data_table.sql
```

### 2. Test Verification System
```bash
npm run test:verification
```

### 3. Development Server চালান
```bash
npm run dev
```

## 📊 Database Schema

আপনার নির্দিষ্ট করা table structure:

```sql
CREATE TABLE public.verification_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NULL,
  roll_no text NULL,
  reg_no text NULL,
  document_url text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  is_verified boolean NULL DEFAULT false,
  status text NULL,
  CONSTRAINT verification_data_pkey PRIMARY KEY (id),
  CONSTRAINT verification_data_reg_no_key UNIQUE (reg_no),
  CONSTRAINT verification_data_roll_no_key UNIQUE (roll_no),
  CONSTRAINT verification_data_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE
);
```

## 🔄 Updated Components

### 1. SellBookPage.tsx
- ✅ এখন `verification_data` table check করে
- ✅ Verified users পাবে access
- ✅ Better error logging আছে

### 2. supabase.ts
- ✅ `getUserVerificationStatus()` function আপডেট করা হয়েছে
- ✅ শুধুমাত্র `verification_data` table ব্যবহার করে
- ✅ Better debugging information

### 3. Real-time Updates
- ✅ `subscribeToVerificationChanges()` আপডেট করা হয়েছে
- ✅ Instant verification status updates

## ✅ Testing

### Manual Testing
1. একটি user account create করুন
2. `npm run test:verification` চালান - এটি একটি test verification record তৈরি করবে
3. "বই বিক্রি করুন" পেজে যান
4. Verified user হলে access পাবেন

### Verification Status যাচাই
```javascript
// Console এ check করুন:
// 1. User verification status from RPC/direct query
// 2. SellBookPage verification check logs
// 3. Real-time subscription logs
```

## 🎯 Key Features

### For Users:
- ✅ Verified users can access "বই বিক্রি করুন" page
- ✅ Non-verified users get clear instructions
- ✅ Real-time verification status updates

### For Admins:
- ✅ Can approve/reject verification requests
- ✅ View all pending verifications
- ✅ Update verification status

### Security:
- ✅ RLS (Row Level Security) enabled
- ✅ Users can only see their own data
- ✅ Admins have elevated permissions

## 🚨 Manual Steps (If Automatic Migration Fails)

1. **Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to SQL Editor

2. **Copy SQL**:
   - Open `create_verification_data_table.sql`
   - Copy all contents
   - Paste in SQL Editor
   - Click "Run"

3. **Test Table**:
   ```bash
   npm run test:verification
   ```

## 🔧 Troubleshooting

### Problem: Table doesn't exist
**Solution**: Run the SQL manually in Supabase Dashboard

### Problem: Permission denied
**Solution**: Check RLS policies in the SQL file

### Problem: Still showing "verification required"
**Solution**: 
1. Check console logs
2. Run `npm run test:verification`
3. Ensure `is_verified = true` in database

## 📝 Status Codes

- `pending` - Verification submitted, waiting for approval
- `approved` - Verified and can access all features  
- `rejected` - Verification rejected, needs resubmission
- `under_review` - Admin is reviewing the submission

## 🎉 Expected Behavior

### Verified User:
1. Login করলেই access পাবে "বই বিক্রি করুন" পেজে
2. কোনো verification message দেখবে না
3. Normal form দেখবে

### Unverified User:
1. Verification required message পাবে
2. "যাচাইকরণ করুন" button দেখবে
3. Verification page এ redirect হবে

## 💡 Tips

- Console logs check করুন debugging এর জন্য
- Browser DevTools এ Network tab দেখুন API calls
- Supabase Dashboard এ Table Editor দিয়ে data verify করুন

---

**এখন verification system সঠিকভাবে কাজ করবে! 🎊**

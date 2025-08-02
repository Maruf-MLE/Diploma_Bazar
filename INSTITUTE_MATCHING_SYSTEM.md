# Institute Matching System

## সিস্টেম Overview

এই সিস্টেমের মাধ্যমে শুধুমাত্র একই প্রতিষ্ঠানের ছাত্রছাত্রীরা একে অপরের সাথে যোগাযোগ করতে এবং বই কিনতে পারবে।

## যা যা implement করা হয়েছে:

### ১. Database Level Security

#### Functions তৈরি করা হয়েছে:
- `users_same_institute(user1_id, user2_id)` - দুই ইউজার একই প্রতিষ্ঠানের কিনা চেক করে
- `can_message_user(sender_id, receiver_id)` - মেসেজ পাঠানো যাবে কিনা চেক করে
- `can_purchase_book(buyer_id, book_id)` - বই কেনার অনুরোধ পাঠানো যাবে কিনা চেক করে
- `get_user_institute(user_id)` - ইউজারের প্রতিষ্ঠানের নাম দেয়
- `current_user_same_institute(other_user_id)` - বর্তমান ইউজার অন্য ইউজারের সাথে একই প্রতিষ্ঠানের কিনা

#### RLS Policies আপডেট করা হয়েছে:
- **Messages Table**: শুধু একই প্রতিষ্ঠানের ইউজাররা মেসেজ পাঠাতে পারবে
- **Purchase Requests Table**: শুধু একই প্রতিষ্ঠানের ইউজাররা বই কেনার অনুরোধ পাঠাতে পারবে

### ২. Frontend Level Validation

#### Utility Functions:
- `canMessageUser(receiverId)` - মেসেজ পাঠানো যাবে কিনা চেক
- `canPurchaseBook(bookId)` - বই কেনার অনুরোধ পাঠানো যাবে কিনা চেক
- `usersSameInstitute(user1Id, user2Id)` - দুই ইউজার একই প্রতিষ্ঠানের কিনা
- `currentUserSameInstitute(otherUserId)` - বর্তমান ইউজার অন্য ইউজারের সাথে একই প্রতিষ্ঠানের কিনা
- `getUserInstitute(userId)` - ইউজারের প্রতিষ্ঠান

#### Error Messages:
```typescript
const INSTITUTE_MISMATCH_MESSAGES = {
  MESSAGE: 'আপনি শুধুমাত্র আপনার প্রতিষ্ঠানের ছাত্রছাত্রীদের সাথে মেসেজ করতে পারবেন।',
  PURCHASE: 'আপনি শুধুমাত্র আপনার প্রতিষ্ঠানের ছাত্রছাত্রীদের কাছ থেকে বই কিনতে পারবেন।',
  GENERAL: 'এই কার্যক্রমটি শুধুমাত্র একই প্রতিষ্ঠানের ছাত্রছাত্রীদের মধ্যে সীমাবদ্ধ।'
}
```

### ৩. UI Level Integration

#### BookDetailsDialog আপডেট করা হয়েছে:
- **Contact Seller Button**: মেসেজ পাঠানোর আগে institute matching চেক করে
- **Purchase Request Button**: বই কেনার অনুরোধ পাঠানোর আগে institute matching চেক করে
- **Error Messages**: যদি institute match না করে তাহলে বাংলায় error message দেখায়

## Setup Instructions:

### ১. Database Setup:
```bash
# Supabase SQL Editor এ এই file চালান:
institute_matching_system.sql
```

### ২. Frontend Integration:
- `instituteUtils.ts` file ইতিমধ্যে তৈরি হয়ে গেছে
- `BookDetailsDialog.tsx` আপডেট করা হয়েছে

## কিভাবে কাজ করে:

### Message পাঠানোর সময়:
1. User "বিক্রেতার সাথে যোগাযোগ করুন" button এ click করে
2. System check করে দুই user একই institute এর কিনা
3. যদি একই institute না হয় তাহলে error message দেখায়
4. যদি একই institute হয় তাহলে message dialog open করে

### Purchase Request পাঠানোর সময়:
1. User "বই কেনার অনুরোধ পাঠান" button এ click করে  
2. System check করে buyer ও seller একই institute এর কিনা
3. যদি একই institute না হয় তাহলে error message দেখায়
4. যদি একই institute হয় তাহলে purchase request form open করে

### Database Level Protection:
- RLS policies ensure করে যে database level এও এই restrictions কাজ করে
- যদি কেউ API directly call করে তাহলেও system prevent করবে

## Testing:

### Test Case 1: Same Institute Users
1. একই institute এর দুই user create করুন
2. একজন বই post করুন
3. অন্যজন সেই বই এ message/purchase request করার চেষ্টা করুন
4. **Expected**: Successfully message/purchase request পাঠাতে পারবে

### Test Case 2: Different Institute Users  
1. ভিন্ন institute এর দুই user create করুন
2. একজন বই post করুন
3. অন্যজন সেই বই এ message/purchase request করার চেষ্টা করুন
4. **Expected**: Error message দেখাবে এবং action prevent করবে

## Security Features:

1. **Double Layer Protection**: Frontend validation + Database RLS policies
2. **SQL Injection Prevention**: Parameterized queries ব্যবহার করা হয়েছে
3. **Role-based Access**: শুধু authenticated users রা functions access করতে পারবে
4. **Data Integrity**: Institute name null check করা হয়েছে

## Maintenance:

### নতুন Institute Add করতে:
- শুধু profiles table এ correct institute_name দিলেই হবে
- কোনো additional configuration লাগবে না

### Disable করতে চাইলে:
```sql
-- RLS policies disable করুন
DROP POLICY "Allow users to send messages to same institute users" ON public.messages;
DROP POLICY "Allow buyers to create purchase requests for same institute sellers" ON public.purchase_requests;

-- Original policies restore করুন
-- (আপনার আগের policies এর backup নিয়ে রাখুন)
```

এখন আপনার সিস্টেম সম্পূর্ণভাবে institute-based access control দিয়ে secure! 🏫🔒

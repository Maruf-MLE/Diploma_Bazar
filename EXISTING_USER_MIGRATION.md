# 🔄 পুরনো ব্যবহারকারী মাইগ্রেশন গাইড

আপনার সাইটের পুরনো ব্যবহারকারীরা যারা email/password দিয়ে রেজিস্ট্রেশন করেছিলেন, তাদের Google OAuth এ migrate করানোর সম্পূর্ণ সমাধান।

## 🚨 **সমস্যার বর্ণনা:**
- পুরনো users email/password দিয়ে রেজিস্ট্রেশন করেছিল
- এখন শুধু Google OAuth চালু আছে
- পুরনো users Google দিয়ে লগইন করতে গেলে নতুন profile তৈরি করতে বলে
- Same email দিয়ে আগেই account আছে বলে error দেয়

## ✅ **সমাধান: Account Linking System**

### **নতুন ফিচার যোগ করা হয়েছে:**

#### 1. **স্মার্ট ডিটেকশন সিস্টেম:**
- `AuthCallback` page এ existing user detection যোগ করা হয়েছে
- Same email দিয়ে আগের account পেলে account linking suggest করে
- Auto-redirect to account linking page

#### 2. **Account Linking Page (`/account-linking`):**
- পুরনো email ও password দিয়ে verification
- Google account এর সাথে data merge করে
- User-friendly interface

#### 3. **Account Merge Page (`/auth/account-merge`):**
- Background এ account merging process
- Profile data transfer
- Books ও অন্যান্য data transfer
- Old account cleanup

### **কিভাবে কাজ করে:**

```
1. User Google দিয়ে login করে
   ↓
2. AuthCallback existing user detect করে
   ↓
3. Account Linking page এ redirect
   ↓
4. User পুরনো email/password দেয়
   ↓
5. Verification successful হলে Google OAuth flow শুরু
   ↓
6. Account Merge page এ data transfer
   ↓
7. Home page এ redirect (সব data intact থাকে)
```

## 📋 **আপনার করণীয়:**

### **কিছুই করার প্রয়োজন নেই!** 

সব কিছু automatic:
- নতুন pages তৈরি হয়েছে
- Routes add করা হয়েছে
- Smart detection চালু আছে

### **ব্যবহারকারীদের জন্য নির্দেশনা:**

1. **Google দিয়ে লগইন করুন**
2. **"অ্যাকাউন্ট পাওয়া গেছে"** message দেখলে **"অ্যাকাউন্ট লিংক করুন"** এ ক্লিক করুন
3. **পুরনো ইমেইল ও পাসওয়ার্ড** দিন
4. **Google OAuth** সম্পন্ন করুন
5. **সফল!** এখন Google দিয়েই লগইন করতে পারবেন

## 🔧 **Technical Details:**

### **Files তৈরি/সংশোধন:**
- `src/pages/AccountLinkingPage.tsx` - Account linking UI
- `src/pages/AccountMergePage.tsx` - Background merge process
- `src/pages/AuthCallback.tsx` - Existing user detection
- `src/App.tsx` - New routes added

### **Database Operations:**
- Old user profile data → New Google user
- Books ownership transfer
- Notifications transfer
- Old profile cleanup

### **Security Features:**
- Email matching verification
- Password validation
- Safe data transfer
- Rollback on errors

## 📱 **User Experience:**

### **পুরনো User এর জন্য Flow:**
```
Google Login → "Account Found" Toast → Account Link Page 
→ Enter Old Credentials → Google OAuth → Merge Complete → Home
```

### **নতুন User এর জন্য Flow:**
```
Google Login → Profile Completion → Home
```

## 🛠️ **Admin/Support এর জন্য:**

### **সাধারণ সমস্যা ও সমাধান:**

#### **"ইমেইল মিলছে না" Error:**
- User যদি ভিন্ন Google email দিয়ে login করে
- Solution: সঠিক Google email দিয়ে login করতে বলুন

#### **"পুরনো password মনে নেই":**
- Account linking skip করে নতুন account তৈরি করতে পারে
- Manual migration করতে হবে (database level)

#### **Data Transfer Failed:**
- Automatic rollback হবে
- User কে আবার চেষ্টা করতে বলুন
- Manual intervention প্রয়োজন হতে পারে

### **Monitoring:**
- Console logs check করুন merge process এর জন্য
- Success/failure rate monitor করুন
- User feedback নিন

## 🎯 **Benefits:**

✅ **Seamless Migration** - No data loss  
✅ **User-Friendly** - Clear instructions  
✅ **Automatic Detection** - No manual work  
✅ **Secure Process** - Password verification  
✅ **Backward Compatible** - Old users can migrate when ready  

## ⚠️ **Important Notes:**

- Migration একবারই হবে per user
- Old account permanently delete হয়ে যাবে
- Google email ও old email same হতে হবে
- Process irreversible

---

**এই সিস্টেম চালু করার পর আপনার পুরনো সব users সহজেই Google OAuth এ migrate করতে পারবে তাদের সব data নিয়ে!** 🎉

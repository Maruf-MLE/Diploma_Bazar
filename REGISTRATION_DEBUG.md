# 🐛 Registration Form Debugging Guide

Profile completion form submit করার পর কোনো কাজ না হওয়ার সমস্যার debug guide।

## 🔍 **সমস্যা চিহ্নিতকরণ:**

### **Browser Console চেক করুন:**

1. **Chrome/Firefox এ F12 চাপুন**
2. **Console Tab এ যান**
3. **Registration form submit করার সময় logs দেখুন**

#### **Expected Console Logs:**
```
🚀 প্রোফাইল আপডেট শুরু হচ্ছে
👤 User Info: { id: "...", email: "...", ... }
📝 Form Data: { name: "...", rollNumber: "...", ... }
🔍 Existing profile: null or {...}
💾 Profile data to save: { id: "...", name: "...", ... }
✅ প্রোফাইল সফলভাবে সেভ হয়েছে: {...}
```

### **সাধারণ সমস্যা ও সমাধান:**

#### 1. **"User not authenticated" Error:**
```javascript
❌ ত্রুটি: আপনাকে প্রথমে Google দিয়ে লগইন করতে হবে।
```
**সমাধান:** 
- আবার Google দিয়ে লগইন করুন
- Browser cookie/localStorage clear করুন

#### 2. **Database Permission Error:**
```javascript
❌ Profile upsert error: { code: "42501", message: "permission denied" }
```
**সমাধান:**
- Supabase RLS (Row Level Security) policies check করুন
- `profiles` table এ insert/update permission আছে কিনা দেখুন

#### 3. **Field Validation Error:**
```javascript
❌ Profile upsert error: { code: "23502", message: "null value in column violates not-null constraint" }
```
**সমাধান:**
- সব required fields পূরণ করেছেন কিনা চেক করুন
- Database schema এ nullable fields check করুন

#### 4. **Network/Connection Error:**
```javascript
❌ Profile upsert error: { message: "fetch error" }
```
**সমাধান:**
- Internet connection check করুন
- Supabase service status check করুন

## 🔧 **Manual Debugging Steps:**

### **Step 1: User Authentication Check**
```javascript
// Browser console এ run করুন:
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)
```

### **Step 2: Database Connection Check**
```javascript
// Browser console এ run করুন:
const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
console.log('Database connection:', { data, error })
```

### **Step 3: Profile Table Schema Check**
```javascript
// Browser console এ run করুন:
const { data, error } = await supabase.from('profiles').select('*').limit(1)
console.log('Profile table structure:', { data, error })
```

### **Step 4: Manual Profile Insert Test**
```javascript
// Browser console এ test data দিয়ে run করুন:
const testData = {
  id: 'user-id-here',
  name: 'Test User',
  email: 'test@example.com',
  roll_number: '123456',
  semester: '১ম সেমিস্টার',
  department: 'কম্পিউটার টেকনোলজি',
  institute_name: 'ঢাকা পলিটেকনিক ইনস্টিটিউট'
}

const { data, error } = await supabase
  .from('profiles')
  .upsert(testData)
  .select()

console.log('Manual insert result:', { data, error })
```

## 🛠️ **Common Fixes:**

### **Fix 1: Update Supabase RLS Policies**
```sql
-- Supabase SQL Editor এ run করুন:

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to select their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

### **Fix 2: Database Schema Check**
```sql
-- Supabase SQL Editor এ table structure check করুন:
\d profiles;

-- Expected columns:
-- id (uuid, primary key)
-- name (text)
-- full_name (text, nullable)
-- email (text)
-- roll_number (text)
-- semester (text)
-- department (text)
-- institute_name (text)
-- created_at (timestamp)
-- updated_at (timestamp)
```

### **Fix 3: Environment Variables Check**
Local development এ .env.local file check করুন:
```bash
VITE_SUPABASE_URL=https://yryerjgidsyfiohmpeoc.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🚨 **Emergency Fixes:**

### **যদি কিছুই কাজ না করে:**

1. **Browser cache clear করুন:**
   - Chrome: Ctrl+Shift+Delete
   - সব cookies এবং site data clear করুন

2. **Incognito/Private mode এ test করুন:**
   - নতুন incognito window open করুন
   - Google login এবং registration test করুন

3. **Different browser এ test করুন:**
   - Chrome থেকে Firefox বা Edge এ try করুন

4. **Network tab check করুন:**
   - F12 → Network tab → form submit করুন
   - Failed requests দেখুন

## 📞 **Support Contact:**

যদি এখনও সমস্যা থাকে:

1. **Console logs screenshot নিন**
2. **Network tab এর error screenshot নিন** 
3. **Facebook page এ message করুন:** https://www.facebook.com/diplomabazar/

## ✅ **Success Checklist:**

Form submit করার পর যা হওয়া উচিত:
- [ ] Success toast message দেখা যাবে
- [ ] Home page এ redirect হবে
- [ ] পরবর্তীতে login করলে direct home page এ যাবে
- [ ] Profile page এ সব তথ্য দেখা যাবে

---

**এই guide follow করে আপনি registration form এর যেকোনো সমস্যা debug এবং fix করতে পারবেন।**

# 📱 Phone Verification Fix Guide

এই গাইড অনুসরণ করে আপনার SMS verification system ঠিক করুন।

## 🚀 Quick Fix (সবচেয়ে সহজ)

### Method 1: Manual SQL (সুপারিশকৃত)

1. **Supabase Dashboard এ যান:**
   - https://supabase.com/dashboard এ যান
   - আপনার প্রোজেক্ট select করুন
   - বাম সাইডবারে "SQL Editor" ক্লিক করুন

2. **SQL Code Copy করুন:**
   - `MANUAL_PHONE_FIX.sql` ফাইল খুলুন
   - পুরো কোড copy করুন

3. **SQL Editor এ Paste করুন:**
   - SQL Editor এ code paste করুন
   - "RUN" বাটনে ক্লিক করুন

4. **Success Message দেখুন:**
   ```
   Success. No rows returned
   ```

### Method 2: Script চালান

```bash
npm run fix:phone-verification
```

## 🧪 Test করুন

1. **Twilio Test:**
   ```bash
   npm run test:twilio
   ```

2. **Manual Browser Test:**
   - Website এ যান: `http://localhost:5173`
   - একটা account তৈরি করুন
   - Phone Verification এ যান: `/phone-verification`
   - আপনার ফোন নম্বর দিন (যেমন: `01712345678`)

## ⚙️ Environment Variables Check

`.env` ফাইলে এগুলো আছে কিনা check করুন:

```env
VITE_ENABLE_SMS=true
TWILIO_ACCOUNT_SID=ACa720c01d7e884945bbfbbb318206972c
TWILIO_AUTH_TOKEN=a4c83d43958b7466c4793c20a3331e46
TWILIO_PHONE_NUMBER=+16193323473
```

## 📋 Troubleshooting

### Problem 1: Function Already Exists Error
```sql
DROP FUNCTION IF EXISTS public.verify_phone_otp(TEXT, TEXT);
```

### Problem 2: Table Doesn't Exist
```sql
CREATE TABLE IF NOT EXISTS public.phone_verification_attempts (/* table structure */);
```

### Problem 3: Permission Denied
```sql
GRANT EXECUTE ON FUNCTION public.generate_phone_otp(TEXT) TO authenticated;
```

### Problem 4: SMS Not Sending

**Check Twilio Account:**
1. Twilio Console এ যান
2. Account Status check করুন
3. Balance আছে কিনা দেখুন
4. Phone Number verified কিনা check করুন

**Bangladeshi Number Format:**
- ❌ Wrong: `01712345678`
- ❌ Wrong: `8801712345678`
- ✅ Correct: `+8801712345678`

## 🔍 Debug Mode

Development mode এ SMS পাঠানো হয় না। তার বদলে:

1. **Console এ OTP দেখান হবে**
2. **Alert Box এ OTP আসবে** 
3. **Browser Notification আসবে** (যদি permission থাকে)

Production এ real SMS যাবে।

## ✅ Success Indicators

### Database Functions Working:
```bash
✅ generate_phone_otp function working
✅ verify_phone_otp function working
```

### Twilio Connection Working:
```bash
✅ Twilio API connection successful
📞 Account Status: active
💰 Account Balance: $X.XX
```

### SMS Sending Working:
```bash
✅ Test SMS sent successfully!
📨 Message SID: SMXXXXXXXXXXXXXXX
📱 Status: queued/sent/delivered
```

## 🎯 Expected Flow

1. **User enters phone number** → `+8801712345678`
2. **OTP generated** → `123456`
3. **Development:** Alert shows OTP
4. **Production:** SMS sent via Twilio
5. **User enters OTP** → Verification complete
6. **Profile updated** → `phone_verified = true`

## 🆘 Still Having Issues?

1. **Check Supabase Logs:**
   - Dashboard → Logs → Database
   
2. **Check Browser Console:**
   - F12 → Console Tab
   
3. **Check Network Tab:**
   - F12 → Network → Look for failed requests

4. **Try Test Phone Number:**
   - Use your own number for testing
   - Make sure it's verified in Twilio (for trial accounts)

## 📞 Contact

যদি এখনও সমস্যা হয়, এই information দিয়ে help চান:

1. Error message screenshot
2. Browser console logs
3. Supabase function execution logs
4. Test command output

# Supabase Service Key পাওয়ার নিয়ম

## 🔗 Step by Step:

### 1. Supabase Dashboard এ যান
- Link: https://supabase.com/dashboard
- আপনার account দিয়ে login করুন

### 2. আপনার Project Select করুন
- "Diploma Bazar" বা যেটা আপনার project name

### 3. Settings এ যান
- Left sidebar থেকে "Settings" click করুন
- তারপর "API" option এ click করুন

### 4. Service Key Copy করুন
- "Project API keys" section এ দেখবেন
- দুইটা key আছে:
  - `anon` `public` (এটা আগেই আছে)
  - `service_role` `secret` ← **এইটা লাগবে**

### 5. Service Role Key Copy করুন
- `service_role` এর পাশে "Copy" button আছে
- Click করে copy করুন
- এইটা এরকম দেখতে: 
  ```
  eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0OTMxMjUwNCwiZXhwIjoxOTY0ODg4NTA0fQ.abc123xyz...
  ```

## ⚠️ Security Warning:
- এই key অনেক powerful - এটা দিয়ে database এর সব কিছু করা যায়
- কখনো public repository তে commit করবেন না
- শুধুমাত্র server-side code এ use করুন
- Environment variables এ securely store করুন

## 🚀 Usage:
এই key দিয়ে rate limiting system database functions call করতে পারবেন।

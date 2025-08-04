# Push Server Deployment Guide

## সমস্যার সমাধান

আপনার push notification সিস্টেম localhost এ কাজ করে কিন্তু production HTTPS সাইটে কাজ করে না কারণ:

1. **Mixed Content Issue**: HTTPS সাইট HTTP push server এর সাথে communicate করতে পারে না
2. **Environment Variables**: Production এ সঠিক push server URL সেট করা নেই
3. **CORS Issues**: Push server production domain এ CORS configure করা নেই

## সমাধান পদক্ষেপ

### ১. Push Server Deploy করুন

আপনার `push-server.js` ফাইল একটি cloud platform এ deploy করুন:

#### Option A: Railway.app (Recommended)
```bash
# Railway CLI ইনস্টল করুন
npm install -g @railway/cli

# Login করুন
railway login

# Project তৈরি করুন
railway new

# Deploy করুন
railway up
```

#### Option B: Render.com
1. GitHub এ push server code push করুন
2. render.com এ যান
3. "New Web Service" ক্লিক করুন
4. GitHub repo connect করুন
5. Environment variables সেট করুন:
   - `VAPID_PUBLIC_KEY`: BMWlkGwjh9HwFaWD8wUL6jf4BpqQ61OXRoavNxSjdFuLreGQ48Eh1gupEJfVyVR56R7SEjI7VREkHBhucAirFN4
   - `VAPID_PRIVATE_KEY`: WKpz4O_qDPiaoBYqlkljRG4cd--3E5DXqum19jMO5BI
   - `PUSH_PORT`: 4000

#### Option C: Vercel (Serverless)
```bash
npm install -g vercel
vercel --prod
```

### ২. Environment Variables আপডেট করুন

Production build এর জন্য আপনার deployed push server URL দিয়ে `.env.production` ফাইল আপডেট করুন:

```env
VITE_PUSH_SERVER_URL=https://your-push-server.railway.app
# অথবা
VITE_PUSH_SERVER_URL=https://your-push-server.onrender.com
```

### ৩. Push Server এ CORS আপডেট করুন

`push-server.js` ফাইলে CORS configuration আপডেট করুন:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-production-domain.com' // আপনার actual domain
  ],
  credentials: true
}));
```

### ৪. Production Build তৈরি করুন

```bash
npm run build
```

### ৫. Test করুন

1. Production সাইটে যান
2. Browser DevTools খুলুন
3. Console এ push notification logs দেখুন
4. Notification permission দিন
5. Subscribe হয়েছে কিনা চেক করুন

## Debug করার জন্য

Browser DevTools Console এ এই logs দেখুন:

```
🔔 Push notification setup starting...
📋 Registering service worker...
✅ Service worker registered successfully
✅ New subscription created successfully
📤 Sending subscription to server: https://your-server.com
✅ Subscription sent to server successfully
```

## Common Issues এবং Solutions

### Issue 1: "Failed to register service worker"
**Solution**: নিশ্চিত করুন যে আপনার সাইট HTTPS এ চলছে

### Issue 2: "Cannot use localhost push server URL on HTTPS site"
**Solution**: Production push server deploy করুন এবং URL আপডেট করুন

### Issue 3: "CORS error when connecting to push server"
**Solution**: Push server এ production domain CORS এ add করুন

### Issue 4: "Notification permission denied"
**Solution**: Browser settings এ site এর notification permission enable করুন

## Production Checklist

- [ ] Push server cloud platform এ deployed
- [ ] Production environment variables সেট করা
- [ ] CORS production domain এর জন্য configured
- [ ] HTTPS enabled
- [ ] Service worker registered successfully
- [ ] Push subscription created successfully
- [ ] Test notification কাজ করছে

## Environment Variables

### Development (.env)
```env
VITE_PUSH_SERVER_URL=http://localhost:4000
VITE_VAPID_PUBLIC_KEY=BMWlkGwjh9HwFaWD8wUL6jf4BpqQ61OXRoavNxSjdFuLreGQ48Eh1gupEJfVyVR56R7SEjI7VREkHBhucAirFN4
NODE_ENV=development
```

### Production (.env.production)
```env
VITE_PUSH_SERVER_URL=https://your-push-server.onrender.com
VITE_VAPID_PUBLIC_KEY=BMWlkGwjh9HwFaWD8wUL6jf4BpqQ61OXRoavNxSjdFuLreGQ48Eh1gupEJfVyVR56R7SEjI7VREkHBhucAirFN4
NODE_ENV=production
```

## Next Steps

1. আপনার push server কোনো cloud platform এ deploy করুন
2. Production URL দিয়ে `.env.production` আপডেট করুন
3. Production build তৈরি করুন এবং deploy করুন
4. Test করুন

এর পর আপনার push notifications production এ কাজ করবে।

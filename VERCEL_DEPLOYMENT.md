# Vercel Deployment Guide

## 🚀 Complete Vercel Deployment Setup

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy Push Server

```bash
# Navigate to push server directory
cd push-server

# Deploy to Vercel
vercel --prod
```

**Environment Variables for Push Server:**
Set these in Vercel dashboard for push server:
- `VAPID_PUBLIC_KEY`: `BMWlkGwjh9HwFaWD8wUL6jf4BpqQ61OXRoavNxSjdFuLreGQ48Eh1gupEJfVyVR56R7SEjI7VREkHBhucAirFN4`
- `VAPID_PRIVATE_KEY`: `WKpz4O_qDPiaoBYqlkljRG4cd--3E5DXqum19jMO5BI`

### Step 3: Update Push Server URL

After push server deployment, copy the URL from Vercel and update:

1. **Update .env.production:**
   ```env
   VITE_PUSH_SERVER_URL=https://your-actual-push-server-url.vercel.app
   ```

2. **Update push server CORS:**
   In `push-server/index.js`, update the origin array with your frontend URL:
   ```javascript
   const corsOptions = {
     origin: [
       'http://localhost:5173',
       'https://your-frontend-site.vercel.app'  // Add your frontend URL
     ],
     credentials: true,
     optionsSuccessStatus: 200
   };
   ```

### Step 4: Deploy Frontend

```bash
# Go back to project root
cd ..

# Build for production
npm run build:prod

# Deploy to Vercel
vercel --prod
```

### Step 5: Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

```
# Supabase Configuration
VITE_SUPABASE_URL=https://yryerjgidsyfiohmpeoc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyeWVyamdpZHN5ZmlvaG1wZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjA1NTIsImV4cCI6MjA2NjUzNjU1Mn0.S2ki-0QyFabstnVnTh9qFiHoz7sqBZgkfPThn77wTno

# Google OAuth Configuration (REQUIRED for Google Sign-in)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Push Notifications
VITE_VAPID_PUBLIC_KEY=BMWlkGwjh9HwFaWD8wUL6jf4BpqQ61OXRoavNxSjdFuLreGQ48Eh1gupEJfVyVR56R7SEjI7VREkHBhucAirFN4
VAPID_PRIVATE_KEY=WKpz4O_qDPiaoBYqlkljRG4cd--3E5DXqum19jMO5BI

# Other Configuration
VITE_PUSH_SERVER_URL=https://your-push-server-url.vercel.app
JWT_SECRET=boi-chapa-bazar-secure-jwt-token-for-production-change-this
CLIENT_URL=https://diplomabazar.vercel.app
NODE_ENV=production
```

### Step 6: Google OAuth Setup

**6.1 Update Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to APIs & Services → Credentials
4. Edit your OAuth 2.0 Client ID
5. Add to **Authorized JavaScript origins**:
   - `https://diplomabazar.vercel.app`
6. Add to **Authorized redirect URIs**:
   - `https://diplomabazar.vercel.app/auth/callback`
   - `https://yryerjgidsyfiohmpeoc.supabase.co/auth/v1/callback`

**6.2 Update Supabase Dashboard:**
1. Go to [Supabase Dashboard](https://app.supabase.io/)
2. Select your project
3. Navigate to Authentication → Settings
4. Set **Site URL**: `https://diplomabazar.vercel.app`
5. Add to **Redirect URLs**:
   - `https://diplomabazar.vercel.app/**`
6. Navigate to Authentication → Providers → Google
7. Enable Google provider
8. Add your Google Client ID and Client Secret

### Step 7: Test Deployment

1. Visit your deployed frontend URL
2. Test Google Sign-in functionality
3. Test profile completion after login
4. Test notification permissions
5. Check browser console for any errors
6. Test push notifications

## 🛠️ Quick Commands

```bash
# Setup everything
npm run fix:push-notifications:prod

# Deploy push server
cd push-server && vercel --prod

# Deploy frontend
cd .. && npm run build:prod && vercel --prod
```

## 🔧 Troubleshooting

### Issue: Push notifications not working
- Check if push server URL is correct in .env.production
- Verify CORS settings in push server
- Check environment variables in Vercel dashboard

### Issue: Build fails
- Run `npm run build:prod` locally first
- Check if all dependencies are installed
- Verify TypeScript compilation

### Issue: Service worker not registering
- Ensure site is served over HTTPS
- Check browser console for service worker errors
- Verify service-worker.js is accessible

## 📝 Final Checklist

**Basic Deployment:**
- [ ] Push server deployed and accessible
- [ ] Environment variables set in Vercel (including Google OAuth)
- [ ] CORS updated with frontend URL
- [ ] Frontend built and deployed

**Google OAuth Setup:**
- [ ] Google Cloud Console OAuth client configured
- [ ] Authorized JavaScript origins added
- [ ] Authorized redirect URIs added
- [ ] Supabase Google provider enabled
- [ ] Supabase redirect URLs configured

**Testing:**
- [ ] Google Sign-in working
- [ ] Profile completion working
- [ ] Push notifications tested
- [ ] All features working

## 🎉 Success!

Your site should now be fully deployed on Vercel with working push notifications!

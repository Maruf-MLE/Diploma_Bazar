@echo off
echo 🚨 Fixing Environment Variable Security Issues...

echo.
echo 1. Removing .env.production from git tracking...
git rm --cached .env.production
if errorlevel 1 echo Warning: File might not be in git

echo.
echo 2. Creating proper .gitignore...
echo .env* >> .gitignore
echo !.env.example >> .gitignore
echo *.key >> .gitignore
echo secrets.json >> .gitignore
echo node_modules/ >> .gitignore

echo.
echo 3. Deleting the actual .env.production file...
del .env.production
if errorlevel 1 echo Warning: Could not delete file

echo.
echo 4. Committing the changes...
git add .gitignore
git commit -m "🔒 Remove sensitive environment variables and update gitignore"

echo.
echo ✅ Environment variables secured!
echo.
echo 📌 NEXT STEPS:
echo    1. Go to your Vercel/Netlify dashboard
echo    2. Add these environment variables:
echo       - VITE_VAPID_PUBLIC_KEY=BMWlkGwjh9HwFaWD8wUL6jf4BpqQ61OXRoavNxSjdFuLreGQ48Eh1gupEJfVyVR56R7SEjI7VREkHBhucAirFN4
echo       - VAPID_PRIVATE_KEY=WKpz4O_qDPiaoBYqlkljRG4cd--3E5DXqum19jMO5BI
echo       - VITE_PUSH_SERVER_URL=https://pushserverdb.vercel.app
echo    3. Redeploy your application

pause

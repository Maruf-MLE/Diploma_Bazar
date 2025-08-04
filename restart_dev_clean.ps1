# Clean restart for development server
Write-Host "🧹 Cleaning development environment..." -ForegroundColor Yellow

# Kill any existing dev server processes
Write-Host "🔪 Stopping existing processes..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*" -or $_.CommandLine -like "*dev*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear Vite cache
Write-Host "🗑️ Clearing Vite cache..." -ForegroundColor Cyan
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
}

# Clear dist folder if exists
Write-Host "🗑️ Clearing dist folder..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Clear package-lock.json temporary files
Write-Host "🗑️ Clearing temporary files..." -ForegroundColor Cyan
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite"
}

Write-Host "✅ Cleanup completed!" -ForegroundColor Green

# Reinstall dependencies if needed
Write-Host "📦 Checking dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "1. Wait for server to start" -ForegroundColor White
Write-Host "2. Open http://localhost:8081 in browser" -ForegroundColor White  
Write-Host "3. Press Ctrl+Shift+R to hard refresh" -ForegroundColor White
Write-Host "4. Check console for any remaining errors" -ForegroundColor White

# Start dev server
npm run dev

# Simple Rate Limit Test - 100 requests like Python version
$url = "https://diplomabazar.vercel.app/api/test"
$success = 0
$rateLimit = 0
$other = 0

Write-Host "Testing rate limit with 100 requests to: $url" -ForegroundColor Cyan
Write-Host "Expected: First 50 should succeed, rest should get 429" -ForegroundColor Yellow

for ($i = 1; $i -le 100; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -ErrorAction Stop
        $status = $response.StatusCode
        
        if ($status -eq 200) {
            $success++
            Write-Host "Request $i : Status $status (SUCCESS)" -ForegroundColor Green
        }
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        
        if ($status -eq 429) {
            $rateLimit++
            Write-Host "Request $i : Status $status (RATE LIMITED)" -ForegroundColor Red
        }
        else {
            $other++
            Write-Host "Request $i : Status $status (OTHER ERROR)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n=== RESULTS ===" -ForegroundColor Cyan
Write-Host "✅ Success (200): $success" -ForegroundColor Green  
Write-Host "🚫 Rate Limited (429): $rateLimit" -ForegroundColor Red
Write-Host "⚠️  Other Errors: $other" -ForegroundColor Yellow

if ($rateLimit -gt 0) {
    Write-Host "`n🎉 RATE LIMITING IS WORKING!" -ForegroundColor Green
    Write-Host "Got $success successful requests and $rateLimit rate-limited requests" -ForegroundColor Green
} else {
    Write-Host "`n❌ Rate limiting may not be working - all requests succeeded" -ForegroundColor Red
}

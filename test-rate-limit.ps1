# Rate Limiting Test PowerShell Script

Write-Host "🚀 Testing Rate Limiting..." -ForegroundColor Green
Write-Host "Making 60 rapid requests to /api/test endpoint" -ForegroundColor Yellow

$successCount = 0
$rateLimitCount = 0
$errorCount = 0

for ($i = 1; $i -le 60; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test" -Method GET -TimeoutSec 5
        
        if ($response.StatusCode -eq 200) {
            $successCount++
            Write-Host "Request $i : ✅ SUCCESS (200)" -ForegroundColor Green
            
            # Check for rate limit headers
            $rateLimitHeaders = @{}
            foreach ($header in $response.Headers.Keys) {
                if ($header -like "*ratelimit*" -or $header -like "*rate-limit*") {
                    $rateLimitHeaders[$header] = $response.Headers[$header]
                }
            }
            
            if ($rateLimitHeaders.Count -gt 0) {
                Write-Host "   Rate Limit Headers: $($rateLimitHeaders | ConvertTo-Json -Compress)" -ForegroundColor Cyan
            }
        }
        elseif ($response.StatusCode -eq 429) {
            $rateLimitCount++
            Write-Host "Request $i : 🚫 RATE LIMITED (429)" -ForegroundColor Red
            Write-Host "   Headers: $($response.Headers | ConvertTo-Json -Compress)" -ForegroundColor Yellow
            break  # Stop after first rate limit
        }
        else {
            $errorCount++
            Write-Host "Request $i : ❌ ERROR ($($response.StatusCode))" -ForegroundColor Red
        }
    }
    catch {
        # Check if it's a 429 error
        if ($_.Exception.Response.StatusCode -eq 429) {
            $rateLimitCount++
            Write-Host "Request $i : 🚫 RATE LIMITED (429)" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
            break  # Stop after first rate limit
        }
        else {
            $errorCount++
            Write-Host "Request $i : ❌ ERROR - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Small delay between requests
    Start-Sleep -Milliseconds 50
    
    # Show progress every 10 requests
    if ($i % 10 -eq 0) {
        Write-Host "📊 Progress: $i/60 - Success: $successCount, Rate Limited: $rateLimitCount, Errors: $errorCount" -ForegroundColor Magenta
    }
}

Write-Host ""
Write-Host "🎯 FINAL RESULTS:" -ForegroundColor Green
Write-Host "✅ Successful Requests: $successCount" -ForegroundColor Green
Write-Host "🚫 Rate Limited Requests: $rateLimitCount" -ForegroundColor Red
Write-Host "❌ Error Requests: $errorCount" -ForegroundColor Yellow

if ($rateLimitCount -gt 0) {
    Write-Host "🛡️  SUCCESS: Rate limiting is working correctly!" -ForegroundColor Green
    Write-Host "   Your production API is protected against abuse." -ForegroundColor Green
}
elseif ($successCount -eq 60) {
    Write-Host "⚠️  ATTENTION: All 60 requests succeeded" -ForegroundColor Yellow
    Write-Host "   Rate limits may need to be adjusted." -ForegroundColor Yellow
}
else {
    Write-Host "❌ ISSUES: Some requests failed for other reasons" -ForegroundColor Red
}

Write-Host ""
Write-Host "Check the server logs for detailed rate limiting information." -ForegroundColor Cyan

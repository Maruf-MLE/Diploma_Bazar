import requests
import time

url = "https://diplomabazar.vercel.app/api/test"  # Correct endpoint

print("🐍 PYTHON RATE LIMITING TEST")
print("=" * 50)

success_count = 0
blocked_count = 0
error_count = 0

for i in range(1, 101):  # 100 টা রিকোয়েস্ট
    try:
        start_time = time.time()
        r = requests.get(url, timeout=10)
        response_time = time.time() - start_time
        
        # Check rate limit headers
        remaining = r.headers.get('x-ratelimit-remaining', 'N/A')
        limit = r.headers.get('x-ratelimit-limit', 'N/A')
        reset_time = r.headers.get('x-ratelimit-reset', 'N/A')
        
        if r.status_code == 200:
            success_count += 1
            print(f"✅ Request {i}: Status {r.status_code} - Remaining: {remaining}/{limit} - Time: {response_time:.2f}s")
            
            # Show warning when close to limit
            if remaining != 'N/A' and int(remaining) <= 5:
                print(f"   ⚠️  WARNING: Only {remaining} requests remaining!")
                
        elif r.status_code == 429:
            blocked_count += 1
            print(f"🚫 Request {i}: Status {r.status_code} - RATE LIMITED!")
            print(f"   Retry-After: {r.headers.get('retry-after', 'N/A')}")
            print(f"   Reset: {reset_time}")
            
            # Show response content
            try:
                response_data = r.json()
                print(f"   Current: {response_data.get('current', {})}")
            except:
                pass
                
            # Stop after a few rate limits to avoid spam
            if blocked_count >= 5:
                print(f"   🛑 Stopping after {blocked_count} rate limits")
                break
                
        else:
            error_count += 1
            print(f"❌ Request {i}: Status {r.status_code} - ERROR")
            
    except requests.exceptions.RequestException as e:
        error_count += 1
        print(f"❌ Request {i}: ERROR - {e}")
    
    # Small delay to see rate limiting in action
    time.sleep(0.1)

print("\n" + "=" * 50)
print("📊 PYTHON TEST RESULTS")
print("=" * 50)
print(f"✅ Successful Requests: {success_count}")
print(f"🚫 Rate Limited Requests: {blocked_count}")
print(f"❌ Error Requests: {error_count}")
print(f"📋 Total Requests Sent: {success_count + blocked_count + error_count}")

if blocked_count > 0:
    print(f"\n✅✅✅ RATE LIMITING IS WORKING! ✅✅✅")
    print(f"🛡️  Rate limit triggered after {success_count} successful requests")
    print("Your API is protected from abuse!")
else:
    print(f"\n⚠️  RATE LIMITING MAY NOT BE WORKING")
    print(f"🤔 {success_count} requests succeeded without rate limiting")
    print("This could indicate a configuration issue.")

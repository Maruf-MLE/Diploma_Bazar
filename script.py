import requests

url = "https://diplomabazar.vercel.app/api/test"   # এখানে তোমার API endpoint দাও

for i in range(1, 101):  # 100 টা রিকোয়েস্ট
    r = requests.get(url)
    print(f"Request {i}: Status {r.status_code}")

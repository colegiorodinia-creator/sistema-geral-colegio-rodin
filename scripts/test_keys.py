import urllib.request
import urllib.error
import json

url = "https://jhjzyoztidfwzqeblhco.supabase.co/rest/v1/profiles?select=*"
publishable_key = "sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo"

headers = {
    "apikey": publishable_key,
    "Authorization": f"Bearer {publishable_key}",
    "User-Agent": "Mozilla/5.0"
}

try:
    req = urllib.request.Request(url, headers=headers)
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode('utf-8'))
    print("SUCCESS with publishable_key!")
    print(f"Status: {res.status}")
    print(f"Profiles found: {len(data)}")
    if data:
        print("First profile sample:", data[0])
except Exception as e:
    print("Error with publishable_key:", e)

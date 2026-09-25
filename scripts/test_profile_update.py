import urllib.request
import urllib.error
import json

url = "https://jhjzyoztidfwzqeblhco.supabase.co/rest/v1/profiles?id=eq.a0000000-0000-0000-0000-000000000009"
key = "sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
    "User-Agent": "Mozilla/5.0"
}

payload = json.dumps({
    "name": "Elisangela Cordeiro Santos Teste",
}).encode('utf-8')

try:
    req = urllib.request.Request(url, data=payload, headers=headers, method='PATCH')
    res = urllib.request.urlopen(req)
    result = json.loads(res.read().decode('utf-8'))
    print("PATCH Status:", res.status)
    print("Updated profile result:", result)
except Exception as e:
    print("PATCH Error:", e)

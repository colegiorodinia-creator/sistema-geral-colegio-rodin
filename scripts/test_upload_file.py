import urllib.request
import urllib.error
import json

url = "https://jhjzyoztidfwzqeblhco.supabase.co/storage/v1/object/avatars/test_avatar.png"
key = "sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo"

# 1x1 transparent PNG
png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x03\x00\x05\xfe\x02\xfe\xa7\x35\x81\x84\x00\x00\x00\x00IEND\xaeB`\x82'

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "image/png",
    "x-upsert": "true",
    "User-Agent": "Mozilla/5.0"
}

try:
    req = urllib.request.Request(url, data=png_bytes, headers=headers, method='POST')
    res = urllib.request.urlopen(req)
    result = json.loads(res.read().decode('utf-8'))
    print("Storage Upload Status:", res.status)
    print("Response:", result)
    print("Public URL:", "https://jhjzyoztidfwzqeblhco.supabase.co/storage/v1/object/public/avatars/test_avatar.png")
except Exception as e:
    print("Upload Error:", e)

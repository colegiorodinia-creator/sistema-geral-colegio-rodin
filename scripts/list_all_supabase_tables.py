import urllib.request
import json

url = "https://jhjzyoztidfwzqeblhco.supabase.co/rest/v1/"
key = "sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "User-Agent": "Mozilla/5.0"
}

try:
    req = urllib.request.Request(url, headers=headers)
    res = urllib.request.urlopen(req)
    swagger = json.loads(res.read().decode('utf-8'))
    print("Tables found in OpenAPI definition:")
    for path in swagger.get('definitions', {}).keys():
        print(" -", path)
except Exception as e:
    print("Error listing tables:", e)

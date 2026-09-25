import urllib.request
import json

url_base = "https://jhjzyoztidfwzqeblhco.supabase.co/rest/v1"
key = "sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "User-Agent": "Mozilla/5.0"
}

tables = ["students", "student_guardians", "enrollments", "contracts"]

for table in tables:
    try:
        req = urllib.request.Request(f"{url_base}/{table}?select=*&limit=1", headers=headers)
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        print(f"Table '{table}' status: OK ({len(data)} rows previewed)")
    except Exception as e:
        print(f"Table '{table}' error:", e)

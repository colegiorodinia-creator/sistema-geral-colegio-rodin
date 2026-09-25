import urllib.request
import json

url_base = "https://jhjzyoztidfwzqeblhco.supabase.co/rest/v1"
key = "sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "User-Agent": "Mozilla/5.0"
}

for table in ["students", "student_guardians", "enrollments"]:
    try:
        req = urllib.request.Request(f"{url_base}/{table}?select=*&limit=1", headers=headers)
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        print(f"=== {table.upper()} SCHEMA ===")
        if data:
            print(list(data[0].keys()))
        else:
            print("No rows, fetching columns metadata...")
    except Exception as e:
        print(f"Error on {table}:", e)

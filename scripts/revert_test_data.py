import urllib.request
import json

url_base = "https://jhjzyoztidfwzqeblhco.supabase.co/rest/v1"
key = "sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
    "User-Agent": "Mozilla/5.0"
}

# Revert student
student_payload = {
    "birth_city": "Indaiatuba - SP"
}
req1 = urllib.request.Request(f"{url_base}/students?rm_number=eq.2560", data=json.dumps(student_payload).encode('utf-8'), headers=headers, method='PATCH')
urllib.request.urlopen(req1)

# Revert guardian
guardian_payload = {
    "name": "Wanderson Pedro de Almeida",
    "occupation": "Gerente de Contas",
    "address_complement": "Casa 1"
}
req2 = urllib.request.Request(f"{url_base}/guardians?cpf=eq.57.786.608-4", data=json.dumps(guardian_payload).encode('utf-8'), headers=headers, method='PATCH')
urllib.request.urlopen(req2)

print("Data reverted cleanly!")

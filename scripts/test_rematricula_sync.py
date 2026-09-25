import urllib.request
import urllib.error
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

# 1. Upsert Student (Bruno Fialho de Almeida - RM 2560)
student_payload = {
    "rm_number": "2560",
    "coc_code": "2560",
    "name": "Bruno Fialho de Almeida (Teste Sync)",
    "enrollment_code": "RM 2560",
    "gender": "Masc.",
    "birth_date": "2015-03-28",
    "birth_city": "Indaiatuba - SP",
    "nationality": "Brasileiro(a)",
    "rg": "67.246.698-3",
    "rg_issuer": "SSP/SP",
    "rg_issue_date": "2021-08-23",
    "cpf": "510.866.158-40",
    "student_phone": "(19) 98120-6515",
    "course_level": "Ensino Fundamental",
    "current_grade": "6º Ano EF",
    "school_shift": "Manhã"
}

try:
    # Check if student exists
    req = urllib.request.Request(f"{url_base}/students?rm_number=eq.2560", headers=headers)
    res = urllib.request.urlopen(req)
    existing_students = json.loads(res.read().decode('utf-8'))
    
    if existing_students:
        std_id = existing_students[0]['id']
        req_up = urllib.request.Request(f"{url_base}/students?id=eq.{std_id}", data=json.dumps(student_payload).encode('utf-8'), headers=headers, method='PATCH')
        res_up = urllib.request.urlopen(req_up)
        student_res = json.loads(res_up.read().decode('utf-8'))
        print("Student PATCH success:", student_res[0]['name'])
    else:
        req_in = urllib.request.Request(f"{url_base}/students", data=json.dumps(student_payload).encode('utf-8'), headers=headers, method='POST')
        res_in = urllib.request.urlopen(req_in)
        student_res = json.loads(res_in.read().decode('utf-8'))
        std_id = student_res[0]['id']
        print("Student POST success:", student_res[0]['name'])
except Exception as e:
    print("Student Sync Error:", e)

# 2. Revert student name back to original
try:
    student_payload['name'] = "Bruno Fialho de Almeida"
    req_revert = urllib.request.Request(f"{url_base}/students?rm_number=eq.2560", data=json.dumps(student_payload).encode('utf-8'), headers=headers, method='PATCH')
    urllib.request.urlopen(req_revert)
    print("Student name reverted cleanly!")
except Exception as e:
    print("Revert Error:", e)

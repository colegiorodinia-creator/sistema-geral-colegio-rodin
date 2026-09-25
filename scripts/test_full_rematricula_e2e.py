import urllib.request
import urllib.error
import json
import time

url_base = "https://jhjzyoztidfwzqeblhco.supabase.co/rest/v1"
key = "sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
    "User-Agent": "Mozilla/5.0"
}

print("=" * 70)
print("TESTE COMPLETO DE REMATRÍCULA — SINCRONIZAÇÃO EM TEMPO REAL COM SUPABASE")
print("=" * 70)

# 1. Simular Alterações no Formulário pelo Pai (RM 2560 - Bruno Fialho de Almeida)
test_data = {
    "rmNumber": "2560",
    "studentName": "Bruno Fialho de Almeida",
    "studentGender": "Masc.",
    "studentBirthDate": "2015-03-28",
    "studentBirthCity": "Indaiatuba - SP (Atualizado)",
    "studentNationality": "Brasileiro(a)",
    "studentRg": "67.246.698-3",
    "studentRgIssuer": "SSP/SP",
    "studentRgIssueDate": "2021-08-23",
    "studentCpf": "510.866.158-40",
    "studentPhone": "(19) 98120-6515",
    "courseLevel": "Ensino Fundamental",
    "currentGrade": "6º Ano EF",
    "schoolShift": "Manhã",
    
    # Responsável Wanderson
    "guardianName": "Wanderson Pedro de Almeida (Atualizado)",
    "guardianRelation": "Pai",
    "guardianGender": "Masc.",
    "guardianBirthDate": "1982-05-11",
    "guardianOccupation": "Gerente de Contas Executivo",
    "guardianMaritalStatus": "Casado(a)",
    "guardianRg": "34.602.083",
    "guardianRgIssuer": "SSP/SP",
    "guardianCpf": "57.786.608-4",
    "guardianNationality": "Brasileiro(a)",
    "guardianEmail": "wpalmeida@hotmail.com",
    "guardianPhone": "(19) 98120-6515",
    "guardianLandline": "(19) 3875-1100",
    "guardianAddressCep": "13340-385",
    "guardianAddressStreet": "Rua Almerinda Benedita Pacheco de Alcantara",
    "guardianAddressNumber": "160",
    "guardianAddressComplement": "Casa 1 - Bloco A",
    "guardianAddressNeighborhood": "Jardim Jequitibá",
    "guardianAddressCity": "Indaiatuba",
    "guardianAddressState": "SP"
}

print("1. Enviando alterações do formulário de rematrícula para o Supabase...")

# A. Atualizar/Inserir Aluno
student_payload = {
    "rm_number": test_data["rmNumber"],
    "coc_code": test_data["rmNumber"],
    "name": test_data["studentName"],
    "enrollment_code": f"RM {test_data['rmNumber']}",
    "gender": test_data["studentGender"],
    "birth_date": test_data["studentBirthDate"],
    "birth_city": test_data["studentBirthCity"],
    "nationality": test_data["studentNationality"],
    "rg": test_data["studentRg"],
    "rg_issuer": test_data["studentRgIssuer"],
    "rg_issue_date": test_data["studentRgIssueDate"],
    "cpf": test_data["studentCpf"],
    "student_phone": test_data["studentPhone"],
    "course_level": test_data["courseLevel"],
    "current_grade": test_data["currentGrade"],
    "school_shift": test_data["schoolShift"]
}

req = urllib.request.Request(f"{url_base}/students?rm_number=eq.{test_data['rmNumber']}", headers=headers)
res = urllib.request.urlopen(req)
existing_stds = json.loads(res.read().decode('utf-8'))
if existing_stds:
    std_id = existing_stds[0]['id']
    req_patch = urllib.request.Request(f"{url_base}/students?id=eq.{std_id}", data=json.dumps(student_payload).encode('utf-8'), headers=headers, method='PATCH')
    res_patch = urllib.request.urlopen(req_patch)
    print("   [OK] Tabela 'students' atualizada com sucesso no Supabase!")
else:
    req_post = urllib.request.Request(f"{url_base}/students", data=json.dumps(student_payload).encode('utf-8'), headers=headers, method='POST')
    res_post = urllib.request.urlopen(req_post)
    std_id = json.loads(res_post.read().decode('utf-8'))[0]['id']
    print("   [OK] Tabela 'students' criada com sucesso no Supabase!")

# B. Atualizar/Inserir Responsável
guardian_payload = {
    "name": test_data["guardianName"],
    "kinship_relation": test_data["guardianRelation"],
    "cpf": test_data["guardianCpf"],
    "rg": test_data["guardianRg"],
    "rg_issuer": test_data["guardianRgIssuer"],
    "birth_date": test_data["guardianBirthDate"],
    "occupation": test_data["guardianOccupation"],
    "marital_status": test_data["guardianMaritalStatus"],
    "nationality": test_data["guardianNationality"],
    "email": test_data["guardianEmail"],
    "phone_mobile": test_data["guardianPhone"],
    "phone_landline": test_data["guardianLandline"],
    "address_cep": test_data["guardianAddressCep"],
    "address_street": test_data["guardianAddressStreet"],
    "address_number": test_data["guardianAddressNumber"],
    "address_complement": test_data["guardianAddressComplement"],
    "address_neighborhood": test_data["guardianAddressNeighborhood"],
    "address_city": test_data["guardianAddressCity"],
    "address_state": test_data["guardianAddressState"]
}

req_g = urllib.request.Request(f"{url_base}/guardians?cpf=eq.{test_data['guardianCpf']}", headers=headers)
res_g = urllib.request.urlopen(req_g)
existing_g = json.loads(res_g.read().decode('utf-8'))
if existing_g:
    g_id = existing_g[0]['id']
    req_g_patch = urllib.request.Request(f"{url_base}/guardians?id=eq.{g_id}", data=json.dumps(guardian_payload).encode('utf-8'), headers=headers, method='PATCH')
    urllib.request.urlopen(req_g_patch)
    print("   [OK] Tabela 'guardians' atualizada com sucesso no Supabase!")
else:
    req_g_post = urllib.request.Request(f"{url_base}/guardians", data=json.dumps(guardian_payload).encode('utf-8'), headers=headers, method='POST')
    res_g_post = urllib.request.urlopen(req_g_post)
    g_id = json.loads(res_g_post.read().decode('utf-8'))[0]['id']
    print("   [OK] Tabela 'guardians' criada com sucesso no Supabase!")

# 2. Consultar o banco de dados Supabase para VALIDAR que as alterações foram persisitidas
print("\n2. Consultando o banco do Supabase para conferência dos dados gravados...")

req_check_s = urllib.request.Request(f"{url_base}/students?rm_number=eq.2560", headers=headers)
check_s = json.loads(urllib.request.urlopen(req_check_s).read().decode('utf-8'))[0]

req_check_g = urllib.request.Request(f"{url_base}/guardians?cpf=eq.57.786.608-4", headers=headers)
check_g = json.loads(urllib.request.urlopen(req_check_g).read().decode('utf-8'))[0]

print("\n--- DADOS CONFIRMADOS NO SUPABASE ---")
print(f"Estudante: {check_s['name']} (RM: {check_s['rm_number']})")
print(f"Naturalidade Estudante: {check_s['birth_city']}")
print(f"Responsável: {check_g['name']} (CPF: {check_g['cpf']})")
print(f"Ocupação Responsável: {check_g['occupation']}")
print(f"Complemento Endereço: {check_g['address_complement']}")
print("=" * 70)

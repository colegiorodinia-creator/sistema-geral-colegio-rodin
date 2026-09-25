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

guardian_payload = {
    "name": "Wanderson Pedro de Almeida (Teste Sync)",
    "kinship_relation": "Pai",
    "cpf": "57.786.608-4",
    "rg": "34.602.083",
    "rg_issuer": "SSP/SP",
    "birth_date": "1982-05-11",
    "occupation": "Gerente de Contas",
    "marital_status": "Casado(a)",
    "nationality": "Brasileiro(a)",
    "email": "wpalmeida@hotmail.com",
    "phone_mobile": "(19) 98120-6515",
    "address_cep": "13340-385",
    "address_street": "Rua Almerinda Benedita Pacheco de Alcantara",
    "address_number": "160",
    "address_complement": "Casa 1",
    "address_neighborhood": "Jardim Jequitibá",
    "address_city": "Indaiatuba",
    "address_state": "SP"
}

try:
    req = urllib.request.Request(f"{url_base}/guardians?cpf=eq.57.786.608-4", headers=headers)
    res = urllib.request.urlopen(req)
    existing = json.loads(res.read().decode('utf-8'))
    
    if existing:
        gid = existing[0]['id']
        req_up = urllib.request.Request(f"{url_base}/guardians?id=eq.{gid}", data=json.dumps(guardian_payload).encode('utf-8'), headers=headers, method='PATCH')
        res_up = urllib.request.urlopen(req_up)
        print("Guardian PATCH success:", json.loads(res_up.read().decode('utf-8'))[0]['name'])
    else:
        req_in = urllib.request.Request(f"{url_base}/guardians", data=json.dumps(guardian_payload).encode('utf-8'), headers=headers, method='POST')
        res_in = urllib.request.urlopen(req_in)
        print("Guardian POST success:", json.loads(res_in.read().decode('utf-8'))[0]['name'])
except Exception as e:
    print("Guardian Sync Error:", e)

# Revert guardian name
try:
    guardian_payload['name'] = "Wanderson Pedro de Almeida"
    req_revert = urllib.request.Request(f"{url_base}/guardians?cpf=eq.57.786.608-4", data=json.dumps(guardian_payload).encode('utf-8'), headers=headers, method='PATCH')
    urllib.request.urlopen(req_revert)
    print("Guardian name reverted cleanly!")
except Exception as e:
    print("Revert Error:", e)

# -*- coding: utf-8 -*-
"""
Enforce exact grades from spreadsheet 'DESCONTOS REMATRÍCULAS 2027 COM ANUIDADE (1).xlsx'
Regra Inegociável:
- O aluno que está na aba '8º ANO EF 2027' vai para o 8º ANO EF em 2027 (sua série atual em 2026 é 7º Ano EF).
- O aluno que está na aba '7º ANO EF 2027' vai para o 7º ANO EF em 2027 (sua série atual em 2026 é 6º Ano EF).
- O aluno que está na aba '9º ANO EF 2027' vai para o 9º ANO EF em 2027 (sua série atual em 2026 é 8º Ano EF).
- O aluno que está na aba '1º SÉRIE EM 2027' vai para o 1ª SÉRIE EM em 2027 (sua série atual em 2026 é 9º Ano EF).
- O aluno que está na aba '2ª SÉRIE EM 2027' vai para o 2ª SÉRIE EM em 2027 (sua série atual em 2026 é 1ª Série EM).
- O aluno que está na aba '3ª SÉRIE EM 2027' vai para o 3ª SÉRIE EM em 2027 (sua série atual em 2026 é 2ª Série EM).
- O aluno que está na aba 'PPV' vai para o Pré-Vestibular (PPV) em 2027 (sua série atual em 2026 é 3ª Série EM).
"""

import openpyxl, json, os, re, sys, unicodedata

sys.stdout.reconfigure(encoding='utf-8')

def norm(text):
    if not text: return ''
    s = unicodedata.normalize('NFKD', str(text)).encode('ASCII', 'ignore').decode('utf-8')
    s = re.sub(r'[^A-Z0-9 ]', '', s.upper())
    return ' '.join(s.split())

target_file = None
for f in os.listdir('.'):
    if f.endswith('.xlsx') and 'DESCONTOS' in f.upper() and '2027' in f:
        target_file = f
        break

if not target_file:
    print("❌ Planilha não encontrada!")
    sys.exit(1)

wb = openpyxl.load_workbook(target_file, data_only=True)

sheet_info_by_rm = {}
sheet_info_by_name = {}

for sheet in wb.sheetnames:
    ws = wb[sheet]
    grade_clean = sheet.replace(' 2027', '').strip()
    
    if '7' in grade_clean:
        current_2026 = '6º Ano EF'
        target_2027 = '7º Ano EF'
        course_level = 'Ensino Fundamental'
    elif '8' in grade_clean:
        current_2026 = '7º Ano EF'
        target_2027 = '8º Ano EF'
        course_level = 'Ensino Fundamental'
    elif '9' in grade_clean:
        current_2026 = '8º Ano EF'
        target_2027 = '9º Ano EF'
        course_level = 'Ensino Fundamental'
    elif '1º' in grade_clean or '1ª' in grade_clean or '1' in grade_clean:
        current_2026 = '9º Ano EF'
        target_2027 = '1ª Série EM'
        course_level = 'Ensino Médio'
    elif '2ª' in grade_clean or '2' in grade_clean:
        current_2026 = '1ª Série EM'
        target_2027 = '2ª Série EM'
        course_level = 'Ensino Médio'
    elif '3ª' in grade_clean or '3' in grade_clean:
        current_2026 = '2ª Série EM'
        target_2027 = '3ª Série EM'
        course_level = 'Ensino Médio'
    elif 'PPV' in grade_clean:
        current_2026 = '3ª Série EM'
        target_2027 = 'Pré-Vestibular (PPV)'
        course_level = 'Ensino Médio'
    else:
        current_2026 = grade_clean
        target_2027 = grade_clean
        course_level = 'Ensino Fundamental'
        
    for r in range(3, ws.max_row + 1):
        nome = ws.cell(r, 4).value
        if not nome or any(t in str(nome).upper() for t in ['TOTAL', 'VALOR']):
            continue
        rm = str(ws.cell(r, 3).value or '').strip()
        rm_clean = str(int(re.sub(r'\D', '', rm))) if re.sub(r'\D', '', rm) else ''
        
        info = {
            'sheet': sheet,
            'current_2026': current_2026,
            'target_2027': target_2027,
            'course_level': course_level,
            'nome': str(nome).strip()
        }
        if rm_clean:
            sheet_info_by_rm[rm_clean] = info
        sheet_info_by_name[norm(nome)] = info

print(f"Total de registros na planilha: {len(sheet_info_by_rm)}")

# Atualizar students2027Data.json
with open('src/data/students2027Data.json', 'r', encoding='utf-8') as f:
    students = json.load(f)

for s in students:
    rm = str(s.get('rm_numero') or s.get('coc_code') or '').strip()
    rm_clean = str(int(re.sub(r'\D', '', rm))) if re.sub(r'\D', '', rm) else ''
    nome_norm = norm(s.get('nome_completo_estudante'))
    
    info = sheet_info_by_rm.get(rm_clean) or sheet_info_by_name.get(nome_norm)
    if info:
        s['serie_ano_atual'] = info['current_2026']
        s['nova_serie_ano_2027'] = info['target_2027']
        s['nivel_ensino'] = info['course_level']
    else:
        # Se for concluinte da 3ª série não rematriculado
        if s.get('nova_serie_ano_2027') == 'Concluinte' or '3ª' in str(s.get('serie_ano_atual')):
            s['serie_ano_atual'] = '3ª Série EM'
            s['nova_serie_ano_2027'] = 'Concluinte'
            s['nivel_ensino'] = 'Ensino Médio'

# Limpar caracteres corrompidos U+FFFD em todos os campos de texto
def clean_obj(obj):
    if isinstance(obj, str):
        return obj.replace('\ufffd', 'º')
    elif isinstance(obj, list):
        return [clean_obj(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: clean_obj(v) for k, v in obj.items()}
    return obj

students = clean_obj(students)

with open('src/data/students2027Data.json', 'w', encoding='utf-8') as f:
    json.dump(students, f, ensure_ascii=False, indent=2)
print("✅ students2027Data.json atualizado com séries exatas da planilha!")

# Agora regerar initialData2027.js
with open('src/data/initialData2027.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Ler classes
import re
classes_match = re.search(r'export const ALL_CLASSES_2027 = (\[.*?\]);', text, re.DOTALL)
all_classes_list = json.loads(classes_match.group(1)) if classes_match else []

all_students_list = []
all_enrollments_list = []

for s in students:
    rm = str(s.get('rm_numero') or s.get('coc_code') or '').strip()
    is_concluinte = (s.get('nova_serie_ano_2027') == 'Concluinte' or s.get('status_rematricula_2027') == 'Concluiu')
    
    resp_bdate = s.get('data_nascimento_responsavel', '')
    if '/' in resp_bdate:
        parts = resp_bdate.split('/')
        if len(parts) == 3:
            resp_bdate = f"{parts[2]}-{parts[1]}-{parts[0]}"
            
    std_obj = {
        "id": f"std-{rm}",
        "rm": rm,
        "rmNumber": rm,
        "cocCode": rm,
        "name": s['nome_completo_estudante'],
        "studentName": s['nome_completo_estudante'],
        "gender": s.get('sexo_estudante', 'Masc.'),
        "birthDate": s.get('data_nascimento_estudante', ''),
        "birthCity": s.get('naturalidade_cidade', 'Indaiatuba'),
        "nationality": s.get('nacionalidade_estudante', 'Brasileira'),
        "rg": s.get('rg_estudante', ''),
        "rgIssuer": s.get('orgao_emissor_rg_estudante', 'SSP/SP'),
        "rgIssueDate": s.get('data_emissao_rg_estudante', ''),
        "cpf": s.get('cpf_estudante', ''),
        "studentCpf": s.get('cpf_estudante', ''),
        "studentPhone": s.get('celular_whatsapp_estudante', ''),
        "courseLevel": s.get('nivel_ensino', 'Ensino Fundamental'),
        "currentGrade": s.get('serie_ano_atual', ''),
        "newGrade2027": s.get('nova_serie_ano_2027', ''),
        "classGroup": s.get('turma', 'A'),
        "schoolShift": s.get('periodo_turno', 'Manhã'),
        "schoolUnit": "Colégio Rodin - Indaiatuba",
        "condition": "Normal",
        "medicalAllergies": "Nenhuma restrição cadastrada.",
        "emergencyContact": s.get('celular_whatsapp_responsavel', ''),
        "photoUrl": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
        "attendanceRate": "98%",
        "is_le_perini": s.get('is_le_perini', False),
        "percentual_desconto_2027": s.get('percentual_desconto_2027', 0),
        "valor_nominal_anuidade_2027": s.get('valor_nominal_anuidade_2027', 0),
        "valor_total_anuidade_2027": s.get('valor_total_anuidade_2027', 0),
        "valor_1a_parcela_2027": s.get('valor_1a_parcela_2027', 0),
        "valor_demais_parcelas_2027": s.get('valor_demais_parcelas_2027', 0),
        "tipo_desconto_2027": s.get('tipo_desconto_2027', 'Sem desconto'),
        "observacao_desconto_2027": s.get('observacao_desconto_2027', ''),
        "desconto_2026_detalhes": s.get('desconto_2026_detalhes', ''),
        "plano_pagamento_anuidade_2027": s.get('plano_pagamento_anuidade_2027', 13),
        "guardians": [
            {
                "id": f"g-{rm}-1",
                "name": s.get('nome_responsavel_financeiro', ''),
                "guardianName": s.get('nome_responsavel_financeiro', ''),
                "kinshipRelation": s.get('parentesco_responsavel', 'Responsável'),
                "guardianRelation": s.get('parentesco_responsavel', 'Responsável'),
                "gender": s.get('sexo_responsavel', 'Fem.'),
                "cpf": s.get('cpf_responsavel_financeiro', ''),
                "rg": s.get('rg_responsavel', ''),
                "rgIssuer": s.get('orgao_emissor_rg_responsavel', 'SSP/SP'),
                "birthDate": resp_bdate,
                "occupation": s.get('profissao_responsavel', ''),
                "maritalStatus": s.get('estado_civil_responsavel', 'Casado(a)'),
                "nationality": s.get('nacionalidade_responsavel', 'Brasileira'),
                "email": s.get('email_responsavel', ''),
                "phoneMobile": s.get('celular_whatsapp_responsavel', ''),
                "phoneLandline": "",
                "addressCep": s.get('cep_endereco', ''),
                "addressStreet": s.get('logradouro_endereco', ''),
                "addressNumber": s.get('numero_endereco', ''),
                "addressComplement": s.get('complemento_endereco', ''),
                "addressNeighborhood": s.get('bairro_endereco', ''),
                "addressCity": s.get('cidade_endereco', 'Indaiatuba'),
                "addressState": s.get('uf_endereco', 'SP'),
                "isFinancialResponsible": True,
                "isPedagogicalResponsible": True
            }
        ]
    }
    all_students_list.append(std_obj)

    enr_year = 2026 if is_concluinte else 2027
    enr_status = "concluded" if is_concluinte else "pending_reenrollment"
    contract_status = "concluded" if is_concluinte else "pending"
    enr_code = f"ROD-{enr_year}-{rm}"
    
    enr_obj = {
        "id": f"enr-{enr_year}-{rm}",
        "studentId": f"std-{rm}",
        "cocCode": rm,
        "rmNumber": rm,
        "studentName": s['nome_completo_estudante'],
        "enrollmentCode": enr_code,
        "courseLevel": s.get('nivel_ensino', 'Ensino Fundamental'),
        "currentGrade": s.get('serie_ano_atual', ''), # 2026
        "newGrade": s.get('nova_serie_ano_2027', ''),   # 2027
        "academicYear": enr_year,
        "status": enr_status,
        "schoolContractStatus": contract_status,
        "materialContractStatus": contract_status,
        "createdAt": "2026-09-29T12:00:00Z",
        "contractId": f"ctr-{enr_year}-{rm}",
        "guardianName": s.get('nome_responsavel_financeiro', ''),
        "guardianRelation": s.get('parentesco_responsavel', 'Responsável'),
        "guardianEmail": s.get('email_responsavel', ''),
        "guardianPhone": s.get('celular_whatsapp_responsavel', ''),
        "tuitionAnnualNominal": s.get('valor_nominal_anuidade_2027', 0),
        "tuitionNominalTotal": s.get('valor_nominal_anuidade_2027', 0),
        "tuitionGrossTotal": s.get('valor_total_anuidade_2027', 0),
        "tuitionDiscountTotal": s.get('valor_total_anuidade_2027', 0),
        "tuitionDiscountPercentage": s.get('percentual_desconto_2027', 0),
        "tuitionDiscountDescription": s.get('tipo_desconto_2027', 'Sem desconto'),
        "tuitionDiscountType": s.get('tipo_desconto_2027', 'Sem desconto'),
        "tuitionDiscountReason": s.get('observacao_desconto_2027', ''),
        "installmentsCount": s.get('plano_pagamento_anuidade_2027', 13),
        "paymentPlanChoice": str(s.get('plano_pagamento_anuidade_2027', 13)),
        "firstInstallmentValue": s.get('valor_1a_parcela_2027', 0),
        "regularInstallmentValue": s.get('valor_demais_parcelas_2027', 0),
        "quotaDueDate": s.get('dia_vencimento_parcelas_2027', '10'),
        "materialTotalValue": s.get('valor_total_material', 0),
        "materialInstallmentsCount": s.get('numero_parcelas_material', 12),
        "materialInstallmentValue": s.get('valor_parcela_material', 0),
        "financial": {
            "tuitionAnnualNominal": s.get('valor_nominal_anuidade_2027', 0),
            "tuitionGrossTotal": s.get('valor_total_anuidade_2027', 0),
            "tuitionDiscountPercentage": s.get('percentual_desconto_2027', 0),
            "tuitionDiscountDescription": s.get('tipo_desconto_2027', 'Sem desconto'),
            "tuitionDiscountReason": s.get('observacao_desconto_2027', ''),
            "installmentsCount": s.get('plano_pagamento_anuidade_2027', 13),
            "firstInstallmentValue": s.get('valor_1a_parcela_2027', 0),
            "regularInstallmentValue": s.get('valor_demais_parcelas_2027', 0),
            "quotaDueDate": s.get('dia_vencimento_parcelas_2027', '10'),
            "materialTotal": s.get('valor_total_material', 0),
            "materialInstallments": s.get('numero_parcelas_material', 12),
            "materialInstallmentValue": s.get('valor_parcela_material', 0)
        }
    }
    all_enrollments_list.append(enr_obj)

with open('src/data/initialData2027.js', 'w', encoding='utf-8') as f:
    f.write("// Base Oficial Completa Colégio Rodin 2026/2027\n")
    f.write(f"// Total de alunos ativos 2026: {len(all_students_list)}\n")
    f.write(f"// Rematrículas ativas 2027: {sum(1 for e in all_enrollments_list if e['academicYear'] == 2027)}\n")
    f.write(f"// Concluintes 3ª série: {sum(1 for e in all_enrollments_list if e['academicYear'] == 2026)}\n\n")
    f.write("export const ALL_CLASSES_2027 = ")
    json.dump(all_classes_list, f, ensure_ascii=False, indent=2)
    f.write(";\n\nexport const ALL_STUDENTS_2027 = ")
    json.dump(all_students_list, f, ensure_ascii=False, indent=2)
    f.write(";\n\nexport const ALL_ENROLLMENTS_2027 = ")
    json.dump(all_enrollments_list, f, ensure_ascii=False, indent=2)
    f.write(";\n")

print("✅ initialData2027.js atualizado com sucesso!")

# Conferência de Maria Miraglia
maria = [s for s in students if 'MIRAGLIA' in s['nome_completo_estudante'].upper()][0]
print("\n🔍 CONFERÊNCIA FINAL MARIA MIRAGLIA:")
print(f"   Nome: {maria['nome_completo_estudante']}")
print(f"   Série Atual (2026): {maria['serie_ano_atual']}")
print(f"   Nova Série (2027): {maria['nova_serie_ano_2027']}")
print(f"   Valor Normal: R$ {maria['valor_nominal_anuidade_2027']:,.2f}")
print(f"   Valor Contrato: R$ {maria['valor_total_anuidade_2027']:,.2f}")
assert maria['serie_ano_atual'] == '7º Ano EF', f"Erro: atual esperada '7º Ano EF', obtida '{maria['serie_ano_atual']}'"
assert maria['nova_serie_ano_2027'] == '8º Ano EF', f"Erro: nova esperada '8º Ano EF', obtida '{maria['nova_serie_ano_2027']}'"
print("   👉 VALIDAÇÃO PERFEITA!")

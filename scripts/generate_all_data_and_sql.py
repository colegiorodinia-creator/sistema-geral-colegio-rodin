import json
import uuid
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

NAMESPACE_RODIN = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')

def gen_uuid(val):
    return str(uuid.uuid5(NAMESPACE_RODIN, str(val)))

def sql_str(val):
    if val is None:
        return "NULL"
    s = str(val).strip()
    if s in ["", "—", "-", "None", "null"]:
        return "NULL"
    s = s.replace("'", "''")
    return f"'{s}'"

def sql_date(val):
    if val is None:
        return "NULL"
    s = str(val).strip()
    if not s or s in ["—", "-", "None", "null"]:
        return "NULL"
    if re.match(r'^\d{4}-\d{2}-\d{2}$', s):
        return f"'{s}'::DATE"
    m = re.match(r'^(\d{2})/(\d{2})/(\d{4})$', s)
    if m:
        d, mth, y = m.groups()
        return f"'{y}-{mth}-{d}'::DATE"
    return "NULL"

def sql_num(val, default=0.0):
    if val is None:
        return f"{default:.2f}"
    try:
        if isinstance(val, (int, float)):
            return f"{float(val):.2f}"
        s = str(val).strip().replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
        return f"{float(s):.2f}"
    except:
        return f"{default:.2f}"

def sql_int(val, default=0):
    if val is None:
        return str(default)
    try:
        return str(int(val))
    except:
        return str(default)

def main():
    print("🚀 Gerando dados completos e SQL do Supabase...")
    with open('src/data/students2027Data.json', 'r', encoding='utf-8') as f:
        students_raw = json.load(f)

    print(f"Total de alunos na base: {len(students_raw)}")

    # 1. Definir Turmas
    classes_2026_names = [
        ("cls-2026-6ef-a", "6º Ano EF A - 2026", "6º Ano EF", 2026, "SALA-01"),
        ("cls-2026-6ef-b", "6º Ano EF B - 2026", "6º Ano EF", 2026, "SALA-02"),
        ("cls-2026-6ef-c", "6º Ano EF C - 2026", "6º Ano EF", 2026, "SALA-03"),
        ("cls-2026-6ef-d", "6º Ano EF D - 2026", "6º Ano EF", 2026, "SALA-04"),
        ("cls-2026-7ef-a", "7º Ano EF A - 2026", "7º Ano EF", 2026, "SALA-05"),
        ("cls-2026-7ef-b", "7º Ano EF B - 2026", "7º Ano EF", 2026, "SALA-06"),
        ("cls-2026-7ef-c", "7º Ano EF C - 2026", "7º Ano EF", 2026, "SALA-07"),
        ("cls-2026-7ef-d", "7º Ano EF D - 2026", "7º Ano EF", 2026, "SALA-08"),
        ("cls-2026-8ef-a", "8º Ano EF A - 2026", "8º Ano EF", 2026, "SALA-09"),
        ("cls-2026-8ef-b", "8º Ano EF B - 2026", "8º Ano EF", 2026, "SALA-10"),
        ("cls-2026-8ef-c", "8º Ano EF C - 2026", "8º Ano EF", 2026, "SALA-11"),
        ("cls-2026-8ef-d", "8º Ano EF D - 2026", "8º Ano EF", 2026, "SALA-12"),
        ("cls-2026-9ef-a", "9º Ano EF A - 2026", "9º Ano EF", 2026, "SALA-13"),
        ("cls-2026-9ef-b", "9º Ano EF B - 2026", "9º Ano EF", 2026, "SALA-14"),
        ("cls-2026-9ef-c", "9º Ano EF C - 2026", "9º Ano EF", 2026, "SALA-15"),
        ("cls-2026-9ef-d", "9º Ano EF D - 2026", "9º Ano EF", 2026, "SALA-16"),
        ("cls-2026-1em-a", "1ª Série EM A - 2026", "1ª Série EM", 2026, "SALA-17"),
        ("cls-2026-1em-b", "1ª Série EM B - 2026", "1ª Série EM", 2026, "SALA-18"),
        ("cls-2026-1em-c", "1ª Série EM C - 2026", "1ª Série EM", 2026, "SALA-19"),
        ("cls-2026-2em-a", "2ª Série EM A - 2026", "2ª Série EM", 2026, "SALA-20"),
        ("cls-2026-2em-b", "2ª Série EM B - 2026", "2ª Série EM", 2026, "SALA-21"),
        ("cls-2026-2em-c", "2ª Série EM C - 2026", "2ª Série EM", 2026, "SALA-22"),
        ("cls-2026-3em-a", "3ª Série EM A - 2026", "3ª Série EM", 2026, "SALA-23"),
        ("cls-2026-3em-b", "3ª Série EM B - 2026", "3ª Série EM", 2026, "SALA-24"),
        ("cls-2026-3em-c", "3ª Série EM C - 2026", "3ª Série EM", 2026, "SALA-25"),
    ]

    classes_2027_names = [
        ("cls-7ef-a", "7º Ano EF A - Ensino Fundamental", "7º Ano EF", 2027, "SALA-101"),
        ("cls-7ef-b", "7º Ano EF B - Ensino Fundamental", "7º Ano EF", 2027, "SALA-102"),
        ("cls-7ef-c", "7º Ano EF C - Ensino Fundamental", "7º Ano EF", 2027, "SALA-103"),
        ("cls-7ef-d", "7º Ano EF D - Ensino Fundamental", "7º Ano EF", 2027, "SALA-104"),
        ("cls-8ef-a", "8º Ano EF A - Ensino Fundamental", "8º Ano EF", 2027, "SALA-105"),
        ("cls-8ef-b", "8º Ano EF B - Ensino Fundamental", "8º Ano EF", 2027, "SALA-106"),
        ("cls-8ef-c", "8º Ano EF C - Ensino Fundamental", "8º Ano EF", 2027, "SALA-107"),
        ("cls-8ef-d", "8º Ano EF D - Ensino Fundamental", "8º Ano EF", 2027, "SALA-108"),
        ("cls-9ef-a", "9º Ano EF A - Ensino Fundamental", "9º Ano EF", 2027, "SALA-109"),
        ("cls-9ef-b", "9º Ano EF B - Ensino Fundamental", "9º Ano EF", 2027, "SALA-110"),
        ("cls-9ef-c", "9º Ano EF C - Ensino Fundamental", "9º Ano EF", 2027, "SALA-111"),
        ("cls-9ef-d", "9º Ano EF D - Ensino Fundamental", "9º Ano EF", 2027, "SALA-112"),
        ("cls-1em-a", "1ª Série EM A - Ensino Médio", "1ª Série EM", 2027, "SALA-201"),
        ("cls-1em-b", "1ª Série EM B - Ensino Médio", "1ª Série EM", 2027, "SALA-202"),
        ("cls-1em-c", "1ª Série EM C - Ensino Médio", "1ª Série EM", 2027, "SALA-203"),
        ("cls-2em-a", "2ª Série EM A - Ensino Médio", "2ª Série EM", 2027, "SALA-204"),
        ("cls-2em-b", "2ª Série EM B - Ensino Médio", "2ª Série EM", 2027, "SALA-205"),
        ("cls-2em-c", "2ª Série EM C - Ensino Médio", "2ª Série EM", 2027, "SALA-206"),
        ("cls-3em-a", "3ª Série EM A - Ensino Médio", "3ª Série EM", 2027, "SALA-207"),
        ("cls-3em-b", "3ª Série EM B - Ensino Médio", "3ª Série EM", 2027, "SALA-208"),
        ("cls-3em-c", "3ª Série EM C - Ensino Médio", "3ª Série EM", 2027, "SALA-209"),
    ]

    all_classes_list = []
    for cid, cname, cgrade, cyear, croom in (classes_2026_names + classes_2027_names):
        all_classes_list.append({
            "id": cid,
            "name": cname,
            "gradeLevel": cgrade,
            "academicYear": cyear,
            "roomCode": croom,
            "coordinatorId": "u-coordinator",
            "studentCount": 0
        })

    # 2. Estruturar Alunos e Matrículas
    all_students_list = []
    all_enrollments_list = []

    for s in students_raw:
        rm = str(s['rm_numero']).strip()
        is_concluinte = (s['nova_serie_ano_2027'] == 'Concluinte')
        
        # Converter datas
        def fmt_iso_date(dstr):
            if not dstr: return None
            m = re.match(r'^(\d{2})/(\d{2})/(\d{4})$', dstr.strip())
            if m:
                d, mth, y = m.groups()
                return f"{y}-{mth}-{d}"
            return dstr

        bdate = fmt_iso_date(s.get('data_nascimento_estudante'))
        rg_date = fmt_iso_date(s.get('data_emissao_rg_estudante'))
        resp_bdate = fmt_iso_date(s.get('data_nascimento_responsavel'))

        std_obj = {
            "id": f"std-{rm}",
            "rmNumber": rm,
            "cocCode": rm,
            "name": s['nome_completo_estudante'],
            "studentName": s['nome_completo_estudante'],
            "enrollmentCode": f"ROD-2027-{rm}" if not is_concluinte else f"ROD-2026-{rm}",
            "gender": s.get('sexo_estudante', 'Masc.'),
            "studentGender": s.get('sexo_estudante', 'Masc.'),
            "birthDate": bdate,
            "studentBirthDate": bdate,
            "birthCity": s.get('naturalidade_cidade', 'Indaiatuba'),
            "studentBirthCity": s.get('naturalidade_cidade', 'Indaiatuba'),
            "nationality": s.get('nacionalidade_estudante', 'Brasileira'),
            "studentNationality": s.get('nacionalidade_estudante', 'Brasileira'),
            "rg": s.get('rg_estudante', ''),
            "studentRg": s.get('rg_estudante', ''),
            "rgIssuer": s.get('orgao_emissor_rg_estudante', 'SSP/SP'),
            "studentRgIssuer": s.get('orgao_emissor_rg_estudante', 'SSP/SP'),
            "dataEmissaoRg": rg_date,
            "studentRgIssueDate": rg_date,
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

        if not is_concluinte:
            enr_status = "pending_reenrollment"
            contract_status = "pending"
            enr_year = 2027
            enr_code = f"ROD-2027-{rm}"
        else:
            enr_status = "concluded"
            contract_status = "concluded"
            enr_year = 2026
            enr_code = f"ROD-2026-{rm}"

        enr_obj = {
            "id": f"enr-{enr_year}-{rm}",
            "studentId": f"std-{rm}",
            "cocCode": rm,
            "studentName": s['nome_completo_estudante'],
            "enrollmentCode": enr_code,
            "courseLevel": s.get('nivel_ensino', 'Ensino Fundamental'),
            "currentGrade": f"{s.get('serie_ano_atual', '')} {s.get('turma', 'A')}".strip(),
            "newGrade": s.get('nova_serie_ano_2027', ''),
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
            "financial": {
                "tuitionAnnualNominal": s.get('valor_nominal_anuidade_2027', 0),
                "tuitionGrossTotal": s.get('valor_total_anuidade_2027', 0),
                "tuitionDiscountPercentage": s.get('percentual_desconto_2027', 0),
                "tuitionDiscountDescription": s.get('tipo_desconto_2027', 'Sem desconto'),
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

    # 3. Salvar initialData2027.js
    print("💾 Salvando src/data/initialData2027.js...")
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

    print("✅ initialData2027.js gerado com sucesso!")

    # 4. Gerar SQL do Supabase
    print("💾 Gerando dump SQL do Supabase...")
    sql = []
    sql.append("-- ======================================================================")
    sql.append("-- COLÉGIO RODIN — SISTEMA INTEGRADO DE GESTÃO ESCOLAR & MATRÍCULAS")
    sql.append("-- BANCO COMPLETO POSTGRESQL NATIVO SUPABASE (ESTRUTURA + DADOS OFICIAIS)")
    sql.append(f"-- Base: Planilha Oficial Colégio Rodin 2026 ({len(all_students_list)} Alunos)")
    sql.append("-- ======================================================================\n")

    sql.append("BEGIN;\n")
    sql.append("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
    sql.append("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";\n")

    sql.append("""-- 1. ENUMS DO SISTEMA
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'director', 'coordinator', 'secretary', 'enrollment', 'teacher', 'student', 'guardian');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM ('draft', 'pending_signature', 'active', 'cancelled', 'pending_reenrollment', 'concluded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('pending', 'signed', 'rejected', 'concluded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE log_type_enum AS ENUM ('attendance', 'behavior_positive', 'behavior_warning', 'observation');
EXCEPTION WHEN duplicate_object THEN null; END $$;
""")

    sql.append("""-- 2. TABELAS BASE DO BANCO
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    role_label VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id VARCHAR(100) UNIQUE,
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    academic_year INT NOT NULL DEFAULT 2027,
    room_code VARCHAR(20),
    coordinator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    student_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rm_number VARCHAR(50) UNIQUE NOT NULL,
    coc_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    enrollment_code VARCHAR(50) NOT NULL,
    gender VARCHAR(20),
    birth_date DATE,
    birth_city VARCHAR(100),
    nationality VARCHAR(50) DEFAULT 'Brasileiro(a)',
    rg VARCHAR(30),
    rg_issuer VARCHAR(30) DEFAULT 'SSP/SP',
    rg_issue_date DATE,
    cpf VARCHAR(14),
    student_phone VARCHAR(30),
    course_level VARCHAR(100) NOT NULL,
    current_grade VARCHAR(100) NOT NULL,
    class_group VARCHAR(10) DEFAULT 'A',
    school_shift VARCHAR(30) DEFAULT 'Manhã',
    school_unit VARCHAR(100) DEFAULT 'Colégio Rodin - Indaiatuba',
    special_needs_desc VARCHAR(100) DEFAULT 'Normal',
    medical_allergies TEXT,
    emergency_contact VARCHAR(100),
    photo_url TEXT,
    attendance_rate VARCHAR(10) DEFAULT '98%',
    is_le_perini BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    kinship_relation VARCHAR(50),
    gender VARCHAR(20),
    cpf VARCHAR(20),
    rg VARCHAR(30),
    rg_issuer VARCHAR(30) DEFAULT 'SSP/SP',
    birth_date DATE,
    occupation VARCHAR(150),
    marital_status VARCHAR(50),
    nationality VARCHAR(50) DEFAULT 'Brasileiro(a)',
    email VARCHAR(255),
    phone_mobile VARCHAR(30),
    phone_landline VARCHAR(30),
    address_cep VARCHAR(20),
    address_street VARCHAR(255),
    address_number VARCHAR(30),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100) DEFAULT 'Indaiatuba',
    address_state VARCHAR(10) DEFAULT 'SP',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_guardians (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
    is_financial_responsible BOOLEAN DEFAULT FALSE,
    is_pedagogical_responsible BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (student_id, guardian_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_code VARCHAR(50) NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year INT NOT NULL DEFAULT 2027,
    course_level VARCHAR(100) NOT NULL,
    current_grade VARCHAR(100) NOT NULL,
    new_grade VARCHAR(100),
    class_group VARCHAR(10) DEFAULT 'A',
    status enrollment_status DEFAULT 'pending_reenrollment',
    school_contract_status VARCHAR(30) DEFAULT 'pending',
    material_contract_status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL DEFAULT 'school',
    tuition_nominal_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tuition_gross_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tuition_discount_percentage NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    tuition_discount_reason TEXT,
    installments_count INT NOT NULL DEFAULT 13,
    first_installment_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    regular_installment_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quota_due_date VARCHAR(10) DEFAULT '10',
    material_total NUMERIC(10, 2) DEFAULT 0.00,
    material_installments INT DEFAULT 12,
    material_installment_value NUMERIC(10, 2) DEFAULT 0.00,
    status contract_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")

    # Inserir Usuários Administrativos
    sql.append("""-- 3. USUÁRIOS E PERFIS ADMINISTRATIVOS
INSERT INTO profiles (id, name, email, role, role_label) VALUES
('b0000000-0000-0000-0000-000000000001', 'Diretoria Colégio Rodin', 'diretoria@colegiorodin.com.br', 'director', 'Diretoria Executiva'),
('b0000000-0000-0000-0000-000000000002', 'Coordenação Pedagógica', 'coordenacao@colegiorodin.com.br', 'coordinator', 'Coordenação Pedagógica'),
('b0000000-0000-0000-0000-000000000003', 'Secretaria Escolar', 'secretaria@colegiorodin.com.br', 'secretary', 'Secretaria Acadêmica'),
('b0000000-0000-0000-0000-000000000004', 'Setor de Matrículas', 'matriculas@colegiorodin.com.br', 'enrollment', 'Gestão de Matrículas'),
('b0000000-0000-0000-0000-000000000005', 'Administrador do Sistema', 'admin@colegiorodin.com.br', 'admin', 'Administrador Geral')
ON CONFLICT (email) DO NOTHING;
""")

    # Inserir Turmas
    sql.append("-- 4. TURMAS DO COLÉGIO RODIN (2026 E 2027)")
    for c in all_classes_list:
        cid = gen_uuid(c['id'])
        sql.append(f"INSERT INTO classes (id, code_id, name, grade_level, academic_year, room_code) VALUES ('{cid}', {sql_str(c['id'])}, {sql_str(c['name'])}, {sql_str(c['gradeLevel'])}, {c['academicYear']}, {sql_str(c['roomCode'])}) ON CONFLICT (code_id) DO NOTHING;")

    # Inserir Estudantes e Responsáveis
    sql.append("\n-- 5. ESTUDANTES OFICIAIS 2026")
    guardian_seen = {}
    for s in all_students_list:
        sid = gen_uuid(s['id'])
        is_le_perini_val = 'TRUE' if s.get('is_le_perini') else 'FALSE'
        sql.append(f"""INSERT INTO students (id, rm_number, coc_code, name, enrollment_code, gender, birth_date, birth_city, nationality, rg, rg_issuer, rg_issue_date, cpf, student_phone, course_level, current_grade, class_group, school_shift, school_unit, is_le_perini) VALUES ('{sid}', {sql_str(s['rmNumber'])}, {sql_str(s['cocCode'])}, {sql_str(s['name'])}, {sql_str(s['enrollmentCode'])}, {sql_str(s['gender'])}, {sql_date(s['birthDate'])}, {sql_str(s['birthCity'])}, {sql_str(s['nationality'])}, {sql_str(s['rg'])}, {sql_str(s['rgIssuer'])}, {sql_date(s['dataEmissaoRg'])}, {sql_str(s['cpf'])}, {sql_str(s['studentPhone'])}, {sql_str(s['courseLevel'])}, {sql_str(s['currentGrade'])}, {sql_str(s['classGroup'])}, {sql_str(s['schoolShift'])}, {sql_str(s['schoolUnit'])}, {is_le_perini_val}) ON CONFLICT (rm_number) DO UPDATE SET is_le_perini = EXCLUDED.is_le_perini, current_grade = EXCLUDED.current_grade;""")

        # Responsáveis
        for g in s['guardians']:
            cpf_key = (g.get('cpf') or g.get('name') or '').strip().lower()
            if cpf_key and cpf_key not in guardian_seen:
                gid = gen_uuid(f"guardian-{cpf_key}")
                guardian_seen[cpf_key] = gid
                sql.append(f"""INSERT INTO guardians (id, name, kinship_relation, gender, cpf, rg, rg_issuer, birth_date, occupation, marital_status, nationality, email, phone_mobile, address_cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state) VALUES ('{gid}', {sql_str(g['name'])}, {sql_str(g['kinshipRelation'])}, {sql_str(g.get('gender', 'Fem.'))}, {sql_str(g['cpf'])}, {sql_str(g['rg'])}, {sql_str(g['rgIssuer'])}, {sql_date(g['birthDate'])}, {sql_str(g['occupation'])}, {sql_str(g['maritalStatus'])}, {sql_str(g['nationality'])}, {sql_str(g['email'])}, {sql_str(g['phoneMobile'])}, {sql_str(g['addressCep'])}, {sql_str(g['addressStreet'])}, {sql_str(g['addressNumber'])}, {sql_str(g['addressComplement'])}, {sql_str(g['addressNeighborhood'])}, {sql_str(g['addressCity'])}, {sql_str(g['addressState'])}) ON CONFLICT (id) DO NOTHING;""")
            elif cpf_key:
                gid = guardian_seen[cpf_key]
            else:
                gid = gen_uuid(f"guardian-{sid}")
            
            sql.append(f"""INSERT INTO student_guardians (student_id, guardian_id, is_financial_responsible, is_pedagogical_responsible) VALUES ('{sid}', '{gid}', TRUE, TRUE) ON CONFLICT DO NOTHING;""")

    # Inserir Matrículas e Contratos
    sql.append("\n-- 6. MATRÍCULAS E CONTRATOS 2026 / 2027")
    for e in all_enrollments_list:
        eid = gen_uuid(e['id'])
        sid = gen_uuid(e['studentId'])
        ctrid = gen_uuid(e['contractId'])
        fin = e.get('financial', {})

        sql.append(f"""INSERT INTO enrollments (id, enrollment_code, student_id, academic_year, course_level, current_grade, new_grade, status, school_contract_status, material_contract_status) VALUES ('{eid}', {sql_str(e['enrollmentCode'])}, '{sid}', {e['academicYear']}, {sql_str(e['courseLevel'])}, {sql_str(e['currentGrade'])}, {sql_str(e['newGrade'])}, '{e['status']}', '{e['schoolContractStatus']}', '{e['materialContractStatus']}') ON CONFLICT (id) DO NOTHING;""")

        sql.append(f"""INSERT INTO contracts (id, enrollment_id, contract_type, tuition_nominal_total, tuition_gross_total, tuition_discount_percentage, tuition_discount_reason, installments_count, first_installment_value, regular_installment_value, quota_due_date, material_total, material_installments, material_installment_value, status) VALUES ('{ctrid}', '{eid}', 'school', {sql_num(fin.get('tuitionAnnualNominal', 0))}, {sql_num(fin.get('tuitionGrossTotal', 0))}, {sql_num(fin.get('tuitionDiscountPercentage', 0))}, {sql_str(fin.get('tuitionDiscountDescription', 'Sem desconto'))}, {sql_int(fin.get('installmentsCount', 13))}, {sql_num(fin.get('firstInstallmentValue', 0))}, {sql_num(fin.get('regularInstallmentValue', 0))}, {sql_str(fin.get('quotaDueDate', '10'))}, {sql_num(fin.get('materialTotal', 0))}, {sql_int(fin.get('materialInstallments', 12))}, {sql_num(fin.get('materialInstallmentValue', 0))}, '{e['schoolContractStatus']}') ON CONFLICT (id) DO NOTHING;""")

    sql.append("\nCOMMIT;\n")

    sql_output_path = 'supabase/complete_supabase_setup.sql'
    with open(sql_output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql))

    print(f"✅ SQL gerado com sucesso em: {sql_output_path}")

if __name__ == '__main__':
    main()

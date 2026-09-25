import json
import uuid
import re
import os

def sql_str(val):
    if val is None:
        return "NULL"
    s = str(val).strip()
    if s in ["", "—", "-", "None", "null"]:
        return "NULL"
    # Escape single quotes
    s = s.replace("'", "''")
    return f"'{s}'"

def sql_date(val):
    if val is None:
        return "NULL"
    s = str(val).strip()
    if not s or s in ["—", "-", "None", "null"]:
        return "NULL"
    # match YYYY-MM-DD
    if re.match(r'^\d{4}-\d{2}-\d{2}$', s):
        return f"'{s}'::DATE"
    # match DD/MM/YYYY
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

def generate_dump():
    print("Iniciando geração do dump do Supabase...")
    with open('src/data/initialData2027.js', 'r', encoding='utf-8') as f:
        text = f.read()

    pos_c = text.find('export const ALL_CLASSES_2027 = [')
    pos_s = text.find('export const ALL_STUDENTS_2027 = [')
    pos_e = text.find('export const ALL_ENROLLMENTS_2027 = [')

    classes_str = text[pos_c + len('export const ALL_CLASSES_2027 = '):pos_s].strip().rstrip(';')
    students_str = text[pos_s + len('export const ALL_STUDENTS_2027 = '):pos_e].strip().rstrip(';')
    enrollments_str = text[pos_e + len('export const ALL_ENROLLMENTS_2027 = '):].strip().rstrip(';')

    classes = json.loads(classes_str)
    students = json.loads(students_str)
    enrollments = json.loads(enrollments_str)

    print(f"Classes: {len(classes)} | Alunos: {len(students)} | Matrículas: {len(enrollments)}")

    NAMESPACE_RODIN = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')

    sql = []
    sql.append("-- ======================================================================")
    sql.append("-- COLÉGIO RODIN — SISTEMA INTEGRADO DE GESTÃO ESCOLAR & MATRÍCULAS")
    sql.append("-- BANCO COMPLETO POSTGRESQL NATIVO SUPABASE (ESTRUTURA + DADOS OFICIAIS)")
    sql.append("-- Base: Planilha Oficial Colégio Rodin 2027 (753 Alunos / Contratos)")
    sql.append("-- ======================================================================\n")

    sql.append("BEGIN;\n")
    sql.append("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
    sql.append("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";\n")

    sql.append("""-- 1. ENUMS DO SISTEMA
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'director', 'coordinator', 'secretary', 'enrollment', 'teacher', 'student', 'guardian');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM ('draft', 'pending_signature', 'active', 'cancelled', 'pending_reenrollment');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('pending', 'signed', 'rejected');
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

CREATE TABLE IF NOT EXISTS fixed_grade_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_segment VARCHAR(50) UNIQUE NOT NULL,
    segment_label VARCHAR(150) NOT NULL,
    tuition_annual NUMERIC(10, 2) NOT NULL,
    material_total NUMERIC(10, 2) NOT NULL,
    tuition_installments INT NOT NULL DEFAULT 13,
    material_installments INT NOT NULL DEFAULT 12,
    tuition_installment_value NUMERIC(10, 2) NOT NULL,
    material_installment_value NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spreadsheet_discount_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    description TEXT NOT NULL UNIQUE,
    frequency_count INT DEFAULT 1,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    kinship_relation VARCHAR(50),
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
    contract_code VARCHAR(50) UNIQUE NOT NULL,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_sha256 VARCHAR(64),
    terms_version VARCHAR(20) DEFAULT '2027.1',
    status contract_status DEFAULT 'pending',
    tuition_gross_total NUMERIC(10, 2) NOT NULL,
    tuition_nominal_total NUMERIC(10, 2),
    tuition_discount_total NUMERIC(10, 2) NOT NULL,
    tuition_discount_percentage NUMERIC(5, 4) DEFAULT 0.00,
    tuition_discount_reason VARCHAR(255),
    tuition_discount_type VARCHAR(255),
    installments_count INT NOT NULL DEFAULT 13,
    first_installment_value NUMERIC(10, 2) NOT NULL,
    regular_installment_value NUMERIC(10, 2) NOT NULL,
    material_total_value NUMERIC(10, 2) DEFAULT 0.00,
    material_total_extenso TEXT,
    material_installments_count INT DEFAULT 12,
    material_installment_value NUMERIC(10, 2) DEFAULT 0.00,
    material_installment_extenso TEXT,
    material_start_due_date VARCHAR(50),
    material_end_due_date VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
""")

    # PROFILES
    sql.append("-- 3. PERFIS DE USUÁRIOS PREDEFINIDOS (RBAC)")
    sql.append("""INSERT INTO profiles (id, name, email, role, role_label, avatar_url) VALUES
('a0000000-0000-0000-0000-000000000001', 'Matheus Brandão', 'matheus.admin@colegiorodin.com.br', 'admin', 'Administrador Geral', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
('a0000000-0000-0000-0000-000000000002', 'Profa. Dra. Helena Siqueira', 'helena.direcao@colegiorodin.com.br', 'director', 'Diretora Pedagógica', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
('a0000000-0000-0000-0000-000000000003', 'Prof. Carlos Eduardo', 'carlos.coord@colegiorodin.com.br', 'coordinator', 'Coordenador EM', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
('a0000000-0000-0000-0000-000000000004', 'Patrícia Alcantara', 'patricia.secretaria@colegiorodin.com.br', 'secretary', 'Secretaria Escolar', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
('a0000000-0000-0000-0000-000000000005', 'Lucas Vasconcelos', 'lucas.matriculas@colegiorodin.com.br', 'enrollment', 'Setor de Matrículas', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
('a0000000-0000-0000-0000-000000000006', 'Prof. André Castilho', 'andre.prof@colegiorodin.com.br', 'teacher', 'Professor de Física e Robótica', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
('a0000000-0000-0000-0000-000000000007', 'Wanderson Pedro de Almeida', 'wpalmeida@hotmail.com', 'guardian', 'Responsável Financeiro / Pai', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role;\n""")

    # FIXED RATES
    sql.append("-- 4. VALORES FIXOS OFICIAIS 2027")
    sql.append("""INSERT INTO fixed_grade_rates (grade_segment, segment_label, tuition_annual, material_total, tuition_installments, material_installments, tuition_installment_value, material_installment_value) VALUES
('ef_6_to_9', '6º ao 9º ano do Ensino Fundamental', 34663.20, 5248.80, 13, 12, 2666.40, 437.40),
('em_1_and_2', '1ª e 2ª série do Ensino Médio', 37752.00, 5338.20, 13, 12, 2904.00, 444.85),
('terceirao', 'Terceirão (3ª série EM / Pré-Vestibular)', 43243.20, 7575.60, 13, 12, 3326.40, 631.30)
ON CONFLICT (grade_segment) DO UPDATE SET tuition_annual = EXCLUDED.tuition_annual;\n""")

    # CLASSES
    sql.append("-- 5. TURMAS OFICIAIS 2027")
    class_rows = []
    for c in classes:
        cid = str(uuid.uuid5(NAMESPACE_RODIN, f"class-{c['id']}"))
        class_rows.append(f"('{cid}', {sql_str(c['id'])}, {sql_str(c['name'])}, {sql_str(c['gradeLevel'])}, {sql_int(c.get('academicYear', 2027))}, {sql_str(c.get('roomCode'))}, {sql_int(c.get('studentCount', 30))})")
    
    sql.append(f"INSERT INTO classes (id, code_id, name, grade_level, academic_year, room_code, student_count) VALUES\n" + ",\n".join(class_rows) + "\nON CONFLICT (code_id) DO NOTHING;\n")

    # GUARDIANS (deduplicated by CPF or unique key)
    sql.append("-- 6. RESPONSÁVEIS FAMILIARES E FINANCEIROS")
    guardian_dict = {}
    student_guardian_links = []

    for s in students:
        rm = str(s.get('rmNumber') or s.get('cocCode') or s.get('id')).replace('std-', '')
        std_uuid = str(uuid.uuid5(NAMESPACE_RODIN, f"student-{rm}"))

        for idx, g in enumerate(s.get('guardians', [])):
            cpf = (g.get('guardianCpf') or g.get('cpf') or "").strip()
            name = (g.get('guardianName') or g.get('name') or "").strip()
            
            # Key for deduplication
            if cpf and cpf not in ["—", "-"]:
                g_key = f"cpf:{cpf}"
            elif name:
                g_key = f"name:{name.lower()}"
            else:
                g_key = f"auto:{rm}:{idx}"

            if g_key not in guardian_dict:
                g_uuid = str(uuid.uuid5(NAMESPACE_RODIN, f"guardian-{g_key}"))
                guardian_dict[g_key] = {
                    "id": g_uuid,
                    "name": name or "Responsável Não Informado",
                    "kinship_relation": g.get('guardianRelation') or g.get('kinshipRelation') or "Responsável Legal",
                    "cpf": cpf if cpf and cpf not in ["—", "-"] else None,
                    "rg": g.get('guardianRg') or g.get('rg'),
                    "rg_issuer": g.get('guardianRgIssuer') or g.get('rgIssuer') or "SSP/SP",
                    "birth_date": g.get('guardianBirthDate') or g.get('birthDate'),
                    "occupation": g.get('guardianOccupation') or g.get('occupation'),
                    "marital_status": g.get('guardianMaritalStatus') or g.get('maritalStatus'),
                    "nationality": g.get('guardianNationality') or g.get('nationality') or "Brasileiro(a)",
                    "email": g.get('guardianEmail') or g.get('email'),
                    "phone_mobile": g.get('guardianPhone') or g.get('phoneMobile'),
                    "phone_landline": g.get('guardianLandline') or g.get('phoneLandline'),
                    "address_cep": g.get('guardianAddressCep') or g.get('addressCep'),
                    "address_street": g.get('guardianAddressStreet') or g.get('addressStreet'),
                    "address_number": g.get('guardianAddressNumber') or g.get('addressNumber'),
                    "address_complement": g.get('guardianAddressComplement') or g.get('addressComplement'),
                    "address_neighborhood": g.get('guardianAddressNeighborhood') or g.get('addressNeighborhood'),
                    "address_city": g.get('guardianAddressCity') or g.get('addressCity') or "Indaiatuba",
                    "address_state": g.get('guardianAddressState') or g.get('addressState') or "SP"
                }
            else:
                g_uuid = guardian_dict[g_key]["id"]

            student_guardian_links.append((
                std_uuid,
                g_uuid,
                "TRUE" if g.get('isFinancial') else ("TRUE" if idx == 0 else "FALSE"),
                "TRUE" if g.get('isPedagogical') is not False else "TRUE"
            ))

    # Insert guardians in chunks of 100
    guardian_list = list(guardian_dict.values())
    print(f"Total responsáveis únicos deduplicados: {len(guardian_list)}")

    chunk_size = 100
    for i in range(0, len(guardian_list), chunk_size):
        chunk = guardian_list[i:i + chunk_size]
        g_rows = []
        for g in chunk:
            g_rows.append(f"('{g['id']}', {sql_str(g['name'])}, {sql_str(g['kinship_relation'])}, {sql_str(g['cpf'])}, {sql_str(g['rg'])}, {sql_str(g['rg_issuer'])}, {sql_date(g['birth_date'])}, {sql_str(g['occupation'])}, {sql_str(g['marital_status'])}, {sql_str(g['nationality'])}, {sql_str(g['email'])}, {sql_str(g['phone_mobile'])}, {sql_str(g['phone_landline'])}, {sql_str(g['address_cep'])}, {sql_str(g['address_street'])}, {sql_str(g['address_number'])}, {sql_str(g['address_complement'])}, {sql_str(g['address_neighborhood'])}, {sql_str(g['address_city'])}, {sql_str(g['address_state'])})")
        sql.append("INSERT INTO guardians (id, name, kinship_relation, cpf, rg, rg_issuer, birth_date, occupation, marital_status, nationality, email, phone_mobile, phone_landline, address_cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state) VALUES\n" + ",\n".join(g_rows) + "\nON CONFLICT (id) DO NOTHING;\n")

    # STUDENTS
    sql.append("-- 7. ALUNOS MATRICULADOS (753 ESTUDANTES DA BASE)")
    for i in range(0, len(students), chunk_size):
        chunk = students[i:i + chunk_size]
        s_rows = []
        for s in chunk:
            rm = str(s.get('rmNumber') or s.get('cocCode') or s.get('id')).replace('std-', '')
            std_uuid = str(uuid.uuid5(NAMESPACE_RODIN, f"student-{rm}"))
            s_rows.append(f"('{std_uuid}', {sql_str(rm)}, {sql_str(s.get('cocCode', rm))}, {sql_str(s.get('name') or s.get('studentName'))}, {sql_str(s.get('enrollmentCode', f'ROD-2027-{rm}'))}, {sql_str(s.get('gender') or s.get('studentGender'))}, {sql_date(s.get('birthDate') or s.get('studentBirthDate'))}, {sql_str(s.get('birthCity') or s.get('studentBirthCity') or 'Indaiatuba - SP')}, {sql_str(s.get('nationality') or s.get('studentNationality') or 'Brasileiro(a)')}, {sql_str(s.get('rg') or s.get('studentRg'))}, {sql_str(s.get('rgIssuer') or s.get('studentRgIssuer') or 'SSP/SP')}, {sql_date(s.get('rgIssueDate') or s.get('studentRgIssueDate'))}, {sql_str(s.get('cpf') or s.get('studentCpf'))}, {sql_str(s.get('studentPhone'))}, {sql_str(s.get('courseLevel', 'Ensino Fundamental'))}, {sql_str(s.get('currentGrade', '6º Ano EF'))}, {sql_str(s.get('classGroup', 'A'))}, {sql_str(s.get('schoolShift', 'Manhã'))}, {sql_str(s.get('schoolUnit', 'Colégio Rodin - Indaiatuba'))}, {sql_str(s.get('condition', 'Normal'))}, {sql_str(s.get('medicalAllergies', 'Nenhuma.'))}, {sql_str(s.get('emergencyContact'))}, {sql_str(s.get('photoUrl'))}, {sql_str(s.get('attendanceRate', '98%'))})")
        sql.append("INSERT INTO students (id, rm_number, coc_code, name, enrollment_code, gender, birth_date, birth_city, nationality, rg, rg_issuer, rg_issue_date, cpf, student_phone, course_level, current_grade, class_group, school_shift, school_unit, special_needs_desc, medical_allergies, emergency_contact, photo_url, attendance_rate) VALUES\n" + ",\n".join(s_rows) + "\nON CONFLICT (rm_number) DO UPDATE SET name = EXCLUDED.name;\n")

    # STUDENT GUARDIANS
    sql.append("-- 8. VÍNCULOS ALUNO-RESPONSÁVEL")
    # Deduplicate links
    unique_links = list({f"{l[0]}_{l[1]}": l for l in student_guardian_links}.values())
    for i in range(0, len(unique_links), chunk_size * 2):
        chunk = unique_links[i:i + chunk_size * 2]
        l_rows = []
        for l in chunk:
            l_rows.append(f"('{l[0]}', '{l[1]}', {l[2]}, {l[3]})")
        sql.append("INSERT INTO student_guardians (student_id, guardian_id, is_financial_responsible, is_pedagogical_responsible) VALUES\n" + ",\n".join(l_rows) + "\nON CONFLICT (student_id, guardian_id) DO NOTHING;\n")

    # ENROLLMENTS
    sql.append("-- 9. MATRÍCULAS 2027 (CAMPANHA DE REMATRÍCULA)")
    for i in range(0, len(enrollments), chunk_size):
        chunk = enrollments[i:i + chunk_size]
        e_rows = []
        for enr in chunk:
            rm = str(enr.get('cocCode') or enr.get('id')).replace('enr-2027-', '').replace('std-', '')
            enr_uuid = str(uuid.uuid5(NAMESPACE_RODIN, f"enrollment-2027-{rm}"))
            std_uuid = str(uuid.uuid5(NAMESPACE_RODIN, f"student-{rm}"))
            status = 'pending_reenrollment' if enr.get('status') == 'pending_reenrollment' else 'draft'
            e_rows.append(f"('{enr_uuid}', {sql_str(enr.get('enrollmentCode', f'ROD-2027-{rm}'))}, '{std_uuid}', {sql_int(enr.get('academicYear', 2027))}, {sql_str(enr.get('courseLevel', 'Ensino Fundamental'))}, {sql_str(enr.get('currentGrade', ''))}, {sql_str(enr.get('newGrade', ''))}, 'A', '{status}', {sql_str(enr.get('schoolContractStatus', 'pending'))}, {sql_str(enr.get('materialContractStatus', 'pending'))})")
        sql.append("INSERT INTO enrollments (id, enrollment_code, student_id, academic_year, course_level, current_grade, new_grade, class_group, status, school_contract_status, material_contract_status) VALUES\n" + ",\n".join(e_rows) + "\nON CONFLICT (id) DO NOTHING;\n")

    # CONTRACTS
    sql.append("-- 10. CONTRATOS DIGITAIS E CONDIÇÕES FINANCEIRAS 2027")
    for i in range(0, len(enrollments), chunk_size):
        chunk = enrollments[i:i + chunk_size]
        c_rows = []
        for enr in chunk:
            rm = str(enr.get('cocCode') or enr.get('id')).replace('enr-2027-', '').replace('std-', '')
            ctr_code = enr.get('contractId', f'ctr-2027-{rm}')
            ctr_uuid = str(uuid.uuid5(NAMESPACE_RODIN, f"contract-2027-{rm}"))
            enr_uuid = str(uuid.uuid5(NAMESPACE_RODIN, f"enrollment-2027-{rm}"))
            std_uuid = str(uuid.uuid5(NAMESPACE_RODIN, f"student-{rm}"))

            c_rows.append(f"('{ctr_uuid}', {sql_str(ctr_code)}, '{enr_uuid}', '{std_uuid}', {sql_str(enr.get('documentSha256', '9f83ca4628f89e273d489b09a473fa58b87e21a8d052a7c49122394c8e76c12e'))}, '2027.1', {sql_str(enr.get('schoolContractStatus', 'pending'))}, {sql_num(enr.get('tuitionGrossTotal'), 34663.20)}, {sql_num(enr.get('tuitionNominalTotal'), 34663.20)}, {sql_num(enr.get('tuitionDiscountTotal'), 25997.40)}, {sql_num(enr.get('tuitionDiscountPercentage'), 0.25)}, {sql_str(enr.get('tuitionDiscountReason', 'Desconto Padrão'))}, {sql_str(enr.get('tuitionDiscountType', ''))}, {sql_int(enr.get('installmentsCount', 13))}, {sql_num(enr.get('firstInstallmentValue'), 1999.80)}, {sql_num(enr.get('regularInstallmentValue'), 1999.80)}, {sql_num(enr.get('materialTotalValue'), 5248.80)}, {sql_str(enr.get('materialTotalExtenso', ''))}, {sql_int(enr.get('materialInstallmentsCount', 12))}, {sql_num(enr.get('materialInstallmentValue'), 437.40)}, {sql_str(enr.get('materialInstallmentExtenso', ''))}, {sql_str(enr.get('materialStartDueDate', '10/01/2027'))}, {sql_str(enr.get('materialEndDueDate', '10/12/2027'))})")
        sql.append("INSERT INTO contracts (id, contract_code, enrollment_id, student_id, document_sha256, terms_version, status, tuition_gross_total, tuition_nominal_total, tuition_discount_total, tuition_discount_percentage, tuition_discount_reason, tuition_discount_type, installments_count, first_installment_value, regular_installment_value, material_total_value, material_total_extenso, material_installments_count, material_installment_value, material_installment_extenso, material_start_due_date, material_end_due_date) VALUES\n" + ",\n".join(c_rows) + "\nON CONFLICT (contract_code) DO NOTHING;\n")

    sql.append("COMMIT;\n")

    out_file = 'supabase/complete_supabase_setup.sql'
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql))

    print(f"Sucesso! Dump gerado em: {out_file} com {len(sql)} blocos.")

if __name__ == '__main__':
    generate_dump()

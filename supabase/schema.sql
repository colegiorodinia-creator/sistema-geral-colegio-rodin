-- ======================================================================
-- COLÉGIO RODIN — SISTEMA INTEGRADO DE GESTÃO ESCOLAR & MATRÍCULAS
-- SCHEMA POSTGRESQL NATIVO SUPABASE COM ESTRUTURA COMPLETA DA BASE 2027
-- ======================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS DE SISTEMA
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin', 
        'director', 
        'coordinator', 
        'secretary', 
        'enrollment', 
        'teacher', 
        'student', 
        'guardian'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM (
        'draft', 
        'pending_signature', 
        'active', 
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM (
        'pending', 
        'signed', 
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_type_enum AS ENUM (
        'attendance', 
        'behavior_positive', 
        'behavior_warning', 
        'observation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELAS BASE

-- 3.1 Perfis de Usuários (Vinculados a auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 Alunos (Estrutura Completa conforme Planilha Rodin 2027)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    coc_code VARCHAR(50) UNIQUE, -- Código COC / Matrícula
    name VARCHAR(255) NOT NULL,
    enrollment_code VARCHAR(50) UNIQUE NOT NULL,
    gender VARCHAR(20), -- Masculino / Feminino
    birth_date DATE NOT NULL,
    birth_city VARCHAR(100), -- Naturalidade (ex: Indaiatuba - SP)
    nationality VARCHAR(50) DEFAULT 'Brasileiro(a)',
    rg VARCHAR(30),
    rg_issuer VARCHAR(30) DEFAULT 'SSP/SP',
    rg_issue_date DATE,
    cpf VARCHAR(14) UNIQUE,
    course_level VARCHAR(100) NOT NULL, -- Ensino Fundamental II / Ensino Médio / Terceirão
    current_grade VARCHAR(100) NOT NULL, -- ex: 6º ano, 1ª série EM
    class_group VARCHAR(10) DEFAULT 'A', -- Turma A, B
    school_shift VARCHAR(30) DEFAULT 'Manhã', -- Turno
    school_unit VARCHAR(100) DEFAULT 'Colégio Rodin - Indaiatuba',
    special_needs_desc VARCHAR(100) DEFAULT 'Normal', -- TDAH, TEA, Superdotação, etc.
    medical_allergies TEXT,
    emergency_contact VARCHAR(100),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 Responsáveis Legais, Financeiros e Familiares (Base Completa Rodin 2027)
CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    kinship_relation VARCHAR(50) NOT NULL, -- Pai, Mãe, Tutor Legal, etc.
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(30),
    rg_issuer VARCHAR(30) DEFAULT 'SSP/SP',
    birth_date DATE,
    occupation VARCHAR(150), -- Profissão (ex: Gerente de Contas, Diretor Financeiro)
    marital_status VARCHAR(50), -- Casado(a), Solteiro(a), etc.
    nationality VARCHAR(50) DEFAULT 'Brasileiro(a)',
    email VARCHAR(255) NOT NULL,
    phone_mobile VARCHAR(30) NOT NULL, -- WhatsApp / Celular Principal
    phone_landline VARCHAR(30),
    address_cep VARCHAR(20),
    address_street VARCHAR(255),
    address_number VARCHAR(30),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100) DEFAULT 'Indaiatuba',
    address_state VARCHAR(10) DEFAULT 'SP',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.4 Vínculo Alunos-Responsáveis
CREATE TABLE IF NOT EXISTS student_guardians (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
    is_financial_responsible BOOLEAN DEFAULT FALSE,
    is_pedagogical_responsible BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (student_id, guardian_id)
);

-- 3.5 Matrículas (Enrollments 2027 / 2026)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    academic_year INT NOT NULL DEFAULT 2027,
    course_level VARCHAR(100) NOT NULL,
    grade_series VARCHAR(100) NOT NULL,
    class_group VARCHAR(10) DEFAULT 'A',
    status enrollment_status DEFAULT 'draft',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.6 Contratos Digitais Nativos & Condições Financeiras (Base Rodin 2027)
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    document_sha256 VARCHAR(64) NOT NULL,
    contract_date DATE DEFAULT CURRENT_DATE,
    terms_version VARCHAR(20) DEFAULT '2027.1',
    status contract_status DEFAULT 'pending',
    -- Condições Financeiras da Anuidade
    tuition_gross_total NUMERIC(10, 2) NOT NULL, -- Valor Anuidade Total sem desconto
    tuition_discount_total NUMERIC(10, 2) NOT NULL, -- Valor Anuidade com desconto
    tuition_discount_reason VARCHAR(255), -- Descrição do desconto (ex: 5% pontualidade + 5% à vista)
    installments_count INT NOT NULL DEFAULT 12, -- Nº de parcelas (12 ou 13)
    first_installment_value NUMERIC(10, 2) NOT NULL, -- 1ª Parcela / Taxa de Matrícula
    regular_installment_value NUMERIC(10, 2) NOT NULL, -- Demais parcelas
    -- Material Didático COC / Bernoulli
    material_total_value NUMERIC(10, 2) DEFAULT 0.00,
    material_installments_count INT DEFAULT 6,
    material_installment_value NUMERIC(10, 2) DEFAULT 0.00,
    material_start_due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.7 Assinaturas de Contratos & Trilha de Auditoria Criptográfica
CREATE TABLE IF NOT EXISTS contract_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE RESTRICT,
    signature_image_path TEXT,
    ip_address VARCHAR(45) NOT NULL,
    port VARCHAR(10),
    user_agent TEXT NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signature_sha256 VARCHAR(64) NOT NULL,
    audit_trail_json JSONB
);

-- 3.8 Turmas e Delegação de Coordenação
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    academic_year INT NOT NULL DEFAULT 2027,
    room_code VARCHAR(20),
    coordinator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.9 Diário de Bordo e Registros de Sala (Tablet do Professor)
CREATE TABLE IF NOT EXISTS classroom_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    log_type log_type_enum NOT NULL,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.10 Banco de Questões
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    content TEXT NOT NULL,
    options_json JSONB,
    correct_option VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.11 Avaliações e Provas
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    assessment_date DATE NOT NULL,
    term VARCHAR(20) NOT NULL, -- '1_bimestre', '2_bimestre', etc.
    max_score NUMERIC(5, 2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.12 Lançamento de Notas dos Alunos
CREATE TABLE IF NOT EXISTS student_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assessment_id, student_id)
);

-- 3.13 Logs de Auditoria Geral
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_table VARCHAR(50) NOT NULL,
    entity_id UUID,
    payload_json JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- 4. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ======================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 4.2 Classroom Logs (Diário de Classe & Ocorrências)
CREATE POLICY "coordinators_directors_view_logs" ON classroom_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM classes 
        WHERE classes.id = classroom_logs.class_id 
        AND classes.coordinator_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'director')
    )
    OR
    teacher_id = auth.uid()
);

CREATE POLICY "teachers_insert_logs" ON classroom_logs FOR INSERT WITH CHECK (
    teacher_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'director', 'coordinator')
    )
);

-- 4.3 Contracts & Assinaturas
CREATE POLICY "guardians_view_contracts" ON contracts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM enrollments e
        JOIN student_guardians sg ON sg.student_id = e.student_id
        JOIN guardians g ON g.id = sg.guardian_id
        WHERE e.id = contracts.enrollment_id
        AND g.profile_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director', 'enrollment', 'secretary')
    )
);

CREATE POLICY "guardians_sign_contracts" ON contract_signatures FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM guardians g
        WHERE g.id = contract_signatures.guardian_id
        AND g.profile_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'enrollment')
    )
);

-- 4.4 Grades & Boletins
CREATE POLICY "grades_view_policy" ON student_grades FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM student_guardians sg
        JOIN guardians g ON g.id = sg.guardian_id
        WHERE sg.student_id = student_grades.student_id
        AND g.profile_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM students s
        WHERE s.id = student_grades.student_id
        AND s.profile_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'director', 'coordinator', 'secretary', 'teacher')
    )
);

-- ======================================================================
-- 5. DADOS DE DEMONSTRAÇÃO (SEED DATA EXTRAÍDO DA PLANILHA 2027)
-- ======================================================================

-- Turmas Reais Colégio Rodin
INSERT INTO classes (id, name, grade_level, academic_year, room_code) VALUES
('c1111111-1111-1111-1111-111111111111', '1º Ano A - Ensino Médio', '1ª Série EM', 2027, 'SALA-101'),
('c2222222-2222-2222-2222-222222222222', '2º Ano A - Ensino Médio', '2ª Série EM', 2027, 'SALA-102'),
('c3333333-3333-3333-3333-333333333333', '3º Ano Terceirão - Pré-Vestibular', '3ª Série EM', 2027, 'SALA-103'),
('c4444444-4444-4444-4444-444444444444', '6º Ano A - Fundamental II', '6º Ano EF', 2027, 'SALA-201'),
('c5555555-5555-5555-5555-555555555555', '9º Ano A - Fundamental II', '9º Ano EF', 2027, 'SALA-204')
ON CONFLICT (id) DO NOTHING;

-- 5.1 Tabela de Valores Fixos Oficiais por Segmento (Ano Letivo 2027)
CREATE TABLE IF NOT EXISTS fixed_grade_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_segment VARCHAR(50) NOT NULL UNIQUE,
    segment_label VARCHAR(100) NOT NULL,
    tuition_annual NUMERIC(10, 2) NOT NULL,
    material_total NUMERIC(10, 2) NOT NULL,
    tuition_installments INT NOT NULL DEFAULT 13,
    material_installments INT NOT NULL DEFAULT 12,
    tuition_installment_value NUMERIC(10, 2) NOT NULL,
    material_installment_value NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed dos Valores Fixos Oficiais 2027
INSERT INTO fixed_grade_rates (grade_segment, segment_label, tuition_annual, material_total, tuition_installments, material_installments, tuition_installment_value, material_installment_value) VALUES
('ef_6_to_9', '6º ao 9º ano do Ensino Fundamental', 34663.20, 5248.80, 13, 12, 2666.40, 437.40),
('em_1_and_2', '1ª e 2ª série do Ensino Médio', 37752.00, 5338.20, 13, 12, 2904.00, 444.85),
('terceirao', 'Terceirão (3ª série EM / Pré-Vestibular)', 43243.20, 7575.60, 13, 12, 3326.40, 631.30)
ON CONFLICT (grade_segment) DO UPDATE SET
    tuition_annual = EXCLUDED.tuition_annual,
    material_total = EXCLUDED.material_total,
    tuition_installments = EXCLUDED.tuition_installments,
    material_installments = EXCLUDED.material_installments,
    tuition_installment_value = EXCLUDED.tuition_installment_value,
    material_installment_value = EXCLUDED.material_installment_value,
    updated_at = NOW();

-- 5.2 Catálogo Oficial de Descrições e Percentuais de Desconto da Planilha 2027
CREATE TABLE IF NOT EXISTS spreadsheet_discount_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    description TEXT NOT NULL UNIQUE,
    frequency_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed das Principais Descrições Oficiais da Planilha
INSERT INTO spreadsheet_discount_descriptions (percentage, description, frequency_count) VALUES
(25.00, 'Parceria Le Perini 25% na anuidade', 150),
(0.00, 'sem desconto', 65),
(10.00, '10% a partir da segunda parcela', 60),
(25.00, 'Desconto Le Perini 25% na anuidade', 24),
(10.00, 'Desconto de 10% a partir da 2ª parc.', 20),
(10.00, 'desconto de 10% a partir da segunda parcela', 14),
(25.00, 'Desconto de 25% Le Perini', 10),
(35.00, 'DLP 2020            (35% na anuidade)', 10),
(10.00, 'Desconto de campanha 10% a partir da segunda parcela', 9),
(0.00, 'Anuidade integral conforme tabela padrão Colégio Rodin 2027', 6),
(25.00, 'Le Perini - 25% de desconto na anuidade', 6),
(10.00, 'Desconto de 10% a partir da segunda parcela', 5),
(0.00, 'não solicitou desconto', 5),
(0.00, 'sem desconto, não solicitou', 4),
(10.00, 'Concedido 10% desconto a partir da segunda parcela', 4),
(15.00, 'Parceria Prefeitura 15% a partir da segunda parcela', 4),
(10.00, '10% desconto a partir da segunda parcela', 4),
(10.00, 'Desconto de campanha 10% a partir da 2ª parcela', 4),
(25.00, 'Desconto 25% Le Perini', 4),
(10.00, 'DC  2025   (10% a partir da 2ª parcela)', 4),
(25.00, '25% desconto LePerini + 5% à vista', 3),
(10.00, '10% a partir da segunda parcela irmãos', 3),
(10.00, '10% desconto 2ª parcela', 3),
(25.00, 'Desconto LePerini 25% na anuidade', 3),
(10.00, '10% a partir da 2ª parc', 3),
(0.00, 'sem desconto, não pediu', 3),
(15.00, 'Desconto de 15% a partir da segunda parcela', 3),
(10.00, '10% de desconto a partir da segunda parcela', 3),
(15.00, 'Parceria Azul 15% a partir da segunda parcela', 3),
(15.00, 'Desconto de 15% a partir da segunda parcela parceria John Deere', 3),
(100.00, 'Bolsa 100% - sobrinho Sandra RH', 1),
(100.00, 'Permuta 100% - Autorizado Canela', 1),
(50.00, 'Desconto de 50% - mãe prof LePerini', 1),
(20.00, 'Desconto Osório de 20% no valor da anuidade para todo EF', 1)
ON CONFLICT (description) DO UPDATE SET
    percentage = EXCLUDED.percentage,
    frequency_count = EXCLUDED.frequency_count;



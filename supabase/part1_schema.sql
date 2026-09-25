CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'director', 'coordinator', 'secretary', 'enrollment', 'teacher', 'student', 'guardian'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE enrollment_status AS ENUM ('draft', 'pending_signature', 'active', 'cancelled', 'pending_reenrollment'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE contract_status AS ENUM ('pending', 'signed', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE log_type_enum AS ENUM ('attendance', 'behavior_positive', 'behavior_warning', 'observation'); EXCEPTION WHEN duplicate_object THEN null; END $$;

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

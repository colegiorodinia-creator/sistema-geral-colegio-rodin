ALTER TABLE guardians 
    ALTER COLUMN address_state TYPE VARCHAR(100),
    ALTER COLUMN address_number TYPE VARCHAR(100),
    ALTER COLUMN address_neighborhood TYPE VARCHAR(255),
    ALTER COLUMN address_street TYPE VARCHAR(255),
    ALTER COLUMN address_complement TYPE VARCHAR(255),
    ALTER COLUMN address_city TYPE VARCHAR(100),
    ALTER COLUMN address_cep TYPE VARCHAR(50),
    ALTER COLUMN cpf TYPE VARCHAR(50),
    ALTER COLUMN rg TYPE VARCHAR(50),
    ALTER COLUMN rg_issuer TYPE VARCHAR(50),
    ALTER COLUMN phone_mobile TYPE VARCHAR(50),
    ALTER COLUMN phone_landline TYPE VARCHAR(50),
    ALTER COLUMN marital_status TYPE VARCHAR(100),
    ALTER COLUMN nationality TYPE VARCHAR(100),
    ALTER COLUMN kinship_relation TYPE VARCHAR(100),
    ALTER COLUMN occupation TYPE VARCHAR(255);

ALTER TABLE students 
    ALTER COLUMN cpf TYPE VARCHAR(50),
    ALTER COLUMN rg TYPE VARCHAR(50),
    ALTER COLUMN rg_issuer TYPE VARCHAR(50),
    ALTER COLUMN student_phone TYPE VARCHAR(50),
    ALTER COLUMN attendance_rate TYPE VARCHAR(50),
    ALTER COLUMN birth_city TYPE VARCHAR(255),
    ALTER COLUMN course_level TYPE VARCHAR(150),
    ALTER COLUMN current_grade TYPE VARCHAR(150);

ALTER TABLE contracts
    ALTER COLUMN tuition_discount_reason TYPE TEXT,
    ALTER COLUMN tuition_discount_type TYPE TEXT,
    ALTER COLUMN material_start_due_date TYPE VARCHAR(100),
    ALTER COLUMN material_end_due_date TYPE VARCHAR(100);

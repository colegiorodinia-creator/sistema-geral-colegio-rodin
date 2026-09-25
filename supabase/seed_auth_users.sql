-- ======================================================================
-- COLÉGIO RODIN — CARGA DE USUÁRIOS NO SUPABASE AUTH (auth.users)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- Dashboard -> SQL Editor -> New Query -> Paste -> Run
-- ======================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Inserir/Atualizar Usuários do Sistema na Tabela nativa de Autenticação do Supabase (auth.users)
DO $$
DECLARE
    users_data JSONB := '[
        {
            "id": "a0000000-0000-0000-0000-000000000001",
            "email": "matheus.admin@colegiorodin.com.br",
            "name": "Matheus Brandão",
            "role": "admin",
            "role_label": "Administrador Geral"
        },
        {
            "id": "a0000000-0000-0000-0000-000000000002",
            "email": "helena.direcao@colegiorodin.com.br",
            "name": "Profa. Dra. Helena Siqueira",
            "role": "director",
            "role_label": "Diretora Pedagógica"
        },
        {
            "id": "a0000000-0000-0000-0000-000000000003",
            "email": "carlos.coord@colegiorodin.com.br",
            "name": "Prof. Carlos Eduardo",
            "role": "coordinator",
            "role_label": "Coordenador EM"
        },
        {
            "id": "a0000000-0000-0000-0000-000000000004",
            "email": "patricia.secretaria@colegiorodin.com.br",
            "name": "Patrícia Alcantara",
            "role": "secretary",
            "role_label": "Secretaria Escolar"
        },
        {
            "id": "a0000000-0000-0000-0000-000000000005",
            "email": "lucas.matriculas@colegiorodin.com.br",
            "name": "Lucas Vasconcelos",
            "role": "enrollment",
            "role_label": "Setor de Matrículas"
        },
        {
            "id": "a0000000-0000-0000-0000-000000000008",
            "email": "kelly.vilani@colegiorodin.com.br",
            "name": "Kelly Cristina Vilani",
            "role": "enrollment",
            "role_label": "Setor de Matrículas"
        },
        {
            "id": "a0000000-0000-0000-0000-000000000009",
            "email": "elisangela.santos@colegiorodin.com.br",
            "name": "Elisangela Cordeiro Santos",
            "role": "enrollment",
            "role_label": "Setor de Matrículas"
        },
        {
            "id": "a0000000-0000-0000-0000-000000000006",
            "email": "andre.prof@colegiorodin.com.br",
            "name": "Prof. André Castilho",
            "role": "teacher",
            "role_label": "Professor de Física e Robótica"
        },
        {
            "id": "a0000000-0000-0000-0000-000000000007",
            "email": "wpalmeida@hotmail.com",
            "name": "Wanderson Pedro de Almeida",
            "role": "guardian",
            "role_label": "Responsável Financeiro / Pai"
        }
    ]';
    usr JSONB;
BEGIN
    FOR usr IN SELECT * FROM jsonb_array_elements(users_data)
    LOOP
        -- 1. Inserir em auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            (usr->>'id')::UUID,
            'authenticated',
            'authenticated',
            usr->>'email',
            crypt('rodin2027', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('name', usr->>'name', 'role', usr->>'role'),
            FALSE,
            NOW(),
            NOW(),
            NULL,
            NULL,
            '',
            '',
            '',
            ''
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            updated_at = NOW();

        -- 2. Inserir em public.profiles
        INSERT INTO public.profiles (
            id,
            name,
            email,
            role,
            role_label
        ) VALUES (
            (usr->>'id')::UUID,
            usr->>'name',
            usr->>'email',
            (usr->>'role')::user_role,
            usr->>'role_label'
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            role_label = EXCLUDED.role_label;
    END LOOP;
END $$;

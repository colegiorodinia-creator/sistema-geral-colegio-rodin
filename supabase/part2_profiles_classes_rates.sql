INSERT INTO profiles (id, name, email, role, role_label, avatar_url) VALUES
('a0000000-0000-0000-0000-000000000001', 'Matheus Brandão', 'matheus.admin@colegiorodin.com.br', 'admin', 'Administrador Geral', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
('a0000000-0000-0000-0000-000000000002', 'Profa. Dra. Helena Siqueira', 'helena.direcao@colegiorodin.com.br', 'director', 'Diretora Pedagógica', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
('a0000000-0000-0000-0000-000000000003', 'Prof. Carlos Eduardo', 'carlos.coord@colegiorodin.com.br', 'coordinator', 'Coordenador EM', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
('a0000000-0000-0000-0000-000000000004', 'Patrícia Alcantara', 'patricia.secretaria@colegiorodin.com.br', 'secretary', 'Secretaria Escolar', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
('a0000000-0000-0000-0000-000000000005', 'Lucas Vasconcelos', 'lucas.matriculas@colegiorodin.com.br', 'enrollment', 'Setor de Matrículas', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
('a0000000-0000-0000-0000-000000000006', 'Prof. André Castilho', 'andre.prof@colegiorodin.com.br', 'teacher', 'Professor de Física e Robótica', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
('a0000000-0000-0000-0000-000000000007', 'Wanderson Pedro de Almeida', 'wpalmeida@hotmail.com', 'guardian', 'Responsável Financeiro / Pai', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fixed_grade_rates (grade_segment, segment_label, tuition_annual, material_total, tuition_installments, material_installments, tuition_installment_value, material_installment_value) VALUES
('ef_6_to_9', '6º ao 9º ano do Ensino Fundamental', 34663.20, 5248.80, 13, 12, 2666.40, 437.40),
('em_1_and_2', '1ª e 2ª série do Ensino Médio', 37752.00, 5338.20, 13, 12, 2904.00, 444.85),
('terceirao', 'Terceirão (3ª série EM / Pré-Vestibular)', 43243.20, 7575.60, 13, 12, 3326.40, 631.30)
ON CONFLICT (grade_segment) DO NOTHING;

INSERT INTO classes (id, code_id, name, grade_level, academic_year, room_code, student_count) VALUES
('47606c30-5621-50d1-b297-ad481ffc7b20', 'cls-7ef-c', '7º Ano EF C - Ensino Fundamental', '7º Ano EF', 2027, 'SALA-101', 30),
('73eaddfd-bebb-5522-9cd4-4090c61573f2', 'cls-7ef-d', '7º Ano EF D - Ensino Fundamental', '7º Ano EF', 2027, 'SALA-102', 25),
('5c270a02-5598-57cd-9f95-8ab4994182e4', 'cls-7ef-a', '7º Ano EF A - Ensino Fundamental', '7º Ano EF', 2027, 'SALA-103', 31),
('eada4a5e-c987-55bb-a96b-a4e8e518fcaf', 'cls-7ef-b', '7º Ano EF B - Ensino Fundamental', '7º Ano EF', 2027, 'SALA-104', 30),
('4c40639f-3131-5806-aa61-ad20d28ff2ea', 'cls-8ef-a', '8º Ano EF A - Ensino Fundamental', '8º Ano EF', 2027, 'SALA-105', 35),
('b2276650-bc68-5f08-a8d6-69c464a23ea3', 'cls-8ef-b', '8º Ano EF B - Ensino Fundamental', '8º Ano EF', 2027, 'SALA-106', 35),
('ee0d5923-153d-5540-8c8e-7a37554a7614', 'cls-8ef-c', '8º Ano EF C - Ensino Fundamental', '8º Ano EF', 2027, 'SALA-107', 26),
('11116494-c3b1-59d1-8a40-3b21ca0c5192', 'cls-8ef-d', '8º Ano EF D - Ensino Fundamental', '8º Ano EF', 2027, 'SALA-108', 21),
('c69b70e6-ce0c-5a0c-a148-d47dcb6b8b5d', 'cls-9ef-c', '9º Ano EF C - Ensino Fundamental', '9º Ano EF', 2027, 'SALA-109', 28),
('bd6b1b99-f3db-520b-b9c0-6ba898720635', 'cls-9ef-b', '9º Ano EF B - Ensino Fundamental', '9º Ano EF', 2027, 'SALA-110', 34),
('d7563f9c-03f5-5df8-b254-985ad6b0d7ee', 'cls-9ef-a', '9º Ano EF A - Ensino Fundamental', '9º Ano EF', 2027, 'SALA-111', 39),
('a682f1e0-fee8-5a25-8fa7-d9eff828eafd', 'cls-9ef-d', '9º Ano EF D - Ensino Fundamental', '9º Ano EF', 2027, 'SALA-112', 16),
('563723f0-9a30-5731-b27e-c16f1b1cb145', 'cls-1em-d', '1ª Série EM D - Ensino Médio', '1ª Série EM', 2027, 'SALA-113', 32),
('0a591e88-ba17-5d08-baca-e750f9e683c2', 'cls-1em-b', '1ª Série EM B - Ensino Médio', '1ª Série EM', 2027, 'SALA-114', 30),
('ad79e804-e903-5d83-b1f7-3a1fa359a079', 'cls-1em-c', '1ª Série EM C - Ensino Médio', '1ª Série EM', 2027, 'SALA-115', 28),
('eb3c960b-2f70-5485-a190-a62e2f304a9f', 'cls-1em-a', '1ª Série EM A - Ensino Médio', '1ª Série EM', 2027, 'SALA-116', 42),
('a316f4b2-de05-5999-9547-e4b9fd16a730', 'cls-2em-b', '2ª Série EM B - Ensino Médio', '2ª Série EM', 2027, 'SALA-117', 36),
('c5aaeddc-d10f-5be0-ba4e-3459da3296d6', 'cls-2em-a', '2ª Série EM A - Ensino Médio', '2ª Série EM', 2027, 'SALA-118', 37),
('1c87f839-ac58-5630-89ae-3bbbea4c5668', 'cls-2em-c', '2ª Série EM C - Ensino Médio', '2ª Série EM', 2027, 'SALA-119', 38),
('55184ba3-cad3-555d-80ac-c802c801c4fe', 'cls-3em-b', '3ª Série EM B - Ensino Médio', '3ª Série EM', 2027, 'SALA-120', 46),
('26c0ec92-db99-564d-9759-05553c36ff78', 'cls-3em-a', '3ª Série EM A - Ensino Médio', '3ª Série EM', 2027, 'SALA-121', 49),
('fb119ae6-bbf6-519f-a6cd-3f6b3813f83f', 'cls-pré-vestibularppv-a', 'Pré-Vestibular (PPV) A - Pré-Vestibular', 'Pré-Vestibular (PPV)', 2027, 'SALA-122', 65)
ON CONFLICT (code_id) DO NOTHING;

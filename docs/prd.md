# PRD — Sistema Integrado de Gestão Escolar e Matrículas (Supabase-Native)
**Colégio Rodin**

---

## 1. Metadados do Projeto

| Atributo | Detalhe |
| :--- | :--- |
| **Produto** | Sistema Integrado de Gestão Escolar e Matrículas Rodin |
| **Versão** | 1.0.0 (MVP Fase 1 + Módulos Fases 2 e 3) |
| **Domínio Previsto** | `sistema.colegiorodin.tech` / `gestao.colegiorodin.tech` |
| **Stack Principal** | React 18, Vite, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage, Edge Functions, RLS) |
| **Data de Emissão** | 31 de Agosto de 2026 |
| **Status** | Em Desenvolvimento / Homologação |

---

## 2. Visão Geral e Contexto Estratégico

### 2.1 Problema e Oportunidade
A fragmentação de softwares escolares legados, combinada com o uso de ferramentas terceirizadas de assinatura digital (com cobranças recorrentes por documento) e planilhas desconectadas, gera:
1. **Custos operacionais elevados** com taxas de assinatura externa.
2. **Perda de integridade cadastral** entre o setor de admissão e o fechamento pedagógico.
3. **Lentidão e atrito na comunicação** entre a sala de aula, coordenação, secretaria e famílias.

### 2.2 Proposta de Valor
Construção de uma plataforma proprietária, autocontida e 100% nativa em infraestrutura própria, utilizando o **Supabase** como espinha dorsal relacional e de segurança. A plataforma unifica toda a jornada acadêmica e administrativa em um único banco de dados com:
- **Custo Marginal Zero:** Motor interno de validação criptográfica (SHA-256 e canvas nativo), eliminando intermediários externos.
- **Integridade Operacional:** Relacionamentos estritos entre candidatos, múltiplos responsáveis (financeiro e pedagógico), matrículas, turmas, notas e boletins.
- **Segurança a Nível de Linha (RLS):** Governança estrita no PostgreSQL garantindo que coordenadores, professores e famílias acessem apenas os registros pertinentes.

---

## 3. Personas e Matriz de Acessos (RBAC via Supabase RLS)

| Perfil | Dispositivo Primário | Escopo de Acesso e Responsabilidades |
| :--- | :--- | :--- |
| **Admin** | Desktop | Acesso irrestrito a configurações de infraestrutura, auditoria e parametrizações globais. |
| **Diretor(a)** | Desktop / Tablet | Visão holística da instituição, criação de matrizes avaliativas, banco de questões e delegação de turmas para coordenadores. |
| **Coordenador(a)** | Desktop / Tablet | Acesso restrito às turmas sob sua responsabilidade formal; acompanhamento comportamental, notas e presenças em tempo real. |
| **Secretaria** | Desktop | Fechamento acadêmico, controle de notas, cadastro de professores, emissão em lote de boletins e históricos oficiais. |
| **Setor de Matrículas**| Desktop / Tablet | Cadastro de candidatos e responsáveis, emissão de contratos e disparo de links seguros para assinatura eletrônica. |
| **Professor(a)** | Tablet / Mobile | App de sala de aula: chamada rápida de presença de 1 toque, diário de ocorrências disciplinares e submissão de tarefas/questões. |
| **Aluno / Responsável**| Mobile / Web | Acesso ao portal do estudante/família: consulta a boletins, faltas, comunicados e contratos assinados com selo de integridade. |

---

## 4. Módulos do Sistema e Regras de Negócio

### 4.1 Módulo do Setor de Matrículas e Admissão
1. **Cadastro Guiado:** Coleta dos dados do aluno (Nome, CPF, RG, Data de Nascimento, Série Pretendida) e múltiplos responsáveis.
2. **Separação de Responsabilidades:** Identificação explícita do Responsável Financeiro e do Responsável Pedagógico (podendo ser a mesma pessoa ou distintas).
3. **Geração Automática do Contrato:** Compilação das cláusulas contratuais pedagógicas com valores textuais parametrizados.
4. **Ciclo de Vida da Matrícula:** Transição de estados: `draft` -> `pending_signature` -> `active` (ou `cancelled`).

### 4.2 Motor Nativo de Assinatura Eletrônica (Supabase-Powered)
1. **Conformidade Legal:** Atendimento à Medida Provisória nº 2.200-2/2001 e Lei Federal nº 14.063/2020 para assinaturas avançadas/eletrônicas.
2. **Acesso com Token Único (OTP):** Envio de link seguro temporário para o e-mail/WhatsApp do responsável signatário.
3. **Captura no Canvas HTML5:** Assinatura manuscrita ou rubrica desenhada via tela touch ou cursor do mouse.
4. **Captura de Telemetria e Auditoria:** Registro de IP de origem, porta de conexão, User-Agent do dispositivo e timestamp UTC milissegundo.
5. **Cálculo Criptográfico SHA-256:** Geração do hash do documento e da assinatura via WebCrypto API / Edge Functions.
6. **Selamento em PDF:** Anexação da Folha de Assinaturas (Audit Trail) ao documento e armazenamento no bucket privado do Supabase Storage.

### 4.3 App de Sala de Aula e Diário de Bordo (Professor)
1. **Otimização para Tablet / Mobile:** Interface touch-friendly rápida com grid de alunos e fotos.
2. **Chamada Rápida de 1 Toque:** Registro de Presença (`present`), Falta (`absent`) ou Falta Justificada (`excused`).
3. **Registro de Ocorrências Disciplinares:** Categorização imediata: `attendance`, `behavior_positive` (elogio), `behavior_warning` (advertência), `observation` (observação pedagógica).
4. **Envio de Tarefas e Propostas de Questões:** Envio direto para o banco de avaliações supervisionado pela Direção.

### 4.4 Painel da Coordenação Pedagógica (RLS Ativo)
1. **Filtro de Turmas Delegadas:** Visualização exclusiva das ocorrências e registros das turmas atribuídas formalmente pela Direção.
2. **Raio-X do Aluno:** Linha do tempo comportamental, histórico de faltas e alertas de intervenção preventiva.
3. **Acompanhamento de Médias:** Indicadores de desempenho por disciplina e turma.

### 4.5 Direção Escolar e Banco de Provas
1. **Visão Holística:** Métricas consolidadas de matrículas ativas, frequência global e ocorrências da instituição.
2. **Delegação de Turmas:** Atribuição dinâmica de coordenadores para cada turma do ano letivo.
3. **Banco de Questões e Montador de Avaliações:** Criação de matrizes avaliativas e geração de provas padronizadas.

### 4.6 Secretaria Escolar e Fechamento Acadêmico
1. **Lançamento e Consolidação de Notas:** Registro bimestral/trimestral com cálculo ponderado de médias.
2. **Emissão em Lote de Boletins Escolares em PDF:** Geração de boletins oficiais com identidade visual oficial do Colégio Rodin.
3. **Gestão de Registros Oficiais:** Históricos escolares e transferências.

### 4.7 Portal do Aluno e Responsável
1. **Painel Transparente:** Acesso do estudante e dos pais a notas, faltas acumuladas, comunicados e ocorrências registradas.
2. **Visualizador de Contratos:** Download do contrato de matrícula selado com a folha de auditoria criptográfica.

---

## 5. Arquitetura Técnica e Entidades de Banco de Dados

### 5.1 Entidades Principais
- `profiles`: Usuários do sistema vinculados ao `auth.users` com seus respectivos papéis (`user_role`).
- `students`: Dados cadastrais do estudante (`enrollment_code`, `birth_date`, `cpf`, `current_grade`).
- `guardians`: Dados dos responsáveis legais (`cpf`, `phone`, `relationship_type`).
- `student_guardians`: Tabela associativa com flags `is_financial_responsible` e `is_pedagogical_responsible`.
- `enrollments`: Matrículas por ano letivo com status operacional (`draft`, `pending_signature`, `active`, `cancelled`).
- `contracts`: Registro de contratos em PDF, caminho no Supabase Storage e hash `document_sha256`.
- `contract_signatures`: Trilha de auditoria criptográfica com `ip_address`, `user_agent`, `signed_at`, `signature_sha256` e imagem do canvas.
- `classes`: Turmas com vínculo formal de `coordinator_id`.
- `classroom_logs`: Diário de bordo e registros de frequência/comportamento em sala.
- `question_bank` e `assessments`: Banco de itens e instrumentos de avaliação.
- `student_grades`: Notas e médias consolidadas por avaliação e aluno.

---

## 6. Mapeamento de Rotas HTTP e Ações do Sistema

| Método | Caminho / Rota | Perfil Autorizado | Finalidade Operacional |
| :--- | :--- | :--- | :--- |
| `GET` | `/#matriculas` | Matrículas, Admin, Direção | Listagem e acompanhamento de status de matrículas |
| `POST` | `/#matriculas/nova` | Matrículas, Admin | Cadastro de aluno, responsáveis e geração de minuta contratual |
| `GET` | `/#assinar/:contractId` | Público / Signatário (OTP) | Tela responsiva de validação e assinatura digital em canvas |
| `POST` | `/#assinar/selar` | Edge Function / Sistema | Selamento com IP, User-Agent, SHA-256 e atualização para `active` |
| `GET` | `/#diario-classe` | Professor, Direção, Coordenação | Interface tablet para chamada rápida e registro comportamental |
| `GET` | `/#coordenacao` | Coordenador, Diretor, Admin | Feed de ocorrências filtrado por turmas delegadas e Raio-X |
| `GET` | `/#direcao` | Diretor, Admin | Visão geral institucional, delegação de turmas e banco de questões |
| `GET` | `/#secretaria` | Secretaria, Diretor, Admin | Consolidação de notas e emissão em lote de Boletins em PDF |
| `GET` | `/#portal-familia` | Aluno, Responsável | Consulta a notas, faltas, tarefas e contratos selados |
| `GET` | `/#admin` | Admin | Gestão de permissões de usuários e logs de auditoria |

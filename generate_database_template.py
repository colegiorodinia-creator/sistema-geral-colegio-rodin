import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_enrollment_database_template():
    wb = openpyxl.Workbook()
    
    # -------------------------------------------------------------
    # ABA 1: MODELO DE BANCO DE DADOS PARA IMPORTAÇÃO / REMATRÍCULA
    # -------------------------------------------------------------
    ws1 = wb.active
    ws1.title = "Base_Rematricula_Rodin"
    ws1.views.sheetView[0].showGridLines = True

    # Cores Institucionais
    header_fill_estudante = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")  # Azul Escuro
    header_fill_responsavel = PatternFill(start_color="0F766E", end_color="0F766E", fill_type="solid") # Verde Petróleo
    header_fill_anuidade = PatternFill(start_color="EA580C", end_color="EA580C", fill_type="solid")    # Laranja Rodin
    header_fill_material = PatternFill(start_color="4338CA", end_color="4338CA", fill_type="solid")    # Índigo / Livraria
    header_fill_status = PatternFill(start_color="334155", end_color="334155", fill_type="solid")      # Cinza Escuro

    cat_fill_estudante = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    cat_fill_responsavel = PatternFill(start_color="CCFBF1", end_color="CCFBF1", fill_type="solid")
    cat_fill_anuidade = PatternFill(start_color="FFEDD5", end_color="FFEDD5", fill_type="solid")
    cat_fill_material = PatternFill(start_color="E0E7FF", end_color="E0E7FF", fill_type="solid")
    cat_fill_status = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")

    font_title = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
    font_cat = Font(name="Calibri", size=11, bold=True, color="1E293B")
    font_header = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    font_data = Font(name="Calibri", size=10, color="0F172A")
    font_data_bold = Font(name="Calibri", size=10, bold=True, color="0F172A")

    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    # Definição das colunas com Metadados
    columns_spec = [
        # ETAPA 1: DADOS DO ESTUDANTE (Azul Escuro)
        {"col": "rm_numero", "label": "RM (Código Aluno)*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 16, "align": "center"},
        {"col": "ano_letivo", "label": "Ano Letivo*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 12, "align": "center"},
        {"col": "nome_completo_estudante", "label": "Nome Completo do Estudante*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 35, "align": "left"},
        {"col": "serie_ano_atual", "label": "Série Atual", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 16, "align": "center"},
        {"col": "nova_serie_ano_2027", "label": "Nova Série (2027)*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 18, "align": "center"},
        {"col": "nivel_ensino", "label": "Nível de Ensino*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 20, "align": "left"},
        {"col": "periodo_turno", "label": "Turno / Período*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 15, "align": "center"},
        {"col": "turma", "label": "Turma", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 10, "align": "center"},
        {"col": "sexo_estudante", "label": "Sexo*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 10, "align": "center"},
        {"col": "data_nascimento_estudante", "label": "Data Nascimento*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 16, "align": "center"},
        {"col": "naturalidade_cidade", "label": "Cidade Nascimento*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 20, "align": "left"},
        {"col": "naturalidade_uf", "label": "UF Nascimento*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 15, "align": "center"},
        {"col": "nacionalidade_estudante", "label": "Nacionalidade*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 18, "align": "center"},
        {"col": "rg_estudante", "label": "RG Estudante", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 16, "align": "center"},
        {"col": "orgao_emissor_rg_estudante", "label": "Órgão Emissor RG", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 16, "align": "center"},
        {"col": "data_emissao_rg_estudante", "label": "Data Emissão RG", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 16, "align": "center"},
        {"col": "cpf_estudante", "label": "CPF Estudante*", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 18, "align": "center"},
        {"col": "celular_whatsapp_estudante", "label": "Celular Estudante", "cat": "1. DADOS ACADÊMICOS E ESTUDANTE", "fill": header_fill_estudante, "width": 18, "align": "center"},

        # ETAPA 2: RESPONSÁVEL FINANCEIRO & ENDEREÇO (Verde Petróleo)
        {"col": "nome_responsavel_financeiro", "label": "Nome Responsável Financeiro*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 35, "align": "left"},
        {"col": "parentesco_responsavel", "label": "Parentesco*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 14, "align": "center"},
        {"col": "sexo_responsavel", "label": "Sexo Responsável*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 16, "align": "center"},
        {"col": "data_nascimento_responsavel", "label": "Data Nasc. Responsável", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 20, "align": "center"},
        {"col": "profissao_responsavel", "label": "Profissão", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 20, "align": "left"},
        {"col": "estado_civil_responsavel", "label": "Estado Civil", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 16, "align": "center"},
        {"col": "nacionalidade_responsavel", "label": "Nacionalidade Resp.", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 18, "align": "center"},
        {"col": "rg_responsavel", "label": "RG Responsável", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 16, "align": "center"},
        {"col": "orgao_emissor_rg_responsavel", "label": "Órgão RG Resp.", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 15, "align": "center"},
        {"col": "cpf_responsavel_financeiro", "label": "CPF Responsável*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 18, "align": "center"},
        {"col": "email_responsavel", "label": "E-mail Responsável*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 30, "align": "left"},
        {"col": "celular_whatsapp_responsavel", "label": "WhatsApp Responsável*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 20, "align": "center"},
        {"col": "cep_endereco", "label": "CEP Residencial*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 16, "align": "center"},
        {"col": "logradouro_endereco", "label": "Logradouro (Rua/Av)*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 35, "align": "left"},
        {"col": "numero_endereco", "label": "Número*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 10, "align": "center"},
        {"col": "complemento_endereco", "label": "Complemento", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 16, "align": "left"},
        {"col": "bairro_endereco", "label": "Bairro*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 22, "align": "left"},
        {"col": "cidade_endereco", "label": "Cidade*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 18, "align": "left"},
        {"col": "uf_endereco", "label": "UF Estado*", "cat": "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", "fill": header_fill_responsavel, "width": 10, "align": "center"},

        # ETAPA 3: ANUIDADE ESCOLAR E CONDIÇÕES FINANCEIRAS (Laranja Rodin)
        {"col": "valor_total_anuidade", "label": "Valor Total Anuidade (R$)*", "cat": "3. ANUIDADE ESCOLAR E FINANCEIRO", "fill": header_fill_anuidade, "width": 24, "align": "right"},
        {"col": "plano_pagamento_anuidade", "label": "Plano Pagamento (Nº Parc.)*", "cat": "3. ANUIDADE ESCOLAR E FINANCEIRO", "fill": header_fill_anuidade, "width": 24, "align": "center"},
        {"col": "valor_1a_parcela", "label": "Valor 1ª Parcela (R$)*", "cat": "3. ANUIDADE ESCOLAR E FINANCEIRO", "fill": header_fill_anuidade, "width": 20, "align": "right"},
        {"col": "parcelamento_1a_parcela", "label": "Divisão 1ª Parc (1 a 3x)", "cat": "3. ANUIDADE ESCOLAR E FINANCEIRO", "fill": header_fill_anuidade, "width": 22, "align": "center"},
        {"col": "dia_vencimento_1a_parcela", "label": "Venc. 1ª Parcela (Dia)", "cat": "3. ANUIDADE ESCOLAR E FINANCEIRO", "fill": header_fill_anuidade, "width": 20, "align": "center"},
        {"col": "valor_demais_parcelas", "label": "Valor Demais Parcelas (R$)", "cat": "3. ANUIDADE ESCOLAR E FINANCEIRO", "fill": header_fill_anuidade, "width": 22, "align": "right"},
        {"col": "dia_vencimento_demais_parcelas", "label": "Venc. Demais Parc (Dia)", "cat": "3. ANUIDADE ESCOLAR E FINANCEIRO", "fill": header_fill_anuidade, "width": 22, "align": "center"},
        {"col": "data_pagamento_avista", "label": "Data Pgto À Vista", "cat": "3. ANUIDADE ESCOLAR E FINANCEIRO", "fill": header_fill_anuidade, "width": 18, "align": "center"},

        # ETAPA 4: MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR) (Índigo)
        {"col": "comprador_material_mesmo_responsavel", "label": "Comprador = Resp Fin?*", "cat": "4. MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR)", "fill": header_fill_material, "width": 22, "align": "center"},
        {"col": "nome_comprador_material", "label": "Nome Comprador Material", "cat": "4. MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR)", "fill": header_fill_material, "width": 30, "align": "left"},
        {"col": "cpf_comprador_material", "label": "CPF Comprador Material", "cat": "4. MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR)", "fill": header_fill_material, "width": 22, "align": "center"},
        {"col": "valor_total_material", "label": "Valor Total Material (R$)*", "cat": "4. MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR)", "fill": header_fill_material, "width": 22, "align": "right"},
        {"col": "numero_parcelas_material", "label": "Parcelas Material*", "cat": "4. MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR)", "fill": header_fill_material, "width": 18, "align": "center"},
        {"col": "dia_vencimento_material", "label": "Vencimento Material (Dia)*", "cat": "4. MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR)", "fill": header_fill_material, "width": 24, "align": "center"},

        # ETAPA 5: STATUS DOS CONTRATOS (Cinza Escuro)
        {"col": "status_contrato_escolar", "label": "Status Contrato Escolar", "cat": "5. CONTRATOS & STATUS", "fill": header_fill_status, "width": 22, "align": "center"},
        {"col": "status_contrato_material", "label": "Status Contrato Material", "cat": "5. CONTRATOS & STATUS", "fill": header_fill_status, "width": 22, "align": "center"}
    ]

    # Linha 1: Cabeçalho de Categoria / Seção do Formulário
    # Linha 2: Nome Amigável do Campo
    # Linha 3: Código do Campo no Banco de Dados (DB Field Key)
    
    current_cat = None
    cat_start_col = 1
    
    for idx, col in enumerate(columns_spec, start=1):
        # Linha 2: Nome do campo
        c2 = ws1.cell(row=2, column=idx, value=col["label"])
        c2.fill = col["fill"]
        c2.font = font_header
        c2.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c2.border = thin_border

        # Linha 3: Identificador técnico do BD
        c3 = ws1.cell(row=3, column=idx, value=col["col"])
        c3.fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
        c3.font = Font(name="Consolas", size=9, bold=True, color="64748B")
        c3.alignment = Alignment(horizontal="center", vertical="center")
        c3.border = thin_border

        # Ajuste de largura da coluna
        col_letter = get_column_letter(idx)
        ws1.column_dimensions[col_letter].width = col["width"]

    # Mesclar Categorias na Linha 1
    cat_ranges = [
        (1, 18, "1. DADOS DO ESTUDANTE E ACADÊMICOS", cat_fill_estudante, "1E293B"),
        (19, 37, "2. RESPONSÁVEL FINANCEIRO E ENDEREÇO", cat_fill_responsavel, "0F766E"),
        (38, 45, "3. ANUIDADE ESCOLAR (CONDIÇÕES FINANCEIRAS)", cat_fill_anuidade, "EA580C"),
        (46, 51, "4. PEDIDO MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR)", cat_fill_material, "4338CA"),
        (52, 53, "5. STATUS DOS CONTRATOS", cat_fill_status, "334155")
    ]

    for start_c, end_c, title, fill, color_hex in cat_ranges:
        ws1.merge_cells(start_row=1, start_column=start_c, end_row=1, end_column=end_c)
        cell = ws1.cell(row=1, column=start_c, value=title)
        cell.font = Font(name="Calibri", size=11, bold=True, color=color_hex)
        cell.alignment = Alignment(horizontal="center", vertical="center")
        for col_idx in range(start_c, end_c + 1):
            c = ws1.cell(row=1, column=col_idx)
            c.fill = fill
            c.border = thin_border

    ws1.row_dimensions[1].height = 28
    ws1.row_dimensions[2].height = 30
    ws1.row_dimensions[3].height = 20

    # -------------------------------------------------------------
    # LINHAS DE EXEMPLO COM DADOS REAIS DO SISTEMA COLÉGIO RODIN
    # -------------------------------------------------------------
    rows_data = [
        # Exemplo 1: Christian (Padrão 13x - EF para 9º Ano EF)
        [
            2553, 2027, "Christian Pereira Machado de Campos", "8º Ano EF", "9º Ano EF",
            "Ensino Fundamental", "Manhã", "A", "Masc.", "15/04/2012", "Indaiatuba", "SP", "Brasileiro(a)",
            "58.912.443-8", "SSP/SP", "20/05/2019", "482.910.338-12", "(19) 99425-0269",
            "Natan Machado de Campos Neto", "Pai", "Masc.", "12/08/1982", "Engenheiro Civil", "Casado(a)", "Brasileiro(a)",
            "28.344.112-9", "SSP/SP", "247.950.638-00", "natanneto2000@gmail.com", "(19) 99425-0269",
            "13330-000", "Homero Paulo Lourenço Barnabé", "345", "", "Parque São Lourenço", "Indaiatuba", "SP",
            34663.20, "13", 2666.40, 1, "10", 2666.40, "10", "",
            "SIM", "", "", 5248.80, 12, "10",
            "Assinado", "Pendente"
        ],
        # Exemplo 2: Matheus Milani (À Vista com 5% de desconto - Ensino Médio)
        [
            2560, 2027, "Matheus Milani", "9º Ano EF", "1ª Série EM",
            "Ensino Médio", "Manhã", "B", "Masc.", "08/11/2011", "Indaiatuba", "SP", "Brasileiro(a)",
            "56.882.129-4", "SSP/SP", "14/02/2018", "491.829.118-90", "(19) 98120-6515",
            "Wanderson Pedro de Almeida", "Pai", "Masc.", "04/03/1979", "Empresário", "Casado(a)", "Brasileiro(a)",
            "26.119.824-7", "SSP/SP", "57.786.608-4", "wpalmeida@hotmail.com", "(19) 98120-6515",
            "13340-020", "Rua Almerinda Benedita Pacheco de Alcantara", "160", "Casa", "Jardim Jequitibá", "Indaiatuba", "SP",
            37752.00, "1_avista_5off", 35864.40, 1, "", 0.00, "", "16/09/2026",
            "SIM", "", "", 5338.20, 12, "10",
            "Assinado", "Assinado"
        ],
        # Exemplo 3: Letícia Carli (13x com Comprador de Material Diferente)
        [
            2564, 2027, "Letícia Carli Medeiros Silva", "6º Ano EF", "7º Ano EF",
            "Ensino Fundamental", "Tarde", "A", "Fem.", "22/09/2014", "Campinas", "SP", "Brasileiro(a)",
            "60.118.992-1", "SSP/SP", "10/10/2020", "512.441.988-34", "(19) 98121-9200",
            "Yhalle Batista de Lucena", "Pai", "Masc.", "19/07/1985", "Advogado", "Casado(a)", "Brasileiro(a)",
            "31.884.219-0", "SSP/SP", "084.261.824-45", "yhalle07@gmail.com", "(19) 98121-9200",
            "13334-110", "Rua Honduras", "134", "Apto 12", "Jardim América", "Indaiatuba", "SP",
            34663.20, "13", 2666.40, 1, "10", 2666.40, "10", "",
            "NÃO", "Renata Medeiros Silva", "184.992.338-10", 5248.80, 12, "10",
            "Pendente", "Pendente"
        ]
    ]

    for row_idx, r_data in enumerate(rows_data, start=4):
        ws1.row_dimensions[row_idx].height = 24
        for col_idx, val in enumerate(r_data, start=1):
            cell = ws1.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_data
            cell.border = thin_border
            align_h = columns_spec[col_idx - 1]["align"]
            cell.alignment = Alignment(horizontal=align_h, vertical="center")
            if isinstance(val, (int, float)) and col_idx in [38, 40, 43, 49]:
                cell.number_format = '#,##0.00'

    # -------------------------------------------------------------
    # ABA 2: DICIONÁRIO DE DADOS E MANUAL DE PREENCHIMENTO
    # -------------------------------------------------------------
    ws2 = wb.create_sheet(title="Dicionario_e_Instrucoes")
    ws2.views.sheetView[0].showGridLines = True

    dict_headers = ["Nº", "Nome da Coluna (Técnico)", "Título Visível", "Categoria", "Tipo de Dado", "Obrigatório?", "Exemplo de Preenchimento", "Orientações e Regras de Validação"]
    ws2.row_dimensions[1].height = 28
    for c_idx, h_name in enumerate(dict_headers, start=1):
        cell = ws2.cell(row=1, column=c_idx, value=h_name)
        cell.font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    dict_rows = [
        # ETAPA 1
        (1, "rm_numero", "RM (Código Aluno)*", "1. Estudante", "Inteiro", "SIM", "2553", "Código de registro de matrícula do aluno. Identificador primário."),
        (2, "ano_letivo", "Ano Letivo*", "1. Estudante", "Inteiro", "SIM", "2027", "Ano letivo da rematrícula. Padrão: 2027."),
        (3, "nome_completo_estudante", "Nome Completo do Estudante*", "1. Estudante", "Texto", "SIM", "Christian Pereira Machado de Campos", "Nome civil completo do estudante."),
        (4, "serie_ano_atual", "Série Atual", "1. Estudante", "Texto", "NÃO", "8º Ano EF", "Série cursada em 2026."),
        (5, "nova_serie_ano_2027", "Nova Série (2027)*", "1. Estudante", "Texto", "SIM", "9º Ano EF", "Série a ser cursada em 2027."),
        (6, "nivel_ensino", "Nível de Ensino*", "1. Estudante", "Texto", "SIM", "Ensino Fundamental", "Ensino Fundamental ou Ensino Médio."),
        (7, "periodo_turno", "Turno / Período*", "1. Estudante", "Texto", "SIM", "Manhã", "Manhã ou Tarde."),
        (8, "turma", "Turma", "1. Estudante", "Texto", "NÃO", "A", "Letra da turma (A, B, C, etc.)."),
        (9, "sexo_estudante", "Sexo*", "1. Estudante", "Texto", "SIM", "Masc.", "Masc. ou Fem."),
        (10, "data_nascimento_estudante", "Data Nascimento*", "1. Estudante", "Data / Texto", "SIM", "15/04/2012", "Data de nascimento no formato DD/MM/AAAA."),
        (11, "naturalidade_cidade", "Cidade Nascimento*", "1. Estudante", "Texto", "SIM", "Indaiatuba", "Município onde nasceu o aluno."),
        (12, "naturalidade_uf", "UF Nascimento*", "1. Estudante", "Texto (2 carac.)", "SIM", "SP", "Sigla do estado natal."),
        (13, "nacionalidade_estudante", "Nacionalidade*", "1. Estudante", "Texto", "SIM", "Brasileiro(a)", "Padrão: Brasileiro(a)."),
        (14, "rg_estudante", "RG Estudante", "1. Estudante", "Texto", "NÃO", "58.912.443-8", "Número do RG do estudante."),
        (15, "orgao_emissor_rg_estudante", "Órgão Emissor RG", "1. Estudante", "Texto", "NÃO", "SSP/SP", "Órgão expedidor do RG."),
        (16, "data_emissao_rg_estudante", "Data Emissão RG", "1. Estudante", "Data / Texto", "NÃO", "20/05/2019", "Data de expedição do RG."),
        (17, "cpf_estudante", "CPF Estudante*", "1. Estudante", "Texto", "SIM", "482.910.338-12", "CPF obrigatório do aluno (com ou sem pontuação)."),
        (18, "celular_estudante", "Celular Estudante", "1. Estudante", "Texto", "NÃO", "(19) 99425-0269", "Telefone do próprio aluno, se houver."),
        
        # ETAPA 2
        (19, "nome_responsavel_financeiro", "Nome Responsável Financeiro", "2. Responsável", "Texto", "SIM", "Natan Machado de Campos Neto", "Nome completo da pessoa que responderá financeiramente pelo contrato escolar."),
        (20, "parentesco_responsavel", "Parentesco", "2. Responsável", "Texto", "SIM", "Pai", "Pai, Mãe ou Responsável Legal."),
        (21, "sexo_responsavel", "Sexo Responsável", "2. Responsável", "Texto", "SIM", "Masc.", "Masc. ou Fem."),
        (22, "data_nascimento_responsavel", "Data Nasc. Responsável", "2. Responsável", "Data / Texto", "NÃO", "12/08/1982", "Data de nascimento do responsável financeiro."),
        (23, "profissao_responsavel", "Profissão", "2. Responsável", "Texto", "NÃO", "Engenheiro Civil", "Profissão declarada no contrato."),
        (24, "estado_civil_responsavel", "Estado Civil", "2. Responsável", "Texto", "NÃO", "Casado(a)", "Casado(a), Solteiro(a), Divorciado(a), União Estável, Viúvo(a)."),
        (25, "nacionalidade_responsavel", "Nacionalidade Resp.", "2. Responsável", "Texto", "SIM", "Brasileiro(a)", "Padrão: Brasileiro(a)."),
        (26, "rg_responsavel", "RG Responsável", "2. Responsável", "Texto", "NÃO", "28.344.112-9", "Documento de identidade do responsável."),
        (27, "orgao_emissor_rg_responsavel", "Órgão RG Resp.", "2. Responsável", "Texto", "NÃO", "SSP/SP", "Órgão expedidor do RG do responsável."),
        (28, "cpf_responsavel_financeiro", "CPF Responsável", "2. Responsável", "Texto", "SIM", "247.950.638-00", "CPF do responsável financeiro (obrigatório para emissão de boletos bancários)."),
        (29, "email_responsavel", "E-mail Responsável", "2. Responsável", "Texto", "SIM", "natanneto2000@gmail.com", "E-mail para envio das notificações, boletos e contratos digitais."),
        (30, "celular_whatsapp_responsavel", "WhatsApp Responsável", "2. Responsável", "Texto", "SIM", "(19) 99425-0269", "Telefone principal de contato e cobrança."),
        (31, "cep_endereco", "CEP Residencial", "2. Responsável", "Texto", "SIM", "13330-000", "CEP da residência do responsável. Dispara busca automática de endereço."),
        (32, "logradouro_endereco", "Logradouro (Rua/Av)", "2. Responsável", "Texto", "SIM", "Homero Paulo Lourenço Barnabé", "Rua, Avenida, Alameda, etc."),
        (33, "numero_endereco", "Número", "2. Responsável", "Texto", "SIM", "345", "Número predial ou 'S/N'."),
        (34, "complemento_endereco", "Complemento", "2. Responsável", "Texto", "NÃO", "Apto 42 / Bloco B", "Complemento de endereço residencial."),
        (35, "bairro_endereco", "Bairro", "2. Responsável", "Texto", "SIM", "Parque São Lourenço", "Bairro do domicílio."),
        (36, "cidade_endereco", "Cidade", "2. Responsável", "Texto", "SIM", "Indaiatuba", "Município de residência."),
        (37, "uf_endereco", "UF Estado", "2. Responsável", "Texto (2 carac.)", "SIM", "SP", "Sigla do estado da residência."),

        # ETAPA 3
        (38, "valor_total_anuidade", "Valor Total Anuidade (R$)", "3. Anuidade", "Decimal", "SIM", "34663.20", "Valor global da anuidade escolar estipulado para a série (ex: 34.663,20 EF, 37.752,00 EM, 43.243,20 Terceirão)."),
        (39, "plano_pagamento_anuidade", "Plano Pagamento", "3. Anuidade", "Texto", "SIM", "13", "Opções: 13 (padrão Rodin), 12, 11, 10, 9, 8, 7, 6 ou '1_avista_5off'."),
        (40, "valor_1a_parcela", "Valor 1ª Parcela (R$)", "3. Anuidade", "Decimal", "SIM", "2666.40", "Valor da 1ª parcela da anuidade (ou parcela única no caso à vista)."),
        (41, "parcelamento_1a_parcela", "Divisão 1ª Parc (1 a 3x)", "3. Anuidade", "Inteiro", "SIM", "1", "Permite dividir a 1ª parcela em 1x, 2x ou 3x (apenas no modo parcelado)."),
        (42, "dia_vencimento_1a_parcela", "Venc. 1ª Parcela (Dia)", "3. Anuidade", "Texto", "SIM", "10", "Dia do mês para vencimento da 1ª parcela (padrão: 10)."),
        (43, "valor_demais_parcelas", "Valor Demais Parcelas (R$)", "3. Anuidade", "Decimal", "SIM", "2666.40", "Valor calculado das parcelas restantes (2ª em diante). Vazio ou 0 se à vista."),
        (44, "dia_vencimento_demais_parcelas", "Venc. Demais Parc (Dia)", "3. Anuidade", "Texto", "SIM", "10", "Dia do vencimento das parcelas mensais restantes (padrão: 10 ou 01)."),
        (45, "data_pagamento_avista", "Data Pgto À Vista", "3. Anuidade", "Data / Texto", "NÃO", "16/09/2026", "Preenchido apenas quando o plano for à vista ('1_avista_5off')."),

        # ETAPA 4
        (46, "comprador_material_mesmo_responsavel", "Comprador = Resp Fin?", "4. Material", "Texto", "SIM", "SIM", "'SIM' se o comprador dos livros for o próprio responsável financeiro; 'NÃO' se for outra pessoa."),
        (47, "nome_comprador_material", "Nome Comprador Material", "4. Material", "Texto", "NÃO", "Renata Medeiros Silva", "Obrigatório apenas se comprador for diferente do responsável financeiro."),
        (48, "cpf_comprador_material", "CPF Comprador Material", "4. Material", "Texto", "NÃO", "184.992.338-10", "Obrigatório apenas se comprador for diferente do responsável financeiro."),
        (49, "valor_total_material", "Valor Total Material (R$)", "4. Material", "Decimal", "SIM", "5248.80", "Valor total do material didático da Livraria do Pensador LTDA (ex: 5.248,80 EF, 5.338,20 EM, 7.575,60 Terceirão)."),
        (50, "numero_parcelas_material", "Parcelas Material", "4. Material", "Inteiro", "SIM", "12", "Número de parcelas do material didático (padrão: 12 ou 6)."),
        (51, "dia_vencimento_material", "Vencimento Material (Dia)", "4. Material", "Texto", "SIM", "10", "Dia de vencimento das parcelas do material (padrão: 10)."),

        # ETAPA 5
        (52, "status_contrato_escolar", "Status Contrato Escolar", "5. Contratos", "Texto", "SIM", "Assinado", "'Assinado' ou 'Pendente'."),
        (53, "status_contrato_material", "Status Contrato Material", "5. Contratos", "Texto", "SIM", "Pendente", "'Assinado' ou 'Pendente'.")
    ]

    for r_idx, d_row in enumerate(dict_rows, start=2):
        ws2.row_dimensions[r_idx].height = 22
        for c_idx, d_val in enumerate(d_row, start=1):
            cell = ws2.cell(row=r_idx, column=c_idx, value=d_val)
            cell.font = font_data
            cell.border = thin_border
            if c_idx in [1, 5, 6]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif c_idx == 2:
                cell.font = font_data_bold
                cell.alignment = Alignment(horizontal="left", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")

    dict_col_widths = [6, 32, 28, 18, 16, 14, 28, 55]
    for i, w in enumerate(dict_col_widths, start=1):
        col_letter = get_column_letter(i)
        ws2.column_dimensions[col_letter].width = w

    # Salvar nos dois destinos
    output_excel_path_root = r"c:\Users\MARKETING 03\Documents\Antigravity\Sistema Geral Colégio Rodin\modelo_banco_dados_rematricula_colegio_rodin.xlsx"
    output_excel_path_public = r"c:\Users\MARKETING 03\Documents\Antigravity\Sistema Geral Colégio Rodin\public\modelo_banco_dados_rematricula_colegio_rodin.xlsx"
    
    wb.save(output_excel_path_root)
    wb.save(output_excel_path_public)
    print("Planilhas salvas com sucesso em:")
    print("1.", output_excel_path_root)
    print("2.", output_excel_path_public)

    # Gerar também uma versão CSV com UTF-8 BOM
    import csv
    output_csv_path = r"c:\Users\MARKETING 03\Documents\Antigravity\Sistema Geral Colégio Rodin\public\modelo_banco_dados_rematricula_colegio_rodin.csv"
    with open(output_csv_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f, delimiter=';')
        writer.writerow([col["label"] for col in columns_spec])
        writer.writerow([col["col"] for col in columns_spec])
        for r in rows_data:
            writer.writerow(r)
    print("3.", output_csv_path)

if __name__ == "__main__":
    create_enrollment_database_template()

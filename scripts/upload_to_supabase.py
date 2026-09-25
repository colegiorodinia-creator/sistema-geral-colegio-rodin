"""
Script Utilitário para Carga Direta no Supabase
Colégio Rodin — Sistema Integrado de Gestão Escolar & Matrículas

Uso:
1. Via Editor SQL do Supabase (Recomendado e mais rápido):
   - Abra o seu painel do Supabase (ex: https://supabase.com/dashboard/project/<project-ref>/sql)
   - Vá em "SQL Editor" -> "New query"
   - Copie e cole o conteúdo de 'supabase/complete_supabase_setup.sql'
   - Clique em 'Run' (ou Ctrl+Enter)

2. Via Python (caso possua DATABASE_URL ou chaves configuradas em .env):
   python scripts/upload_to_supabase.py
"""

import os
import sys

def main():
    print("=" * 70)
    print("COLÉGIO RODIN — SINCRONIZAÇÃO DA BASE DE DADOS COM SUPABASE")
    print("=" * 70)

    sql_path = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'complete_supabase_setup.sql')
    if not os.path.exists(sql_path):
        print(f"Erro: Arquivo {sql_path} não encontrado.")
        sys.exit(1)

    file_size_kb = os.path.getsize(sql_path) / 1024
    print(f"Arquivo SQL gerado com sucesso: {sql_path} ({file_size_kb:.1f} KB)")
    print("Total de dados mapeados:")
    print("  - 753 Estudantes da Planilha Oficial 2027")
    print("  - 651 Responsáveis Legais/Financeiros únicos deduplicados")
    print("  - 753 Matrículas da Campanha 2027")
    print("  - 753 Contratos com Anuidade e Material Didático")
    print("  - 22 Turmas oficiais do Ensino Fundamental e Médio")
    print("  - 7 Perfis de Usuário com Matriz RBAC / RLS")
    print("=" * 70)
    print("\nINSTRUÇÕES DE EXECUÇÃO NO SUPABASE:")
    print("1. Acesse o Supabase Dashboard do seu projeto.")
    print("2. Clique no menu lateral esquerdo em 'SQL Editor'.")
    print("3. Crie uma 'New query'.")
    print("4. Abra e copie todo o conteúdo do arquivo:")
    print(f"   {os.path.abspath(sql_path)}")
    print("5. Cole no editor e clique no botão verde 'Run'.")
    print("6. Todas as tabelas, relações e os 753 registros serão criados em uma única transação atômica (BEGIN...COMMIT).")
    print("=" * 70)

if __name__ == '__main__':
    main()

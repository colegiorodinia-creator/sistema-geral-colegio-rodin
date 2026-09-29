import json
import urllib.request
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("Iniciando sincronização completa com o Supabase...")
    with open('src/data/students2027Data.json', 'r', encoding='utf-8') as f:
        students = json.load(f)

    url_base = 'https://jhjzyoztidfwzqeblhco.supabase.co/rest/v1/students'
    headers = {
        'apikey': 'sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo',
        'Authorization': 'Bearer sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }

    total = len(students)
    success = 0
    errors = 0

    for i, s in enumerate(students):
        rm = s.get('rm_numero')
        grade_2026 = s.get('serie_ano_atual')
        course = s.get('nivel_ensino')
        is_lp = bool(s.get('is_le_perini', False))

        req_url = f'{url_base}?rm_number=eq.{rm}'
        payload = json.dumps({
            'current_grade': grade_2026,
            'course_level': course,
            'is_le_perini': is_lp
        }).encode('utf-8')

        req = urllib.request.Request(req_url, data=payload, headers=headers, method='PATCH')
        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status in (200, 204):
                    success += 1
        except Exception as e:
            errors += 1
            if errors < 5:
                print(f"Erro no RM {rm}: {e}")

        if (i + 1) % 100 == 0 or (i + 1) == total:
            print(f"Progresso: {i + 1}/{total} (Sucesso: {success}, Erros: {errors})")

    print(f"\nSincronização concluída! {success} alunos sincronizados com o Supabase.")

if __name__ == '__main__':
    main()

import fitz

doc = fitz.open('C:/Users/MARKETING 03/.gemini/antigravity-ide/brain/e6e030c0-0639-4d3a-82f9-9ae12e51c88a/.user_uploaded/media_1790005276980.pdf')
pt2mm = 25.4 / 72.0
page = doc[0]

for b in page.get_text('dict')['blocks']:
    if b.get('type') == 0:
        for l in b['lines']:
            for s in l['spans']:
                if any(k in s['text'] for k in ['REQUERIMENTO', 'Termo de Ades', 'n']):
                    bbox = [round(c*pt2mm, 1) for c in s['bbox']]
                    print(s['text'], bbox, s['size'], s['font'])

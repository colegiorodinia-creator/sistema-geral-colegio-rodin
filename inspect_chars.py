import fitz

doc = fitz.open('C:/Users/MARKETING 03/.gemini/antigravity-ide/brain/e6e030c0-0639-4d3a-82f9-9ae12e51c88a/.user_uploaded/media_1790005276980.pdf')
pt2mm = 25.4 / 72.0
page = doc[0]

for b in page.get_text('rawdict')['blocks']:
    if b.get('type') == 0:
        for l in b['lines']:
            text = ''.join(c['c'] for s in l['spans'] for c in s.get('chars', []))
            if 'REQUERIMENTO' in text or 'Termo de Ades' in text or '2027' in text:
                chars = [c for s in l['spans'] for c in s.get('chars', [])]
                first_c = chars[0]
                last_c = chars[-1]
                print(f"TEXT: {text}")
                print(f"First char '{first_c['c']}' at {round(first_c['bbox'][0]*pt2mm, 1)}")
                print(f"Last char '{last_c['c']}' at {round(last_c['bbox'][2]*pt2mm, 1)}")

import fitz

doc = fitz.open('C:/Users/MARKETING 03/.gemini/antigravity-ide/brain/e6e030c0-0639-4d3a-82f9-9ae12e51c88a/.user_uploaded/media_1790005276980.pdf')
pt2mm = 25.4 / 72.0
page = doc[0]

for b in page.get_text('rawdict')['blocks']:
    if b.get('type') == 0:
        for l in b['lines']:
            text = ''.join(c['c'] for s in l['spans'] for c in s.get('chars', []))
            if 'REQUERIMENTO' in text:
                chars = [c for s in l['spans'] for c in s.get('chars', [])]
                for c in chars[:10]:
                    print(f"'{c['c']}': x0={round(c['bbox'][0]*pt2mm, 2)}, x1={round(c['bbox'][2]*pt2mm, 2)}")
                for c in chars[-5:]:
                    print(f"'{c['c']}': x0={round(c['bbox'][0]*pt2mm, 2)}, x1={round(c['bbox'][2]*pt2mm, 2)}")

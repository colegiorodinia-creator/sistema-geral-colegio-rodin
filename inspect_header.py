import fitz

doc = fitz.open('C:/Users/MARKETING 03/.gemini/antigravity-ide/brain/e6e030c0-0639-4d3a-82f9-9ae12e51c88a/.user_uploaded/media_1790005276980.pdf')
pt2mm = 25.4 / 72.0
page = doc[0]

print('=== DRAWINGS y < 35 ===')
for d in page.get_drawings():
    r = [round(c*pt2mm, 1) for c in d['rect']]
    if r[1] < 35:
        width_val = d.get('width')
        w = round(width_val*pt2mm, 2) if width_val is not None else 0
        print('Drawing', d['type'], 'rect=', r, 'w=', w)

print('=== TEXT BLOCKS y < 35 ===')
for b in page.get_text('dict')['blocks']:
    if b.get('type') == 0:
        for l in b['lines']:
            t = ' '.join(s['text'] for s in l['spans'])
            sz = l['spans'][0]['size']
            font = l['spans'][0]['font']
            bbox = [round(c*pt2mm, 1) for c in l['bbox']]
            if bbox[1] < 35:
                print('Text', bbox, 'sz=', sz, 'font=', font, ':', t)
    elif b.get('type') == 1:
        bbox = [round(c*pt2mm, 1) for c in b['bbox']]
        if bbox[1] < 35:
            print('Image', bbox)

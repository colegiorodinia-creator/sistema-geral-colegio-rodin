import re

with open('src/data/initialData2027.js', 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'"tuitionDiscountPercentage":\s*([0-9\.]+)', text)
unique_floats = sorted(set(float(m) for m in matches))
print('Unique tuitionDiscountPercentage in initialData2027:', unique_floats)

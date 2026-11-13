from zipfile import ZipFile
from lxml import etree as E
from pathlib import Path

path = Path('docs/Dac_ta_use_case.docx')
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(path) as z:
    parts = [(i, z.read(i.filename)) for i in z.infolist()]
root = E.fromstring(next(data for info,data in parts if info.filename=='word/document.xml'))
body = root.find('w:body', ns)
for row in list(root.findall('.//w:tr', ns)):
    if any(''.join(c.xpath('.//w:t/text()',namespaces=ns)).strip()=='UC55' for c in row.findall('w:tc',ns)):
        row.getparent().remove(row)
removed = False
for child in list(body):
    text = ''.join(child.xpath('.//w:t/text()', namespaces=ns))
    if child.tag.endswith('}p') and 'UC55' in text:
        following = child.getnext()
        assert following is not None and following.tag.endswith('}tbl')
        body.remove(following)
        body.remove(child)
        removed = True
assert removed
for text in root.xpath('//w:t',namespaces=ns):
    if text.text:
        text.text = text.text.replace('chat/gọi hỗ trợ', 'chat hỗ trợ')
assert not any('UC55' in t for t in root.xpath('//w:t/text()',namespaces=ns))
payload = E.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
with ZipFile(path,'w') as z:
    for info,data in parts:
        z.writestr(info,payload if info.filename=='word/document.xml' else data)
print('Removed UC55 index row, heading and specification table; updated actor description.')

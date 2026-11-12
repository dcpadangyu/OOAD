import xml.etree.ElementTree as ET, html, re
root=ET.parse('docs/Class_Diagram.drawio').getroot()
for u in root.iter('UserObject'):
 s=html.unescape(u.attrib.get('mermaidData',''))
 if 'class Voucher' in s or 'class HoTro' in s:
  print('---',u.attrib.get('id')); print(s[:5000])

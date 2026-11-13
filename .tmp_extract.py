import xml.etree.ElementTree as ET, html, re
root=ET.parse('docs/Class_Diagram.drawio').getroot()
for u in root.iter('UserObject'):
 md=u.attrib.get('mermaidData','')
 if md:
  s=html.unescape(md)
  m=re.search(r'"data": "(.*)"',s,re.S)
  if m:
   print(m.group(1).replace('\\n','\n')); break

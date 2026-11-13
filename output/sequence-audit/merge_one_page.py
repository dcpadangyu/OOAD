from pathlib import Path
import xml.etree.ElementTree as ET
import re, copy
src=Path('output/SEQUENCE_Diagram_da_sua.drawio')
out=Path('output/SEQUENCE_Diagram_da_sua_1_trang.drawio')
r=ET.parse(src).getroot()
diagrams=r.findall('diagram')
new=ET.Element('mxfile',host='app.diagrams.net',type='device')
d=ET.SubElement(new,'diagram',id='corrected-all',name='Sequence da sua - mot trang')
height=0
collected=[]
for pi,diag in enumerate(diagrams):
    model=diag.find('mxGraphModel')
    if model is None: continue
    page_h=float(model.get('pageHeight','1000'))
    offset=height
    cells=model.find('root').findall('mxCell')
    idmap={c.get('id'):f'p{pi}_{c.get("id")}' for c in cells if c.get('id') not in ('0','1')}
    for original in cells:
        if original.get('id') in ('0','1'): continue
        c=copy.deepcopy(original)
        old=c.get('id'); c.set('id',idmap[old])
        if c.get('parent') in idmap:c.set('parent',idmap[c.get('parent')])
        elif c.get('parent') in ('0','1'):c.set('parent','1')
        if c.get('value'):
            c.set('value',re.sub(r'^\s*\d+\.\s+','',c.get('value')))
        g=c.find('mxGeometry')
        if g is not None:
            if g.get('y') is not None:g.set('y',str(float(g.get('y'))+offset))
            for p in g.findall('.//mxPoint'):
                if p.get('y') is not None:p.set('y',str(float(p.get('y'))+offset))
        collected.append(c)
    height += page_h + 90
model=ET.SubElement(d,'mxGraphModel',dx='2115',dy='703',grid='1',gridSize='10',guides='1',tooltips='1',connect='1',arrows='1',fold='1',page='1',pageScale='1',pageWidth='827',pageHeight=str(height),math='0',shadow='0')
root=ET.SubElement(model,'root');ET.SubElement(root,'mxCell',id='0');ET.SubElement(root,'mxCell',id='1',parent='0')
for c in collected:root.append(c)
ET.indent(new,space='  ')
ET.ElementTree(new).write(out,encoding='utf-8',xml_declaration=True)
print(out, 'height',height,'cells',len(collected))

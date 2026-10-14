#!/usr/bin/env python3
"""Bundle game/ into one self-contained HTML file: ../rps-tournament.html"""
import re,os
d=os.path.dirname(os.path.abspath(__file__))
h=open(os.path.join(d,'index.html')).read()
h=h.replace('<link rel="stylesheet" href="css/style.css">','<style>\n'+open(os.path.join(d,'css/style.css')).read()+'</style>')
h=re.sub(r'<script src="(js/[a-z]+\.js)"></script>',lambda m:'<script>\n'+open(os.path.join(d,m.group(1))).read()+'</script>',h)
open(os.path.join(d,'..','rps-tournament.html'),'w').write(h)
print('bundled',len(h),'bytes')

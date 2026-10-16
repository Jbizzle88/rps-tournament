#!/usr/bin/env python3
"""Stamp a new version (cache-busting ?v= on css/js, APP_VERSION, version.json) and bundle game/ into ../rps-tournament.html"""
import re,os,time,json
d=os.path.dirname(os.path.abspath(__file__))
V=time.strftime('%Y%m%d%H%M%S',time.gmtime())
ip=os.path.join(d,'index.html')
h=open(ip).read()
h=re.sub(r'(href|src)="((?:css|js)/[a-z]+\.(?:css|js))(\?v=\w+)?"',lambda m:'%s="%s?v=%s"'%(m.group(1),m.group(2),V),h)
h=re.sub(r"window\.APP_VERSION='[^']*'","window.APP_VERSION='%s'"%V,h)
open(ip,'w').write(h)
json.dump({'v':V},open(os.path.join(d,'version.json'),'w'))
b=re.sub(r'<link rel="stylesheet" href="css/style\.css\?v=\w+">',lambda m:'<style>\n'+open(os.path.join(d,'css/style.css')).read()+'</style>',h)
b=re.sub(r'<script src="(js/[a-z]+\.js)\?v=\w+"></script>',lambda m:'<script>\n'+open(os.path.join(d,m.group(1))).read()+'</script>',b)
open(os.path.join(d,'..','rps-tournament.html'),'w').write(b)
print('version',V,'bundled',len(b),'bytes')

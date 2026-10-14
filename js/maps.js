"use strict";
// Overworld maps: tile grids, collision, tile painters, NPC placement.
const MAP_W=30,MAP_H=20;
function mrng(s){return()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};}
function grid(f){const g=[];for(let y=0;y<MAP_H;y++){const r=[];for(let x=0;x<MAP_W;x++)r.push(f(x,y));g.push(r);}return g;}
function fillE(g,cx,cy,rx,ry,ch,only){for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++){const dx=(x-cx)/rx,dy=(y-cy)/ry;if(dx*dx+dy*dy<=1&&(!only||only.includes(g[y][x])))g[y][x]=ch;}}
const far=(x,y,a,b,d)=>Math.abs(x-a)+Math.abs(y-b)>=d;
const edge=(x,y)=>x===0||y===0||x===MAP_W-1||y===MAP_H-1;
function pBench(px,py){R(px,py+5,16,6,'#7a4a2a');R(px,py+5,16,2,'#9a6a3a');R(px+2,py+11,2,4,'#4a2a1a');R(px+12,py+11,2,4,'#4a2a1a');}
const MAPS={};
// ---- Level 1: tournament hall ----
MAPS.hall={id:'hall',name:'Grand Tournament Hall',start:[14,17],hud:'#ffd040',
 tiles:grid((x,y)=>{if(edge(x,y))return(y===MAP_H-1&&(x===14||x===15))?'c':'#';
  if(x>=11&&x<=18&&y>=3&&y<=16)return'c';if((x===2||x===27)&&(y===2||y===17))return'p';return'.';}),
 solid:new Set(['#','p','n']),
 spots:[[4,3],[8,3],[21,3],[25,3],[4,9],[8,9],[21,9],[25,9],[3,15],[8,16],[21,16],[26,15],[12,2],[17,2],[9,12]],
 battle:{sky:'#e8f0d0',stripe:'#e0ead0',plat:'#a8c878',plat2:'#b8d888',ink:'#567'},
 draw(ch,px,py,x,y){
  if(ch==='#'){R(px,py,16,16,'#4a3a5a');R(px,py+12,16,4,'#2e2238');R(px+1,py+1,6,4,'#5a4a6a');R(px+9,py+6,6,4,'#5a4a6a');return;}
  if(ch==='c'){R(px,py,16,16,'#a02828');R(px,py,16,1,'#b83838');if((x+y)%2)R(px+6,py+6,4,4,'#d0a030');return;}
  R(px,py,16,16,(x+y)%2?'#d8c8a0':'#cfbe94');
  if(ch==='p'){R(px+5,py+11,6,5,'#8a4a20');R(px+3,py+2,10,10,'#2a8a3a');R(px+5,py+3,3,3,'#4ac05a');}
  if(ch==='n')pBench(px,py);},
 overlay(){R(11*16,18,8*16,10,'#d0a030');txt('RPS GRAND TOURNAMENT',15*16,19,'#4a2a00',7,'center');}
};
[[5,6],[6,6],[23,6],[24,6],[5,13],[6,13],[23,13],[24,13]].forEach(([x,y])=>MAPS.hall.tiles[y][x]='n');
// ---- Forest park arena ----
MAPS.forest=(()=>{const r=mrng(101);const g=grid((x,y)=>edge(x,y)?'T':'.');
 fillE(g,5,4,3.5,2.5,'w');fillE(g,24,15,3,2,'w');fillE(g,15,9,6.5,4.5,'o');
 for(let y=13;y<MAP_H-1;y++){g[y][14]=',';g[y][15]=',';}
 for(let x=1;x<MAP_W-1;x++)if(g[9][x]==='.')g[9][x]=',';
 for(let y=1;y<MAP_H-1;y++)for(let x=1;x<MAP_W-1;x++){if(g[y][x]!=='.'||!far(x,y,14,17,4))continue;const v=r();
  if(v<.07)g[y][x]='T';else if(v<.14)g[y][x]='*';else if(v<.16)g[y][x]='r';}
 [[9,14],[10,14],[19,4],[20,4]].forEach(([x,y])=>g[y][x]='n');
 return{id:'forest',name:'Whispering Pines Park',start:[14,17],hud:'#a0f080',tiles:g,solid:new Set(['T','w','r','n']),
  battle:{sky:'#cfeec0',stripe:'#c4e6b4',plat:'#8a6a3a',plat2:'#a8885a',ink:'#2a5a2a'},
  draw(ch,px,py,x,y,t){
   if(ch==='w'){R(px,py,16,16,'#3a7ad0');R(px+((t*8+x*5)%12|0),py+4+(y%3)*3,4,1,'#8ac0f0');return;}
   if(ch===','){R(px,py,16,16,'#c8a868');if((x*3+y)%4===0)R(px+5,py+9,2,2,'#a88848');return;}
   if(ch==='o'){R(px,py,16,16,(x+y)%2?'#d8b878':'#d2b070');return;}
   R(px,py,16,16,(x+y)%2?'#5aa040':'#62a848');
   if((x*7+y*13)%5===0){R(px+4,py+6,1,3,'#3d7a2c');R(px+6,py+5,1,4,'#3d7a2c');}
   if(ch==='T'){R(px+6,py+10,4,6,'#6a4020');R(px+1,py,14,11,'#2d6a2a');R(px+3,py+1,6,4,'#3f8a36');R(px+1,py+9,14,2,'#245a22');}
   if(ch==='*'){R(px+3,py+4,2,2,'#f04060');R(px+10,py+9,2,2,'#f0e040');R(px+7,py+12,2,2,'#fff');}
   if(ch==='r'){R(px+3,py+6,10,8,'#888');R(px+4,py+6,6,2,'#aaa');R(px+3,py+13,10,1,'#666');}
   if(ch==='n')pBench(px,py);}};})();
// ---- Beach boardwalk ----
MAPS.beach=(()=>{const r=mrng(202);const g=grid((x,y)=>y<=3?'w':y===4?'s':(y>=15&&y<=18)?'=':'.');
 for(let y=4;y<MAP_H;y++){g[y][0]='|';g[y][MAP_W-1]='|';}for(let x=0;x<MAP_W;x++)g[MAP_H-1][x]='|';
 [4,5,24,25].forEach(x=>g[15][x]='k');g[6][15]='L';g[6][16]='L';
 for(let y=5;y<14;y++)for(let x=1;x<MAP_W-1;x++){if(g[y][x]!=='.')continue;const v=r();
  if(v<.035)g[y][x]='P';else if(v<.07&&g[y+1][x]==='.'){g[y][x]='U';g[y+1][x]='t';}else if(v<.085)g[y][x]='C';}
 return{id:'beach',name:'Sunny Shores Boardwalk',start:[14,17],hud:'#80e0ff',tiles:g,solid:new Set(['w','|','P','U','C','L','k']),
  battle:{sky:'#bfe6ff',stripe:'#b0dcf8',plat:'#e0c080',plat2:'#f0d898',ink:'#2a5a8a'},
  draw(ch,px,py,x,y,t){
   if(ch==='w'){R(px,py,16,16,'#2a80d0');R(px+((t*10+x*7)%14|0),py+3+(y%2)*6,5,1,'#9ad0ff');if(y===3)R(px,py+12+Math.round(Math.sin(t*2+x)),16,4,'#e0f4ff');return;}
   if(ch==='='||ch==='k'||(ch==='|'&&y===MAP_H-1)){R(px,py,16,16,'#a87848');R(px+7,py,1,16,'#80583a');R(px+15,py,1,16,'#80583a');}
   else R(px,py,16,16,ch==='s'?'#d8c088':'#f0d898');
   if(ch==='.'&&(x*5+y*3)%7===0)R(px+9,py+5,2,1,'#d8b878');
   if(ch==='|'){R(px+6,py,4,16,'#e8e8e8');R(px,py+4,16,2,'#fff');}
   if(ch==='P'){R(px+7,py+6,3,10,'#8a6030');R(px+1,py+1,14,4,'#2a9a40');R(px+4,py,8,7,'#36b04c');R(px+6,py+5,2,2,'#6a4020');}
   if(ch==='U'){R(px+7,py+6,2,10,'#ddd');R(px+1,py+2,14,5,'#e04040');R(px+5,py+2,3,5,'#fff');R(px+11,py+2,3,5,'#fff');}
   if(ch==='t'){R(px+2,py+1,12,14,'#4080e0');R(px+2,py+4,12,2,'#fff');R(px+2,py+10,12,2,'#fff');}
   if(ch==='C'){R(px+2,py+8,12,7,'#d8b060');R(px+4,py+4,8,5,'#d8b060');R(px+6,py+1,4,4,'#c8a050');R(px+7,py+0,1,2,'#e04040');}
   if(ch==='L'){R(px+2,py+8,2,8,'#fff');R(px+12,py+8,2,8,'#fff');R(px,py,16,9,'#e03030');R(px+2,py+2,12,3,'#fff');}
   if(ch==='k'){R(px,py+6,16,10,'#e0a020');R(px,py,16,6,'#e04040');R(px+4,py,4,6,'#fff');R(px+12,py,4,6,'#fff');}}};})();
// ---- Neon city rooftop ----
MAPS.roof=(()=>{const r=mrng(303);const g=grid((x,y)=>edge(x,y)?'#':'.');
 for(let y=1;y<MAP_H-1;y++)for(let x=1;x<MAP_W-1;x++){const d=Math.hypot(x-15,y-10);if(d<3.5)g[y][x]='H';else if(Math.abs(d-4)<.5)g[y][x]='y';}
 for(let x=8;x<=21;x++)g[1][x]='S';
 [[3,4,5,5],[24,4,26,5],[3,14,4,16],[25,13,26,15]].forEach(([a,b,c,d])=>{for(let y=b;y<=d;y++)for(let x=a;x<=c;x++)g[y][x]='A';});
 [[8,15],[9,15],[8,16],[9,16],[20,15],[21,15],[20,16],[21,16]].forEach(([x,y])=>g[y][x]='K');
 for(let x=19;x<=23;x++)g[7][x]='p';for(let x=10;x<=12;x++)g[4][x]='g';
 for(let y=2;y<MAP_H-1;y++)for(let x=1;x<MAP_W-1;x++)if(g[y][x]==='.'&&far(x,y,14,17,3)&&r()<.04)g[y][x]='v';
 return{id:'roof',name:'Neon City Rooftop',start:[14,17],hud:'#ff60e0',tiles:g,solid:new Set(['#','S','A','K','p','g']),
  battle:{sky:'#201838',stripe:'#281e44',plat:'#50506a',plat2:'#64647e',ink:'#c8a0ff'},
  draw(ch,px,py,x,y,t){
   const neon=`hsl(${(t*60+x*12)%360|0},100%,60%)`;
   R(px,py,16,16,(x+y)%2?'#3a3a4a':'#363646');R(px,py,16,1,'#2c2c3a');
   if(ch==='#'){R(px,py,16,16,'#1a1a2a');R(px,py+6,16,3,neon);return;}
   if(ch==='H'){R(px,py,16,16,'#4a4a60');if(x===15&&y===10){R(px+3,py+3,2,10,'#ffd040');R(px+11,py+3,2,10,'#ffd040');R(px+3,py+7,10,2,'#ffd040');}}
   if(ch==='y'){R(px,py,16,16,'#4a4a60');R(px+4,py+4,8,8,'#ffd040');}
   if(ch==='S'){R(px,py,16,16,'#111');const on=Math.sin(t*5+x)>-.6;R(px+2,py+4,12,2,on?(x%2?'#ff40c0':'#40f0ff'):'#333');R(px+2,py+9,12,2,on?(x%3?'#40f0ff':'#ff40c0'):'#333');}
   if(ch==='A'){R(px+1,py+2,14,13,'#9aa0a8');R(px+1,py+2,14,2,'#c0c6ce');R(px+4,py+6,8,7,'#6a7078');R(px+7,py+6,2,7,'#4a5058');}
   if(ch==='K'){R(px+1,py,14,16,'#6a4a3a');R(px+1,py+4,14,1,'#4a3020');R(px+1,py+11,14,1,'#4a3020');R(px+3,py,2,16,'#8a6a5a');}
   if(ch==='p'){R(px,py+6,16,5,'#888');R(px,py+6,16,1,'#aaa');R(px+7,py+5,2,7,'#666');}
   if(ch==='g'){R(px+1,py+1,14,14,'#3a6aa0');R(px+3,py+3,4,2,'#9ac8ff');}
   if(ch==='v'){R(px+3,py+3,10,10,'#2a2a34');for(let i=0;i<4;i++)R(px+4,py+4+i*2,8,1,'#55556a');}}};})();
const THEMED=['forest','beach','roof'];
function pickMap(level,prev,rand=Math.random){if(level<=1)return MAPS.hall;const o=THEMED.filter(id=>id!==prev);return MAPS[o[Math.floor(rand()*o.length)]];}
function isSolidTile(m,x,y){return x<0||y<0||x>=MAP_W||y>=MAP_H||m.solid.has(m.tiles[y][x]);}
const NB=[[0,1],[1,0],[0,-1],[-1,0]];
function reach(m,occ){const seen=new Set(),q=[m.start];seen.add(m.start.join(','));
 while(q.length){const[x,y]=q.pop();for(const[dx,dy]of NB){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(seen.has(k)||occ.has(k)||isSolidTile(m,nx,ny))continue;seen.add(k);q.push([nx,ny]);}}return seen;}
// place n NPCs on reachable floor, spaced out, each still talkable (adjacent reachable tile)
function placeNPCs(m,n,rand=Math.random){
 const base=reach(m,new Set()),c=[];
 base.forEach(k=>{const[x,y]=k.split(',').map(Number);if(far(x,y,m.start[0],m.start[1],4)&&y>1)c.push([x,y]);});
 for(let i=c.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[c[i],c[j]]=[c[j],c[i]];}
 const placed=[],occ=new Set();
 for(const sep of [5,4,3,2,1]){for(const[x,y]of c){if(placed.length>=n)break;const k=x+','+y;
   if(occ.has(k)||placed.some(([a,b])=>!far(a,b,x,y,sep)))continue;occ.add(k);const rs=reach(m,occ);
   if(placed.concat([[x,y]]).every(([a,b])=>NB.some(([dx,dy])=>rs.has((a+dx)+','+(b+dy)))))placed.push([x,y]);else occ.delete(k);}
  if(placed.length>=n)break;}
 return placed;}

"use strict";
// Screen rendering (adaptive portrait/landscape). Uses ui()/land() frames from sprites.js.
const IS_TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
const uiB=()=>ctlBottom()/FR.s, uiS=()=>ctlSide()/FR.s;
let SL={};function rec2(k,x,y,w,h){SL[k]=[FR.ox+x*FR.s,FR.oy+y*FR.s,w*FR.s,h*FR.s];}
function drawTitle(){ui();const P=VIEW.portrait;
 R(0,0,W,H,'#203060');for(let i=0;i<50;i++)R((i*97+S.t*20)%W,(i*53)%H,2,2,'#fff6');
 txt('ROCK  PAPER  SCISSORS',W/2,H*.11,'#ffd040',P?15:20,'center');txt('GRAND TOURNAMENT',W/2,H*.11+(P?22:28),'#fff',P?13:16,'center');
 txt('v'+(window.APP_VERSION||'dev'),W-4,H-12,'#6a7aa0',7,'right');
 txt('Level '+S.level,W/2,H*.11+(P?42:54),'#9cf',9,'center');
 MOVES.forEach((m,i)=>drawHand(m,W/2-84+i*60,H*(P?.27:.34)+Math.sin(S.t*3+i)*5,3,false));
 const fl=NPCS.slice(0,7);
 if(P)fl.forEach(([n,s,l],i)=>{const r=i<4?0:1,c=r?i-4:i;drawGuy(W/2-(r?75:100)+c*50,H*.45+r*44,2,l,Math.floor(S.t*3+i)%2,2);});
 else fl.forEach(([n,s,l],i)=>drawGuy(W/2-186+i*54,H*.53,2,l,Math.floor(S.t*3+i)%2,2));
 const sv=typeof savedRun==='function'?savedRun():null,ty=H*(P?.64:.66);
 if(sv){const bw=Math.min(230,W-40),bx=W/2-bw/2;
  R(bx,ty-6,bw,36,'#283050');R(bx+2,ty-4,bw-4,32,'#ffd040');txt(IS_TOUCH?'CONTINUE':'CONTINUE (SPACE)',W/2,ty-1,'#222',12,'center');
  txt('Level '+sv.level+' · '+(sv.champ?'Champion!':ROUND_NAMES[sv.round]),W/2,ty+14,'#5a4010',9,'center');hit(bx,ty-6,bw,36,'cont');rec2('cont',bx,ty-6,bw,36);
  R(bx+30,ty+38,bw-60,22,'#3a4470');txt(IS_TOUCH?'NEW GAME':'NEW GAME (N)',W/2,ty+44,'#fff',10,'center');hit(bx+30,ty+38,bw-60,22,'new');rec2('new',bx+30,ty+38,bw-60,22);
  txt(IS_TOUCH?'Tap 🏆 for Leaderboard':'L: Leaderboard',W/2,ty+70,'#ffd040',10,'center');}
 else{if(Math.floor(S.t*2)%2)txt(IS_TOUCH?'Tap to start':'Press SPACE to start',W/2,ty+2,'#fff',12,'center');
  txt(IS_TOUCH?'Tap 🏆 for Leaderboard':'L: Leaderboard',W/2,ty+22,'#ffd040',10,'center');}
 txtW(IS_TOUCH?'D-pad: move  A: talk  B: bracket':'Arrows/WASD: move  SPACE: talk  B: bracket  M: mute  L: leaderboard',W/2,H*.84,'#aac',9,'center',W-20);
}
function drawWorld(){
 const m=S.map,t=S.moving,px=(S.px-(S.px-S.fromX)*t)*T,py=(S.py-(S.py-S.fromY)*t)*T;
 const ws=VIEW.portrait?Math.max(1,Math.floor(VIEW.bw/170)):Math.max(1,Math.floor(VIEW.bh/(IS_TOUCH?200:170)));
 ctx.setTransform(ws,0,0,ws,0,0);
 const us=(r=>r>=1?Math.floor(r):r)(VIEW.portrait?Math.min(VIEW.bw/270,VIEW.bh/480):Math.min(VIEW.bw/480,VIEW.bh/320));
 const vw=VIEW.bw/ws,vh=VIEW.bh/ws,vhu=vh-ctlBottom()/ws-(S.msg?70*us/ws:0),mw=MAP_W*T,mh=MAP_H*T;
 // clear play area (world px): below the HUD bar, above the bottom controls/dialog, between landscape side controls
 const aT=(IS_TOUCH?22:12)*us/ws,aB=vhu,aL=ctlSide()/ws,aR=vw-ctlSide()/ws,aw=aR-aL,ah=aB-aT;
 const cx=mw<=aw?(mw-vw)/2:Math.max(-aL,Math.min(mw-aR,px+8-(aL+aw/2)));
 const cy=mh<=ah?-(aT+(ah-mh)/2):Math.max(-aT,Math.min(mh-aB,py+8-(aT+ah/2)));
 WL={ws,cx,cy,area:[aL,aT,aR,aB]};
 R(0,0,vw,vh,'#101018');
 ctx.translate(-Math.round(cx),-Math.round(cy));
 const x0=Math.max(0,Math.floor(cx/T)),y0=Math.max(0,Math.floor(cy/T));
 for(let y=y0;y<=Math.min(MAP_H-1,Math.floor((cy+vh)/T));y++)for(let x=x0;x<=Math.min(MAP_W-1,Math.floor((cx+vw)/T));x++)m.draw(m.tiles[y][x],x*T,y*T,x,y,S.t);
 if(m.overlay)m.overlay();
 const opp=playerOpponent(S.br);
 const ents=S.npcs.map(n=>({y:n.y,f:()=>{const ex=S.elim.has(n);ctx.globalAlpha=ex?.45:1;drawGuy(n.x*T,n.y*T,n.dir,n.look,0);ctx.globalAlpha=1;
   if(n===opp){const bob=Math.sin(S.t*6)*2;R(n.x*T+6,n.y*T-13+bob,4,7,'#ff3030');R(n.x*T+6,n.y*T-5+bob,4,3,'#ff3030');}
   txt(n.name,n.x*T+8,n.y*T+16,ex?'#777':'#111',6,'center');}}));
 ents.push({y:py/T,f:()=>drawGuy(px,py,S.dir,PLAYER_LOOK,t>0&&t<.5)});
 ents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
 // edge arrow to an opponent outside the clear area (incl. under HUD / side controls / dialog)
 if(opp){const ox=opp.x*T+8-Math.round(cx),oyTop=opp.y*T-14-Math.round(cy),oyBot=opp.y*T+22-Math.round(cy),oc=(oyTop+oyBot)/2;
  WL.opp=[ox,oyTop,oyBot];const vis=ox>=aL+6&&ox<=aR-6&&oyTop>=aT&&oyBot<=aB;WL.oppVisible=vis;WL.arrow=null;
  if(!vis&&!S.showB&&!S.msg){ctx.setTransform(ws,0,0,ws,0,0);const mx=(aL+aR)/2,my=(aT+aB)/2,dx=ox-mx,dy=oc-my,m=10;
   const k=Math.min(Math.abs(dx)>1e-3?(aw/2-m)/Math.abs(dx):1e9,Math.abs(dy)>1e-3?(ah/2-m)/Math.abs(dy):1e9,1);
   const ax=mx+dx*k,ay=my+dy*k,an=Math.atan2(dy,dx),pul=1+Math.sin(S.t*8)*.12;
   ctx.save();ctx.translate(ax,ay);ctx.rotate(an);ctx.scale(pul,pul);ctx.fillStyle='#ff3030';ctx.strokeStyle='#fff';ctx.lineWidth=1.2;
   ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-6,-6);ctx.lineTo(-3,0);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
   const lx=Math.max(aL+16,Math.min(aR-16,ax-Math.cos(an)*14)),ly=Math.max(aT+4,Math.min(aB-10,ay-Math.sin(an)*14-3));
   R(lx-14,ly-1,28,8,'rgba(0,0,0,.6)');txt(opp.name,lx,ly,'#fff',6,'center');WL.arrow=[ax,ay];}}
 // HUD
 ui();const two=IS_TOUCH;
 R(0,0,W,two?22:12,'rgba(0,0,0,.65)');txt('Lv '+S.level+' · '+ROUND_NAMES[S.br.round]+' — Opp: '+(opp?opp.name:'?'),4,2,'#fff',8);
 if(two)txt(m.name,4,12,m.hud,8);else txt(m.name,W-4-86*VIEW.dpr/FR.s,2,m.hud,8,'right'); // leave room for the ♪/🏆 buttons
}
let WL={};
function drawNote(){if(!S.note||S.lbOpen)return;ui();const w=Math.min(W-20,260),x=W/2-w/2,y=IS_TOUCH?28:16;
 ctx.globalAlpha=Math.min(1,S.note.d*2);R(x,y,w,16,'rgba(0,0,0,.72)');txtW(S.note.t,W/2,y+4,'#ffd040',8,'center',w-8);ctx.globalAlpha=1;}
function drawMsg(){if(!S.msg)return;ui();const sm=uiS(),x=sm?sm:8,w=W-2*x,h=56,y=H-uiB()-h-6;
 box(x,y,w,h);txtW(S.msg.lines[S.msg.i],x+10,y+8,'#222',10,'left',w-20,13);
 if(Math.floor(S.t*3)%2)R(x+w-18,y+h-12,6,4,'#d03030');}
function drawBracket(){ui();const P=VIEW.portrait,fs=9;
 R(0,0,W,H,'rgba(10,10,30,.94)');txt('LEVEL '+S.level+' BRACKET',W/2,IS_TOUCH?26:6,'#ffd040',P?11:12,'center');
 const top=IS_TOUCH?44:24,bot=18,cw=(W-8)/5,rows=[16,8,4,2,1];
 for(let r=0;r<5;r++){const list=S.br.rounds[r],n=rows[r],sp=(H-top-bot)/n,cx=4+r*cw,bw=cw-6;
  for(let i=0;i<n;i++){const y=top+sp*i+sp/2-7,p=list?list[i]:null;
   const cur=r===S.br.round&&p&&(p.player||p===playerOpponent(S.br));
   R(cx,y,bw,14,p?(p.player?'#802020':cur?'#605010':'#303860'):'#222');
   if(p){R(cx+2,y+4,6,6,p.color);txt(p.name,cx+10,y+2,'#fff',fs);
    if(S.br.rounds[r+1]&&!S.br.rounds[r+1].includes(p))R(cx+9,y+7,ctx.measureText(p.name).width+2,1,'#f55');}
   else txt('---',cx+10,y+2,'#666',fs);
   if(r<4)R(cx+bw,y+7,6,1,'#556');}}
 txt(IS_TOUCH?'Tap anywhere to close':'B / SPACE to close',W/2,H-bot+2,'#aaa',8,'center');
}
function hpInfo(b,x,y,iw,name,lost,sub,flash){box(x,y,iw,40);txt(name,x+10,y+7,'#222',10);txt(sub,x+iw-10,y+8,'#666',8,'right');txt('HP',x+12,y+24,'#d08020',8);
 R(x+32,y+24,iw-42,8,'#444');const nd=S.br.need,pw=(iw-46)/nd;
 for(let i=0;i<nd;i++){const red=i>=nd-lost,fl=flash&&i===nd-lost&&Math.floor(b.t*16)%2;R(x+34+i*pw,y+26,pw-2,4,fl?'#fff':red?'#e03030':'#30c050');}}
// ---- battle layout record (device px) so QA can assert no overlaps / centering ----
let BL={};function rec(k,x,y,w,h){BL[k]=[FR.ox+x*FR.s,FR.oy+y*FR.s,w*FR.s,h*FR.s];}
// tight pixel bounds of each hand icon on its 16-unit grid: [x,y,w,h]
const HAND_BB={rock:[2,5,11,8],paper:[0,1,13,13],scissors:[3,1,9,13]};
function drawHandC(m,cx,cy,s,flip,key){const b=HAND_BB[m],bx=flip?16-b[0]-b[2]:b[0];
 const x=Math.round(cx-(bx+b[2]/2)*s),y=Math.round(cy-(b[1]+b[3]/2)*s);drawHand(m,x,y,s,flip);if(key)rec(key,x+bx*s,y+b[1]*s,b[2]*s,b[3]*s);}
// "Moves: R/S P/P ..." history, trimmed from the left so it never exceeds maxW
function drawHist(b,x,y,maxW,al,ink){if(!b.ph.length)return;const all=b.ph.map((m,i)=>m[0].toUpperCase()+'-'+b.oh[i][0].toUpperCase());
 ctx.font='bold 7px monospace';let n=all.length,t;const pre='You vs '+b.opp.name+': ';
 for(;;){t=pre+(n<all.length?'..':'')+all.slice(all.length-n).join(' ');if(n<=1||ctx.measureText(t).width<=maxW)break;n--;}
 const w=ctx.measureText(t).width;txt(t,x,y,ink,7,al);rec('hist',al==='right'?x-w:x,y,w,8);}
const revealState=b=>{const res=b.phase==='result'?outcome(b.pm,b.om):null;return v=>res===null?'wait':res===0?'tie':(v===res?'win':'lose');};
// Landscape reveal bubble (unchanged look)
function handBubble(b,x,y,who,col,move,flip,state,key){const cap=move?move.toUpperCase():'...';
 const shake=state==='wait'?Math.abs(Math.sin(b.t*9))*10:0,dx=state==='lose'&&b.t<.7?Math.sin(b.t*50)*3:0;
 if(state==='win'){const g=Math.floor(b.t*6)%2?'#ffe040':'#fff6a0';R(x-4,y-4,92,104,g);}
 R(x,y,84,96,col);R(x+2,y+14,80,80,state==='lose'?'#cfcfcf':'#fff');rec(key,x-4,y-4,92,104);
 txt(who+': '+cap,x+42,y+3,'#fff',8,'center');
 if(flip){R(x+84,y+40,4,10,col);R(x+88,y+43,3,4,col);}else{R(x-4,y+40,4,10,col);R(x-7,y+43,3,4,col);}
 if(state==='lose')ctx.globalAlpha=.45;
 drawHandC(move||'rock',x+42+dx,y+54-shake,4,flip);ctx.globalAlpha=1;
 if(state&&state!=='wait'){const t=state==='win'?'WIN!':state==='lose'?'LOSE':'TIE';txt(t,x+80,y+16,state==='win'?'#1a9a2a':state==='lose'?'#c22':'#888',10,'right');}}
// Portrait reveal card: compact (CW x CH), name + result in header, move name in footer, tail toward owner
const CW=62,CH=76;
function handCard(b,x,y,who,col,move,tailRight,state,key){
 const shake=state==='wait'?Math.abs(Math.sin(b.t*9))*6:0,dx=state==='lose'&&b.t<.7?Math.sin(b.t*50)*2:0;
 if(state==='win'){R(x-3,y-3,CW+6,CH+6,Math.floor(b.t*6)%2?'#ffe040':'#fff6a0');}
 rec(key,x-3,y-3,CW+6,CH+6);
 R(x,y,CW,CH,col);R(x+2,y+12,CW-4,CH-24,state==='lose'?'#cfcfcf':'#fff');
 txt(who.slice(0,6),x+4,y+2,'#fff',8);
 if(state&&state!=='wait'){const t=state==='win'?'WIN':state==='lose'?'LOSE':'TIE';const c=state==='win'?'#9f9':state==='lose'?'#fcc':'#eee';txt(t,x+CW-4,y+2,c,8,'right');}
 txt(move?move.toUpperCase():'...',x+CW/2,y+CH-10,'#fff',7,'center');
 if(tailRight){R(x+CW,y+30,3,10,col);R(x+CW+3,y+33,2,4,col);}else{R(x-3,y+30,3,10,col);R(x-5,y+33,2,4,col);}
 if(state==='lose')ctx.globalAlpha=.45;
 drawHandC(move||'rock',x+CW/2+dx,y+12+(CH-24)/2-shake,3,tailRight);ctx.globalAlpha=1;}
function drawBattle(){const b=S.battle,bg=S.map.battle,P=VIEW.portrait;BL={};
 const shO=b.flash==='o'?Math.sin(b.t*60)*3:0,shP=b.flash==='p'?Math.sin(b.t*60)*3:0;
 b.intro=Math.min(1,(b.intro||0)+1/30);const sl=b.intro,fresh=b.phase==='result'&&b.t<.7;
 const sub='L'+S.level+' '+ROUND_NAMES[S.br.round],rv=b.phase==='reveal'||b.phase==='result',st=revealState(b);
 if(!P){land(bg.sky);
  for(let y=0;y<200;y+=8)R(0,y,W,4,bg.stripe);
  R(280,100,170,30,bg.plat);R(290,104,150,22,bg.plat2);R(30,200,180,34,bg.plat);R(40,204,160,26,bg.plat2);
  drawGuy(330+shO+(1-sl)*200,34,2,b.opp.look,0,5);drawGuy(60+shP-(1-sl)*200,128,0,PLAYER_LOOK,0,6);
  rec('oppSprite',330+2*5,34-2*5,12*5,18*5);rec('youSprite',60+2*6,128-2*6,12*6,18*6);
  hpInfo(b,20,16,170,b.opp.name,b.pw,sub,fresh&&b.flash==='o');hpInfo(b,290,170,170,'You',b.ow,'Best of '+bestOf(S.level),fresh&&b.flash==='p');
  rec('oppHP',20,16,170,40);rec('youHP',290,170,170,40);
  if(rv){handBubble(b,236,16,b.opp.name.toUpperCase(),'#b03040',b.phase==='result'?b.om:null,true,st(-1),'oppCard');
   handBubble(b,172,124,'YOU','#3060c0',b.phase==='result'?b.pm:null,false,st(1),'youCard');}
  box(0,H-64,W,64);rec('dialog',0,H-64,W,64);
  if(b.phase==='menu'){wrap(b.text,30).forEach((l,i)=>txt(l,12,H-52+i*13,'#222',10));box(250,H-64,230,64);
   MOVES.forEach((m,i)=>{const x=262+i*72;if(i===b.sel&&!IS_TOUCH)R(x-4,H-56,68,48,'#ffe080');hit(x-4,H-56,68,48,i);rec('btn'+i,x-4,H-56,68,36);
    drawHandC(m,x+30,H-38,2.5,false,'icon'+i);txt((IS_TOUCH?'':(i+1)+' ')+m[0].toUpperCase()+m.slice(1),x+30,H-18,'#222',9,'center');});}
  else{wrap(b.text,52).forEach((l,i)=>txt(l,14,H-52+i*14,'#222',11));if(b.phase!=='reveal'&&Math.floor(S.t*3)%2)R(W-22,H-16,6,4,'#d03030');}
  drawHist(b,W-6,4,200,'right',bg.ink);return;}
 // ---- portrait battle (classic layout): enemy HP top-left + enemy top-right; player bottom-left + player HP right ----
 // The canvas is sized to the visible viewport, so the bottom panel is always above the browser toolbar.
 ui();R(0,0,W,H,bg.sky);
 const panelH=Math.min(Math.floor(H*.34),Math.max(132,Math.floor(H*.28))),pad=6;
 ctx.font='bold 10px monospace';const lines=wrap(b.text,Math.max(4,Math.floor((W-24)/6.2))).length,fs=lines>2?9:10,lh=lines>2?11:12;
 const textH=42,btnH=panelH-textH-pad*2,TB=H-panelH,A=TB;
 for(let y=0;y<TB;y+=8)R(0,y,W,4,bg.stripe);
 const gs=A>=380?6:5,ps=A>=360?gs+1:gs;
 const topClear=46*VIEW.dpr/FR.s;               // below the DOM ♪/🏆 buttons (top-right, ~42 css px)
 // enemy HP box + enemy sprite to its right, slightly lower (feet on a platform)
 const ehw=Math.min(170,W-16-14*gs);hpInfo(b,8,8,ehw,b.opp.name,b.pw,sub,fresh&&b.flash==='o');rec('oppHP',8,8,ehw,40);
 const ex=W-16*gs-10,ey=Math.max(topClear+6*gs,30); // room for tall hats (wizard) under the ♪/🏆 buttons
 R(ex-8,ey+13*gs,16*gs+16,Math.round(4*gs),bg.plat);R(ex-2,ey+13*gs+3,16*gs+4,Math.round(4*gs)-6,bg.plat2);
 drawGuy(ex+shO+(1-sl)*200,ey,2,b.opp.look,0,gs);rec('oppSprite',ex+2*gs,ey-3*gs,12*gs,19*gs);
 // enemy card: left of the enemy, below its HP box; history under the HP box, left of the card
 const ocx=Math.max(8,ex+2*gs-10-CW),ocy=48+8;
 drawHist(b,8,52,ocx-8-12,'left',bg.ink);
 // player: platform at the bottom of the arena, HP box to the right, card between sprite and HP box (above HP)
 const pxs=12,py=TB-8-15*ps;
 R(4,py+13*ps,16*ps+18,Math.round(4*ps),bg.plat);R(10,py+13*ps+3,16*ps+6,Math.round(4*ps)-6,bg.plat2);
 drawGuy(pxs+shP-(1-sl)*200,py,0,PLAYER_LOOK,0,ps);rec('youSprite',pxs+2*ps,py-3*ps,12*ps,19*ps);
 const piw=Math.min(170,W-16*ps-40),phx=W-piw-6,phy=TB-48;hpInfo(b,phx,phy,piw,'You',b.ow,'Best of '+bestOf(S.level),fresh&&b.flash==='p');rec('youHP',phx,phy,piw,40);
 const pcx=pxs+14*ps+8,pcy=phy-8-CH;
 if(rv){handCard(b,ocx,ocy,b.opp.name.toUpperCase(),'#b03040',b.phase==='result'?b.om:null,true,st(-1),'oppCard');
  handCard(b,pcx,pcy,'YOU','#3060c0',b.phase==='result'?b.pm:null,false,st(1),'youCard');}
 // bottom panel: prompt + 3 large move buttons
 R(0,TB,W,panelH,'#1a2038');box(0,TB,W,textH);rec('dialog',0,TB,W,textH);txtW(b.text,12,TB+(lines>2?5:8),'#222',fs,'left',W-24,lh);
 if(b.phase!=='menu'&&b.phase!=='reveal'&&Math.floor(S.t*3)%2)R(W-16,TB+textH-12,6,4,'#d03030');
 const bw=(W-pad*2-12)/3,by=TB+textH+pad,on=b.phase==='menu',labH=14,area=btnH-labH-10;
 const hs=Math.max(2,Math.min(4,Math.floor(Math.min(area,bw-16)/13*2)/2));   // same icon scale for all three
 MOVES.forEach((m,i)=>{const x=pad+i*(bw+6);
  R(x,by,bw,btnH,on?'#283050':'#3a4058');R(x+2,by+2,bw-4,btnH-4,on?(i===b.sel&&!IS_TOUCH?'#ffe080':'#f8f8f0'):'#5a6078');
  R(x+2,by+btnH-6,bw-4,4,'rgba(0,0,0,.18)');rec('btn'+i,x,by,bw,btnH-labH);
  if(!on)ctx.globalAlpha=.45;drawHandC(m,x+bw/2,by+5+area/2,hs,false,'icon'+i);ctx.globalAlpha=1;
  txt(m[0].toUpperCase()+m.slice(1),x+bw/2,by+btnH-labH-2,on?'#222':'#c0c4d8',btnH>=70?12:10,'center');
  if(on)hit(x,by,bw,btnH,i);});
}
function drawEnd(champ){ui();const P=VIEW.portrait;
 R(0,0,W,H,champ?'#302000':'#200810');
 const cont=(IS_TOUCH?'Tap':'Press SPACE')+' to continue';
 if(champ){for(let i=0;i<70;i++){const c=['#f44','#4f4','#44f','#ff4','#f4f'][i%5];R((i*71)%W,(i*37+S.t*60*(1+i%3))%H,3,3,c);}
  txt('CHAMPION!',W/2,H*.14,'#ffd040',P?24:28,'center');const gx=W/2-40,gy=H*.36;drawGuy(gx,gy,2,PLAYER_LOOK,0,5);
  R(gx+28,gy-14,24,10,'#ffd040');R(gx+28,gy-20,4,6,'#ffd040');R(gx+38,gy-22,4,8,'#ffd040');R(gx+48,gy-20,4,6,'#ffd040');
  txt('LEVEL '+S.level+' CLEARED!',W/2,H*.66,'#fff',12,'center');
  txtW(cont+' to Level '+(S.level+1),W/2,H*.8,'#ffd040',11,'center',W-20);}
 else{txt('GAME OVER',W/2,H*.14,'#f44',P?24:28,'center');drawGuy(W/2-24,H*.3,2,S.lostTo.look,0,3);
  const n=txtW('Level '+S.level+': eliminated by '+S.lostTo.name+' in the '+ROUND_NAMES[S.br.round-1],W/2,H*.5,'#fff',11,'center',W-24);
  txtW('Their style: '+STRATS[S.lostTo.strat].d,W/2,H*.5+n*14+6,'#caa',10,'center',W-24);
  txt(cont,W/2,H*.82,'#ccc',11,'center');}
}
// 'NEW HIGH SCORE!' only for a real top-10 placement on a full board (or #1); otherwise you're just on a short board
function placeTitle(pl){return pl.rank===0?'NEW #1 HIGH SCORE!':pl.full?'NEW HIGH SCORE!':'ON THE BOARD!';}
function drawName(){ui();const P=VIEW.portrait;R(0,0,W,H,'#101830');
 const pl=S.place||{rank:0,full:true};
 txt(placeTitle(pl),W/2,H*.07,'#ffd040',P?17:20,'center');
 txt('Level '+S.score.level+' - '+REACH_LONG[clampRound(S.score.round)]+' - rank #'+(pl.rank+1),W/2,H*.07+26,'#fff',P?9:11,'center');
 txt('ENTER YOUR NAME',W/2,H*.07+48,'#9cf',12,'center');
 const sy=H*.07+76;for(let i=0;i<5;i++){const x=W/2-103+i*42;R(x,sy+34,34,4,'#fff');const c=S.nm[i]||(i===S.nm.length&&Math.floor(S.t*3)%2?'_':'');txt(c,x+17,sy+4,'#fff',26,'center');}
 if(IS_TOUCH)return; // touch devices use the on-screen QWERTY grid
 const kw=Math.min(30,Math.floor((W-16)/10)-4),kh=24,gap=4,wide=Math.round(kw*1.5),top=Math.max(sy+52,H*.5);
 KB_ROWS.forEach((row,r)=>{const ws=row.split('').map(c=>c==='<'||c==='>'?wide:kw),tw=ws.reduce((a,b)=>a+b+gap,-gap);let x=W/2-tw/2;const y=top+r*(kh+6);
  row.split('').forEach((c,i)=>{const sel=S.kr===r&&S.kc===i;R(x,y,ws[i],kh,sel?'#ffd040':c==='>'?'#2a8a3a':c==='<'?'#8a2a2a':'#2a3460');
   txt(c==='<'?'DEL':c==='>'?'OK':c,x+ws[i]/2,y+7,sel?'#000':'#fff',10,'center');hit(x,y,ws[i],kh,c);x+=ws[i]+gap;});});
 txtW('Type or use arrows + SPACE (or click) · Backspace deletes · Enter confirms',W/2,top+3*(kh+6)+10,'#aac',8,'center',W-16);
}
function drawBoard(overlay){ui();const P=VIEW.portrait,fs=P?10:11,rh=P?24:19;R(0,0,W,H,'#0c1024');txt('TOP 10 LEADERBOARD',W/2,IS_TOUCH?30:14,'#ffd040',P?14:16,'center');
 const top=IS_TOUCH?60:44,c=[W*.07,W*.19,W*.48,W*.62];
 txt('RANK',c[0],top,'#9cf',9);txt('NAME',c[1],top,'#9cf',9);txt('LEVEL',c[2],top,'#9cf',9);txt('REACHED',c[3],top,'#9cf',9);
 txt(S.lbState||'',W/2,top-14,S.lbState==='GLOBAL'?'#6f6':'#aaa',8,'center');
 const lb=S.lb||[];if(!lb.length)txt(S.lbState==='loading...'?'Loading...':'No scores yet - go play!',W/2,top+60,'#888',11,'center');
 const m=S.mine,hi=m?lb.findIndex(e=>e.name===m.name&&e.level===m.level&&e.round===m.round):-1;
 lb.forEach((e,i)=>{const y=top+16+i*rh,col=i===hi?(Math.floor(S.t*4)%2?'#ff0':'#fa0'):'#fff';
  txt(String(i+1).padStart(2,' ')+'.',c[0],y,col,fs);txt(e.name,c[1],y,col,fs);txt(String(e.level),c[2]+8,y,col,fs);txt(REACH_SHORT[clampRound(e.round)],c[3],y,col,fs-1);});
 if(overlay){txt((IS_TOUCH?'Tap':'Press SPACE / ESC')+' to return to '+(S.mode==='title'?'title':'game'),W/2,H-18,'#aaa',9,'center');return;}
 // end of run: Play Again (primary) + Title
 const bw=Math.min(130,(W-36)/2),by=Math.min(H-44,top+16+10*rh+8),gap=12,x1=W/2-bw-gap/2,x2=W/2+gap/2;
 R(x1,by,bw,32,'#1a6a2a');R(x1+2,by+2,bw-4,28,'#2a9a3a');txt('PLAY AGAIN',x1+bw/2,by+6,'#fff',11,'center');txt(IS_TOUCH?'':'SPACE',x1+bw/2,by+19,'#cfe',7,'center');hit(x1,by,bw,32,'again');rec2('again',x1,by,bw,32);
 R(x2,by,bw,32,'#283050');R(x2+2,by+2,bw-4,28,'#3a4470');txt('TITLE',x2+bw/2,by+6,'#fff',11,'center');txt(IS_TOUCH?'':'ESC',x2+bw/2,by+19,'#ccd',7,'center');hit(x2,by,bw,32,'title');rec2('title',x2,by,bw,32);}
function drawToast(dt){if(S.muteT>0){S.muteT-=dt;ui();const y=IS_TOUCH?26:H-uiB()-80;R(W-70,y,64,14,'rgba(0,0,0,.7)');txt(Music.muted?'MUSIC OFF':'MUSIC ON',W-38,y+3,'#fff',8,'center');}}

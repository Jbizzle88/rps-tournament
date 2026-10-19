"use strict";
// Screen rendering (adaptive portrait/landscape). Uses ui()/land() frames from sprites.js.
const IS_TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
const uiB=()=>ctlBottom()/FR.s, uiS=()=>ctlSide()/FR.s;
function drawTitle(){ui();const P=VIEW.portrait;
 R(0,0,W,H,'#203060');for(let i=0;i<50;i++)R((i*97+S.t*20)%W,(i*53)%H,2,2,'#fff6');
 txt('ROCK  PAPER  SCISSORS',W/2,H*.11,'#ffd040',P?15:20,'center');txt('GRAND TOURNAMENT',W/2,H*.11+(P?22:28),'#fff',P?13:16,'center');
 txt('v'+(window.APP_VERSION||'dev'),W-4,H-12,'#6a7aa0',7,'right');
 txt('Level '+S.level,W/2,H*.11+(P?42:54),'#9cf',9,'center');
 MOVES.forEach((m,i)=>drawHand(m,W/2-84+i*60,H*(P?.27:.34)+Math.sin(S.t*3+i)*5,3,false));
 const fl=NPCS.slice(0,7);
 if(P)fl.forEach(([n,s,l],i)=>{const r=i<4?0:1,c=r?i-4:i;drawGuy(W/2-(r?75:100)+c*50,H*.45+r*44,2,l,Math.floor(S.t*3+i)%2,2);});
 else fl.forEach(([n,s,l],i)=>drawGuy(W/2-186+i*54,H*.53,2,l,Math.floor(S.t*3+i)%2,2));
 if(Math.floor(S.t*2)%2)txt(IS_TOUCH?'Tap to start':'Press SPACE to start',W/2,H*(P?.66:.68),'#fff',12,'center');
 txt(IS_TOUCH?'Tap 🏆 for Leaderboard':'L: Leaderboard',W/2,H*(P?.66:.68)+20,'#ffd040',10,'center');
 txtW(IS_TOUCH?'D-pad: move  A: talk  B: bracket':'Arrows/WASD: move  SPACE: talk  B: bracket  M: mute  L: leaderboard',W/2,H*.84,'#aac',9,'center',W-20);
}
function drawWorld(){
 const m=S.map,t=S.moving,px=(S.px-(S.px-S.fromX)*t)*T,py=(S.py-(S.py-S.fromY)*t)*T;
 const ws=VIEW.portrait?Math.max(1,Math.floor(VIEW.bw/170)):Math.max(1,Math.floor(VIEW.bh/170));
 ctx.setTransform(ws,0,0,ws,0,0);
 const us=(r=>r>=1?Math.floor(r):r)(VIEW.portrait?Math.min(VIEW.bw/270,VIEW.bh/480):Math.min(VIEW.bw/480,VIEW.bh/320));
 const vw=VIEW.bw/ws,vh=VIEW.bh/ws,vhu=vh-ctlBottom()/ws-(S.msg?70*us/ws:0),mw=MAP_W*T,mh=MAP_H*T;
 const cam=(p,v,mx)=>mx<=v?(mx-v)/2:Math.max(0,Math.min(mx-v,p+8-v/2));
 const cx=cam(px,vw,mw),cy=mh<=vhu?(mh-vhu)/2:Math.max(0,Math.min(mh-vhu,py+8-vhu/2));
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
 // HUD
 ui();const two=IS_TOUCH;
 R(0,0,W,two?22:12,'rgba(0,0,0,.65)');txt('Lv '+S.level+' · '+ROUND_NAMES[S.br.round]+' — Opp: '+(opp?opp.name:'?'),4,2,'#fff',8);
 if(two)txt(m.name,4,12,m.hud,8);else txt(m.name,W-4-86*VIEW.dpr/FR.s,2,m.hud,8,'right'); // leave room for the ♪/🏆 buttons
}
function drawMsg(){if(!S.msg)return;ui();const sm=uiS(),x=sm?sm:8,w=W-2*x,h=56,y=H-uiB()-h-6;
 box(x,y,w,h);txtW(S.msg.lines[S.msg.i],x+10,y+8,'#222',10,'left',w-20,13);
 if(Math.floor(S.t*3)%2)R(x+w-18,y+h-12,6,4,'#d03030');}
function drawBracket(){ui();const P=VIEW.portrait,fs=P?7:8;
 R(0,0,W,H,'rgba(10,10,30,.94)');txt('LEVEL '+S.level+' BRACKET',W/2,IS_TOUCH?26:6,'#ffd040',P?11:12,'center');
 const top=IS_TOUCH?44:24,bot=Math.max(uiB(),14)+4,cw=(W-8)/5,rows=[16,8,4,2,1];
 for(let r=0;r<5;r++){const list=S.br.rounds[r],n=rows[r],sp=(H-top-bot)/n,cx=4+r*cw,bw=cw-6;
  for(let i=0;i<n;i++){const y=top+sp*i+sp/2-6,p=list?list[i]:null;
   const cur=r===S.br.round&&p&&(p.player||p===playerOpponent(S.br));
   R(cx,y,bw,12,p?(p.player?'#802020':cur?'#605010':'#303860'):'#222');
   if(p){R(cx+2,y+3,6,6,p.color);txt(p.name,cx+10,y+2,'#fff',fs);
    if(S.br.rounds[r+1]&&!S.br.rounds[r+1].includes(p))R(cx+9,y+6,ctx.measureText(p.name).width+2,1,'#f55');}
   else txt('---',cx+10,y+2,'#666',fs);
   if(r<4)R(cx+bw,y+6,6,1,'#556');}}
 txt(IS_TOUCH?'B / A to close':'B / SPACE to close',W/2,H-bot+2,'#aaa',8,'center');
}
function hpInfo(b,x,y,iw,name,lost,sub,flash){box(x,y,iw,40);txt(name,x+10,y+7,'#222',10);txt(sub,x+iw-10,y+8,'#666',8,'right');txt('HP',x+12,y+24,'#d08020',8);
 R(x+32,y+24,iw-42,8,'#444');const nd=S.br.need,pw=(iw-46)/nd;
 for(let i=0;i<nd;i++){const red=i>=nd-lost,fl=flash&&i===nd-lost&&Math.floor(b.t*16)%2;R(x+34+i*pw,y+26,pw-2,4,fl?'#fff':red?'#e03030':'#30c050');}}
// Reveal: each fighter's hand in a tinted bubble beside that fighter, pointing at the other
function handBubble(b,x,y,who,col,move,flip,state){const cap=move?move.toUpperCase():'...';
 const shake=state==='wait'?Math.abs(Math.sin(b.t*9))*10:0,dx=state==='lose'&&b.t<.7?Math.sin(b.t*50)*3:0;
 if(state==='win'){const g=Math.floor(b.t*6)%2?'#ffe040':'#fff6a0';R(x-4,y-4,92,104,g);}
 R(x,y,84,96,col);R(x+2,y+14,80,80,state==='lose'?'#cfcfcf':'#fff');
 txt(who+': '+cap,x+42,y+3,'#fff',8,'center');
 // tail toward own fighter
 if(flip){R(x+84,y+40,4,10,col);R(x+88,y+43,3,4,col);}else{R(x-4,y+40,4,10,col);R(x-7,y+43,3,4,col);}
 if(state==='lose')ctx.globalAlpha=.45;
 drawHand(move||'rock',x+10+dx,y+22-shake,4,flip);ctx.globalAlpha=1;
 if(state&&state!=='wait'){const t=state==='win'?'WIN!':state==='lose'?'LOSE':'TIE';txt(t,x+80,y+16,state==='win'?'#1a9a2a':state==='lose'?'#c22':'#888',10,'right');}}
function drawReveal(b,px,py,ox,oy){
 if(b.phase!=='reveal'&&b.phase!=='result')return;
 const res=b.phase==='result'?outcome(b.pm,b.om):null;
 const st=v=>res===null?'wait':res===0?'tie':(v===res?'win':'lose');
 handBubble(b,ox,oy,b.opp.name.toUpperCase(),'#b03040',res===null?null:b.om,true,st(-1));
 handBubble(b,px,py,'YOU','#3060c0',res===null?null:b.pm,false,st(1));}
function drawBattle(){const b=S.battle,bg=S.map.battle,P=VIEW.portrait;
 const shO=b.flash==='o'?Math.sin(b.t*60)*3:0,shP=b.flash==='p'?Math.sin(b.t*60)*3:0;
 b.intro=Math.min(1,(b.intro||0)+1/30);const sl=b.intro,fresh=b.phase==='result'&&b.t<.7;
 const sub='L'+S.level+' '+ROUND_NAMES[S.br.round],hist='Moves: '+b.ph.map((m,i)=>m[0].toUpperCase()+'/'+b.oh[i][0].toUpperCase()).join(' ');
 if(!P){land(bg.sky);
  for(let y=0;y<200;y+=8)R(0,y,W,4,bg.stripe);
  R(280,100,170,30,bg.plat);R(290,104,150,22,bg.plat2);R(30,200,180,34,bg.plat);R(40,204,160,26,bg.plat2);
  drawGuy(330+shO+(1-sl)*200,34,2,b.opp.look,0,5);drawGuy(60+shP-(1-sl)*200,128,0,PLAYER_LOOK,0,6);
  hpInfo(b,20,16,170,b.opp.name,b.pw,sub,fresh&&b.flash==='o');hpInfo(b,290,170,170,'You',b.ow,'Bo'+bestOf(S.level),fresh&&b.flash==='p');
  drawReveal(b,172,118,232,26);
  box(0,H-64,W,64);
  if(b.phase==='menu'){wrap(b.text,30).forEach((l,i)=>txt(l,12,H-52+i*13,'#222',10));box(250,H-64,230,64);
   MOVES.forEach((m,i)=>{const x=262+i*72;if(i===b.sel)R(x-4,H-56,68,48,'#ffe080');hit(x-4,H-56,68,48,i);
    drawHand(m,x+14,H-56,2.5,false);txt((IS_TOUCH?'':(i+1)+' ')+m[0].toUpperCase()+m.slice(1),x+30,H-18,'#222',9,'center');});}
  else{wrap(b.text,52).forEach((l,i)=>txt(l,14,H-52+i*14,'#222',11));if(b.phase!=='reveal'&&Math.floor(S.t*3)%2)R(W-22,H-16,6,4,'#d03030');}
  txt(hist,W-6,4,bg.ink,7,'right');return;}
 // ---- portrait battle: fighters above, integrated bottom panel (prompt + 3 big move buttons) ----
 // Panel is a fraction of the VISIBLE H (canvas is already sized to visualViewport), so buttons
 // can never sit under the iOS Safari toolbar the way a fixed "draw at canvas bottom of 100vh" layout did.
 ui();R(0,0,W,H,bg.sky);
 const panelH=Math.min(Math.floor(H*.34),Math.max(132,Math.floor(H*.28)));
 const textH=42,pad=6,btnH=panelH-textH-pad*2,TB=H-panelH;
 for(let y=0;y<TB;y+=8)R(0,y,W,4,bg.stripe);
 hpInfo(b,8,10,Math.min(170,W-16),b.opp.name,b.pw,sub,fresh&&b.flash==='o');
 const arena=Math.max(80,TB-8),oy=Math.max(52,Math.min(TB-200,arena-220));
 const gScale=arena<280?5:6;
 R(W-150,oy+70,142,24,bg.plat);R(W-142,oy+74,126,16,bg.plat2);
 drawGuy(W-127+shO+(1-sl)*200,oy,2,b.opp.look,0,gScale);
 const py=Math.max(oy+90,TB-120);
 R(6,py+90,160,26,bg.plat);R(14,py+94,144,18,bg.plat2);
 drawGuy(14+shP-(1-sl)*200,py,0,PLAYER_LOOK,0,gScale+(gScale>5?1:0));
 const piw=Math.min(170,W-150);hpInfo(b,W-piw-6,Math.max(56,py+20),piw,'You',b.ow,'Bo'+bestOf(S.level),fresh&&b.flash==='p');
 drawReveal(b,Math.min(134,W/2-90),Math.max(70,py-20),Math.max(W-219,W/2+10),oy+4);
 txt(hist,W-6,Math.min(oy+100,TB-8),bg.ink,7,'right');
 // Bottom panel: prompt strip + 3 large tappable move buttons (always inside visible canvas)
 R(0,TB,W,panelH,'#1a2038');box(0,TB,W,textH);txtW(b.text,12,TB+8,'#222',10,'left',W-24,12);
 if(b.phase!=='menu'&&b.phase!=='reveal'&&Math.floor(S.t*3)%2)R(W-20,TB+textH-14,6,4,'#d03030');
 const bw=(W-pad*2-12)/3,by=TB+textH+pad;
 MOVES.forEach((m,i)=>{const x=pad+i*(bw+6),on=b.phase==='menu';
  R(x,by,bw,btnH,on?(i===b.sel?'#ffe080':'#f8f8f0'):'#6a7088');R(x,by+btnH-5,bw,5,'rgba(0,0,0,.25)');
  const hs=btnH>=78?3.2:btnH>=64?2.6:2.1;
  drawHand(m,x+bw/2-12*hs,by+Math.max(4,btnH*0.06),hs,false);
  txt(m[0].toUpperCase()+m.slice(1),x+bw/2,by+btnH-Math.max(16,btnH*0.22),'#222',btnH>=70?12:10,'center');
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
function drawName(){ui();const P=VIEW.portrait;R(0,0,W,H,'#101830');
 txt('NEW HIGH SCORE!',W/2,H*.07,'#ffd040',P?17:20,'center');
 txt('Level '+S.score.level+' - '+ROUND_LABELS[clampRound(S.score.round)],W/2,H*.07+26,'#fff',11,'center');
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
 txt('RANK',c[0],top,'#9cf',9);txt('NAME',c[1],top,'#9cf',9);txt('LEVEL',c[2],top,'#9cf',9);txt('ROUND',c[3],top,'#9cf',9);
 txt(S.lbState||'',W/2,top-14,S.lbState==='GLOBAL'?'#6f6':'#aaa',8,'center');
 const lb=S.lb||[];if(!lb.length)txt(S.lbState==='loading...'?'Loading...':'No scores yet - go play!',W/2,top+60,'#888',11,'center');
 const m=S.mine,hi=m?lb.findIndex(e=>e.name===m.name&&e.level===m.level&&e.round===m.round):-1;
 lb.forEach((e,i)=>{const y=top+16+i*rh,col=i===hi?(Math.floor(S.t*4)%2?'#ff0':'#fa0'):'#fff';
  txt(String(i+1).padStart(2,' ')+'.',c[0],y,col,fs);txt(e.name,c[1],y,col,fs);txt(String(e.level),c[2]+8,y,col,fs);txt(ROUND_LABELS[clampRound(e.round)],c[3],y,col,fs-1);});
 txt((IS_TOUCH?'Tap':'Press SPACE / ESC')+' to return to '+(overlay?(S.mode==='title'?'title':'game'):'title'),W/2,H-18,'#aaa',9,'center');}
function drawToast(dt){if(S.muteT>0){S.muteT-=dt;ui();const y=IS_TOUCH?26:H-uiB()-80;R(W-70,y,64,14,'rgba(0,0,0,.7)');txt(Music.muted?'MUSIC OFF':'MUSIC ON',W-38,y+3,'#fff',8,'center');}}

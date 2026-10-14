"use strict";
// Game state, input, update loop.
let S;
function newGame(level=1,prevMap=null){
 const br=makeBracket(level),map=pickMap(level,prevMap);
 const npcs=br.rounds[0].filter(p=>!p.player);
 const spots=map.spots||placeNPCs(map,npcs.length);
 npcs.forEach((p,i)=>{p.x=spots[i][0];p.y=spots[i][1];p.dir=2;});
 S={mode:'title',level,map,br,npcs,px:map.start[0],py:map.start[1],fromX:map.start[0],fromY:map.start[1],dir:0,moving:0,msg:null,showB:false,battle:null,t:S?S.t:0,elim:new Set(),muteT:0};
}
newGame();
function solid(x,y){return isSolidTile(S.map,x,y)||S.npcs.some(n=>n.x===x&&n.y===y);}
const DX=[0,1,0,-1],DY=[-1,0,1,0];
const keys={};
addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Backspace'].includes(e.key))e.preventDefault();
 Music.unlock();
 if(e.repeat&&!/^Arrow|^[wasdWASD]$/.test(e.key))return;
 keys[e.key]=true;
 if(S.mode!=='name'&&(e.key==='m'||e.key==='M')){S.muteT=1.5;Music.toggle();return;}
 onKey(e.key);});
addEventListener('keyup',e=>keys[e.key]=false);
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const isAct=k=>k===' '||k==='Enter'||k==='z'||k==='Z';
function say(lines,then){S.msg={lines:[].concat(lines),i:0,then};}
function onKey(k){
 if(S.mode==='board'){if(isAct(k)||k==='Escape'||k==='l'||k==='L')newGame(1);return;}
 if(S.mode==='name'){nameKey(k);return;}
 if(S.mode==='title'){
  if(k==='l'||k==='L'){S.mode='board';S.lb=loadLB();S.hi=-1;return;}
  if(isAct(k)){S.mode='world';Music.setLevel(S.level);say(['Welcome to the Grand RPS Tournament!','16 fighters. Single elimination. Best of 3.','Find your opponent (marked with !) and talk to them.','Press B anytime to view the bracket.']);}return;}
 if(S.mode==='champ'){if(isAct(k)){const L=S.level+1;newGame(L,S.map.id);S.mode='world';Music.setLevel(L);
   say(['LEVEL '+L+': welcome to '+S.map.name+'! A fresh bracket of 16.','Word is the competition got smarter...'+(bestOf(L)===5?' Matches are now Best of 5!':''),'Find your opponent (!) and talk to them.']);}return;}
 if(S.mode==='over'){if(isAct(k)||k==='r'||k==='R'){const sc={level:S.level,round:S.br.round-1};const lb=loadLB();
   if(qualifies(lb,sc)){S.mode='name';S.nm='';S.kr=0;S.kc=0;S.score=sc;}else{S.mode='board';S.lb=lb;S.hi=-1;}}return;}
 if(S.mode==='battle'){battleKey(k);return;}
 if(S.msg){if(isAct(k)){S.msg.i++;if(S.msg.i>=S.msg.lines.length){const t=S.msg.then;S.msg=null;t&&t();}}return;}
 if(k==='b'||k==='B'){S.showB=!S.showB;return;}
 if(S.showB){if(isAct(k)||k==='Escape')S.showB=false;return;}
 if(isAct(k)&&!S.moving){const tx=S.px+DX[S.dir],ty=S.py+DY[S.dir];const n=S.npcs.find(n=>n.x===tx&&n.y===ty);if(n)talk(n);}
}
// QWERTY on-canvas selector: '<' = DEL, '>' = OK
const KB_ROWS=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM<>'];
function kbPress(c){if(c==='<')S.nm=S.nm.slice(0,-1);else if(c==='>')nameKey('Enter');else if(S.nm.length<5)S.nm+=c;}
function nameKey(k){
 if(/^[a-zA-Z]$/.test(k)){if(S.nm.length<5)S.nm+=k.toUpperCase();return;}
 if(k==='Backspace'){S.nm=S.nm.slice(0,-1);return;}
 if(k==='ArrowUp'||k==='ArrowDown'){S.kr=(S.kr+(k==='ArrowUp'?2:1))%3;S.kc=Math.min(S.kc,KB_ROWS[S.kr].length-1);Music.sfx('blip');return;}
 if(k==='ArrowLeft'||k==='ArrowRight'){const n=KB_ROWS[S.kr].length;S.kc=(S.kc+(k==='ArrowLeft'?n-1:1))%n;Music.sfx('blip');return;}
 if(k===' '){kbPress(KB_ROWS[S.kr][S.kc]);return;}
 if(k==='Enter'&&S.nm.length>=1){const e={name:cleanName(S.nm),level:S.score.level,round:S.score.round,t:Date.now()};
  const lb=insertScore(loadLB(),e);saveLB(lb);S.lb=lb;S.hi=lb.indexOf(e);S.mode='board';}
}
function talk(n){
 n.dir=(S.dir+2)%4;const opp=playerOpponent(S.br);
 if(S.elim.has(n))return say([n.name+': I got knocked out... good luck out there.']);
 if(n===opp)return say([n.name+": So you're my "+ROUND_NAMES[S.br.round]+' opponent!','Rumor: '+STRATS[n.strat].d,n.name+": Let's throw down!"],()=>startBattle(n));
 const alive=S.npcs.filter(x=>!S.elim.has(x));
 const tips=["Hey! I'm in this round too.",'They say '+rnd(alive).name+' has a pattern...','Watch what your opponent did last round!','Nice place, '+S.map.name+', huh?'];
 say([n.name+': '+rnd(tips),'(Rumor: '+n.name+' - '+STRATS[n.strat].d+')']);
}
function startBattle(n){Music.sfx('encounter');S.mode='battle';S.battle={opp:n,pw:0,ow:0,ph:[],oh:[],sel:0,phase:'intro',t:0,text:'A challenger appears! '+n.name+' wants to battle!',pm:null,om:null};}
function battleKey(k){const b=S.battle;
 if(b.phase==='intro'||b.phase==='result'){if(isAct(k))nextAfter();return;}
 if(b.phase==='menu'){
  if(k==='ArrowLeft'||k==='a'||k==='A'){b.sel=(b.sel+2)%3;Music.sfx('blip');}
  if(k==='ArrowRight'||k==='d'||k==='D'){b.sel=(b.sel+1)%3;Music.sfx('blip');}
  if(k==='1'||k==='2'||k==='3')b.sel=+k-1;
  if(isAct(k)||k==='1'||k==='2'||k==='3'){b.pm=MOVES[b.sel];b.om=STRATS[b.opp.strat].f(b.oh,b.ph);b.phase='reveal';b.t=0;b.text='Rock... Paper... Scissors...';}}
}
function nextAfter(){const b=S.battle;if(b.done){finishBattle(b.pw>b.ow);return;}b.phase='menu';b.text=IS_TOUCH?'Tap your move!':'Choose your move!  (←/→ + SPACE, or 1/2/3)';}
function resolve(){const b=S.battle;b.ph.push(b.pm);b.oh.push(b.om);const r=outcome(b.pm,b.om);
 const cap=s=>s[0].toUpperCase()+s.slice(1);
 if(r===0)b.text='Both threw '+cap(b.pm)+"! It's a tie - go again!";
 else if(r>0){b.pw++;b.text=cap(b.pm)+' beats '+cap(b.om)+'! You win the round!';b.flash='o';}
 else{b.ow++;b.text=cap(b.om)+' beats '+cap(b.pm)+'! '+b.opp.name+' wins the round!';b.flash='p';}
 if(r>0)b.text=cap(b.pm)+' beats '+cap(b.om)+'! '+b.opp.name+' loses 1 HP!';
 if(r<0)b.text=cap(b.om)+' beats '+cap(b.pm)+'! You lose 1 HP!';
 if(b.pw===S.br.need){b.done=true;b.text+=' '+b.opp.name+' is out of HP - you win!';Music.sfx(S.br.round===3?'champ':'win');}
 else if(b.ow===S.br.need){b.done=true;b.text+=' Out of HP - you lost...';Music.sfx('lose');}
 else if(r>0)Music.sfx('rwin');else if(r<0)Music.sfx('rlose');
 b.phase='result';b.t=0;}
function finishBattle(won){const opp=S.battle.opp;S.mode='world';S.battle=null;
 const prev=S.br.rounds[S.br.round],next=advance(S.br,won);
 prev.forEach(p=>{if(!p.player&&!next.includes(p))S.elim.add(p);});
 if(!won){S.mode='over';S.lostTo=opp;return;}
 if(S.br.round===4){S.mode='champ';return;}
 const o=playerOpponent(S.br);
 say(['You defeated '+opp.name+'!','Other matches finished. '+next.length+' fighters remain.','Next up ('+ROUND_NAMES[S.br.round]+'): '+o.name+'. Find them!'],()=>{S.showB=true;});
}
function update(dt){S.t+=dt;
 if(S.mode==='world'&&!S.msg&&!S.showB){
  if(S.moving){S.moving-=dt*7;if(S.moving<=0)S.moving=0;}
  if(!S.moving){let d=-1;
   if(keys.ArrowUp||keys.w||keys.W)d=0;else if(keys.ArrowRight||keys.d||keys.D)d=1;else if(keys.ArrowDown||keys.s||keys.S)d=2;else if(keys.ArrowLeft||keys.a||keys.A)d=3;
   if(d>=0){S.dir=d;const nx=S.px+DX[d],ny=S.py+DY[d];if(!solid(nx,ny)){S.fromX=S.px;S.fromY=S.py;S.px=nx;S.py=ny;S.moving=1;}}}}
 if(S.mode==='battle'){const b=S.battle;b.t+=dt;if(b.phase==='reveal'&&b.t>1.6)resolve();if(b.flash&&b.phase==='result'&&b.t>.6)b.flash=null;}
}
function musicKey(){if(S.mode==='title'||S.mode==='board')return'title';if(S.mode==='champ')return'champ';if(S.mode==='over'||S.mode==='name')return'over';
 return's'+Math.min(S.br.round,3)+(S.mode==='battle'?'b':'');}
let last=0;
function frame(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;Music.set(musicKey());update(dt);
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,VIEW.bw,VIEW.bh);HITS=[];
 if(S.mode==='title')drawTitle();else if(S.mode==='world'){drawWorld();if(S.showB)drawBracket();drawMsg();}
 else if(S.mode==='battle')drawBattle();else if(S.mode==='name')drawName();else if(S.mode==='board')drawBoard();else drawEnd(S.mode==='champ');
 drawToast(dt);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
resize();addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,150));if(window.visualViewport)visualViewport.addEventListener('resize',resize);

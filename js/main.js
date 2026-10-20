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
// ---- persistence (localStorage): saved run, intro-seen flag, last name ----
const RUN_KEY='rpsRun',INTRO_KEY='rpsIntroSeen',NAME_KEY='rpsLastName';
const ls={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}},del(k){try{localStorage.removeItem(k);}catch(e){}}};
function saveRun(){if(!S||!['world','battle','champ'].includes(S.mode))return;const b=S.battle;
 const d={v:1,t:Date.now(),level:S.level,map:S.map.id,round:S.br.round,need:S.br.need,champ:S.mode==='champ',
  rounds:S.br.rounds.map(r=>r.map(p=>p.name)),strat:{},pos:{},elim:[...S.elim].map(p=>p.name),px:S.px,py:S.py,dir:S.dir,
  battle:b?{opp:b.opp.name,pw:b.pw,ow:b.ow,ph:b.ph,oh:b.oh,tieRun:b.tieRun||0}:null};
 S.br.rounds[0].forEach(p=>{if(!p.player){d.strat[p.name]=p.strat;d.pos[p.name]=[p.x,p.y];}});
 ls.set(RUN_KEY,JSON.stringify(d));}
function clearRun(){ls.del(RUN_KEY);}
function savedRun(){try{const d=JSON.parse(ls.get(RUN_KEY)||'null');if(!d||d.v!==1||!MAPS[d.map]||!Array.isArray(d.rounds))return null;return d;}catch(e){return null;}}
function restoreRun(d){const by={};
 by.You={name:'You',strat:null,look:PLAYER_LOOK,color:PLAYER_LOOK.shirt,player:true};
 NPCS.forEach(([n,st,l])=>{by[n]={name:n,strat:d.strat[n]||st,look:l,color:l.shirt};});
 const rounds=d.rounds.map(r=>r.map(n=>by[n]));if(rounds.some(r=>r.some(p=>!p)))return false;
 const br={rounds,round:d.round,level:d.level,need:d.need},map=MAPS[d.map],npcs=rounds[0].filter(p=>!p.player);
 npcs.forEach(p=>{const q=d.pos[p.name]||[1,1];p.x=q[0];p.y=q[1];p.dir=2;});
 S={mode:'world',level:d.level,map,br,npcs,px:d.px,py:d.py,fromX:d.px,fromY:d.py,dir:d.dir||0,moving:0,msg:null,showB:false,battle:null,t:S?S.t:0,elim:new Set(d.elim.map(n=>by[n]).filter(Boolean)),muteT:0};
 Music.setLevel(S.level);
 if(d.champ)S.mode='champ';
 else if(d.battle&&by[d.battle.opp]){const x=d.battle;S.mode='battle';
  S.battle={opp:by[x.opp],pw:x.pw,ow:x.ow,ph:x.ph||[],oh:x.oh||[],tieRun:x.tieRun||0,sel:0,phase:'menu',t:0,menuAt:S.t,intro:1,text:'Welcome back! Your match vs '+x.opp+' continues.',pm:null,om:null};
  const b=S.battle;if(b.pw>=br.need||b.ow>=br.need){b.done=true;b.phase='result';b.t=9;b.pm=b.ph[b.ph.length-1]||null;b.om=b.oh[b.oh.length-1]||null;b.text=(b.pw>b.ow?'You won the match!':'You lost the match...')+' Tap to continue.';}}
 else note('Welcome back! Level '+S.level+', '+ROUND_NAMES[S.br.round]+'.');
 return true;}
function note(t,d=2.6){S.note={t,d};}
// start playing from the title (fresh run). Welcome text only on the very first run on this device.
function startRun(){S.mode='world';Music.setLevel(S.level);saveRun();
 if(!ls.get(INTRO_KEY)){ls.set(INTRO_KEY,'1');say(['Welcome to the Grand RPS Tournament! 16 fighters, single elimination.','Walk to your opponent (marked with !) and press A to talk. Win '+S.br.need+' throws to knock them out.']);}
 else note('Find your opponent (!) - '+playerOpponent(S.br).name);}
function continueRun(){const d=savedRun();if(!d||!restoreRun(d)){clearRun();startRun();}}
newGame();
try{if(sessionStorage.getItem('rpsAutoStart')){sessionStorage.removeItem('rpsAutoStart');startRun();}}catch(e){}
setTimeout(syncPending,1500);
function solid(x,y){return isSolidTile(S.map,x,y)||S.npcs.some(n=>n.x===x&&n.y===y);}
const DX=[0,1,0,-1],DY=[-1,0,1,0];
const keys={};
addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Backspace'].includes(e.key))e.preventDefault();
 Music.unlock();
 if(e.repeat&&!/^Arrow|^[wasdWASD]$/.test(e.key))return;
 keys[e.key]=true;
 if(S.mode!=='name'&&(e.key==='m'||e.key==='M')){S.muteT=1.5;Music.toggle();return;}
 if(S.lbOpen){if(isAct(e.key)||e.key==='Escape'||e.key==='l'||e.key==='L')closeLB();return;} // overlay swallows all other input
 if(S.mode!=='name'&&S.mode!=='board'&&(e.key==='l'||e.key==='L')){openLB();return;}
 onKey(e.key);});
addEventListener('keyup',e=>keys[e.key]=false);
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const isAct=k=>k===' '||k==='Enter'||k==='z'||k==='Z';
function say(lines,then){S.msg={lines:[].concat(lines),i:0,then};}
function playAgain(){if(window.__pendingUpdate){clearRun();try{sessionStorage.setItem('rpsAutoStart','1');}catch(e){}applyUpdate();return;}newGame(1);startRun();}
function toTitle(){newGame(1);if(window.__pendingUpdate)applyUpdate();}
function titleAction(a){if(a==='cont')continueRun();else{clearRun();startRun();}}
function onKey(k){
 if(S.mode==='board'){if(isAct(k)||k==='r'||k==='R')playAgain();else if(k==='Escape'||k==='l'||k==='L'||k==='t'||k==='T')toTitle();return;}
 if(S.mode==='name'){nameKey(k);return;}
 if(S.mode==='title'){const has=!!savedRun();
  if(has&&(k==='n'||k==='N')){titleAction('new');return;}
  if(isAct(k)||k==='c'||k==='C')titleAction(has?'cont':'new');return;}
 if(S.mode==='champ'){if(isAct(k)){const L=S.level+1;newGame(L,S.map.id);S.mode='world';Music.setLevel(L);saveRun();
   say(['LEVEL '+L+': '+S.map.name+'! The competition got smarter.'+(bestOf(L)===5?' Matches are now Best of 5 - first to 3 wins!':'')]);}return;}
 if(S.mode==='over'){if(isAct(k)||k==='r'||k==='R'){const sc={level:S.level,round:S.br.round-1};
   const ref=S.glb||cachedGlobalLB()||loadLB(); // place against the shared top 10 (deduped), else cached/local
   const pl=placement(ref,sc);
   if(pl){S.mode='name';S.nm=cleanName(ls.get(NAME_KEY)||'');S.kr=0;S.kc=0;S.score=sc;S.place=pl;}else openBoard(null);}return;}
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
 if(k==='Enter'&&S.nm.length>=1){const e={name:cleanName(S.nm),level:S.score.level,round:S.score.round,posted:false};
  ls.set(NAME_KEY,e.name);saveLB(insertScore(loadLB(),e));const mine={name:e.name,level:e.level,round:e.round};
  postScore(e).then(()=>{markPosted(e);openBoard(mine);},()=>{openBoard(mine);});S.mode='board';S.lb=dedupeLB(insertScore(S.glb||cachedGlobalLB()||loadLB(),e));S.mine=mine;S.lbState='saving...';}
}
// In-game leaderboard overlay: shown on top of whatever is happening (title, world, battle, end screens); game is paused underneath and resumes untouched on close.
function clearHeld(){for(const k in keys)keys[k]=false;document.querySelectorAll('.b.on').forEach(el=>el.classList.remove('on'));}
function openLB(){if(S.lbOpen||S.mode==='name'||S.mode==='board')return;clearHeld();S.lbOpen=true;Music.sfx('blip');loadBoard(null);}
function closeLB(){if(!S.lbOpen)return;S.lbOpen=false;S.lbTok=(S.lbTok||0)+1;clearHeld();Music.sfx('blip');}
function toggleLB(){if(S.mode==='board'){newGame(1);return;}if(S.lbOpen)closeLB();else openLB();}
function openBoard(mine){S.mode='board';loadBoard(mine);}
function localView(){const c=cachedGlobalLB();return dedupeLB((c||[]).concat(loadLB())).slice(0,LB_MAX);}
function loadBoard(mine){S.mine=mine;S.lb=S.lb&&S.mine?S.lb:localView();S.lbState='loading...';const tok=S.lbTok=(S.lbTok||0)+1;
 const withMine=a=>mine&&!a.some(e=>e.name===mine.name&&e.level===mine.level&&e.round===mine.round)?dedupeLB(insertScore(a,mine)):a;
 fetchGlobalLB().then(a=>{if(S.lbTok!==tok)return;S.lb=withMine(a);S.lbState='GLOBAL';},
  ()=>{if(S.lbTok!==tok)return;S.lb=withMine(localView());S.lbState=cachedGlobalLB()?'offline - last saved board':'offline - this device';});}
function talk(n){
 n.dir=(S.dir+2)%4;const opp=playerOpponent(S.br);
 if(S.elim.has(n))return say([n.name+': I got knocked out... good luck out there.']);
 if(n===opp)return say([n.name+": You're my "+ROUND_NAMES[S.br.round]+' opponent! (Rumor: '+STRATS[n.strat].d+')'],()=>startBattle(n));
 const alive=S.npcs.filter(x=>!S.elim.has(x));
 const tips=["Hey! I'm in this round too.",'They say '+rnd(alive).name+' has a pattern...','Watch what your opponent did last round!','Nice place, '+S.map.name+', huh?'];
 say([n.name+': '+rnd(tips)+' (Rumor: '+STRATS[n.strat].d+')']);
}
function startBattle(n){Music.sfx('encounter');S.mode='battle';S.battle={opp:n,pw:0,ow:0,ph:[],oh:[],sel:0,phase:'intro',t:0,tieRun:0,text:n.name+' wants to battle! First to '+S.br.need+' wins.',pm:null,om:null};saveRun();}
// pacing (seconds): intro + non-final results auto-advance (tap skips); KO/match end waits for a tap
const PACE={intro:1.2,reveal:.9,result:1.25,guard:.25};
const TIE_CAP=3; // after 3 ties in a row the next throw can't tie
function battleKey(k){const b=S.battle;
 if(b.phase==='intro'||b.phase==='result'){if(isAct(k))nextAfter();return;}
 if(b.phase==='menu'&&S.t-(b.menuAt||0)<PACE.guard)return; // swallow a skip-tap that lands right as the menu opens
 if(b.phase==='menu'){
  if(k==='ArrowLeft'||k==='a'||k==='A'){b.sel=(b.sel+2)%3;Music.sfx('blip');}
  if(k==='ArrowRight'||k==='d'||k==='D'){b.sel=(b.sel+1)%3;Music.sfx('blip');}
  if(k==='1'||k==='2'||k==='3')b.sel=+k-1;
  if(isAct(k)||k==='1'||k==='2'||k==='3'){b.pm=MOVES[b.sel];b.om=STRATS[b.opp.strat].f(b.oh,b.ph);
   if((b.tieRun||0)>=TIE_CAP&&b.om===b.pm)b.om=rnd(MOVES.filter(x=>x!==b.pm));b.phase='reveal';b.t=0;b.text='Rock... Paper... Scissors...';}}
}
function nextAfter(){const b=S.battle;if(b.done){finishBattle(b.pw>b.ow);return;}b.phase='menu';b.menuAt=S.t;b.text=(IS_TOUCH?'Tap your move!':'Choose your move!  (←/→ + SPACE, or 1/2/3)')+(b.tieRun>=TIE_CAP?' (Tie-breaker: no more ties!)':'');}
function resolve(){const b=S.battle;b.ph.push(b.pm);b.oh.push(b.om);const r=outcome(b.pm,b.om);
 const cap=s=>s[0].toUpperCase()+s.slice(1);
 b.tieRun=r===0?(b.tieRun||0)+1:0;
 if(r===0)b.text='Both threw '+cap(b.pm)+"! It's a tie - go again!";
 else if(r>0){b.pw++;b.text=cap(b.pm)+' beats '+cap(b.om)+'! You win the round!';b.flash='o';}
 else{b.ow++;b.text=cap(b.om)+' beats '+cap(b.pm)+'! '+b.opp.name+' wins the round!';b.flash='p';}
 if(r>0)b.text=cap(b.pm)+' beats '+cap(b.om)+'! '+b.opp.name+' loses 1 HP!';
 if(r<0)b.text=cap(b.om)+' beats '+cap(b.pm)+'! You lose 1 HP!';
 if(b.pw===S.br.need){b.done=true;b.text+=' '+b.opp.name+' is out of HP - you win!';Music.sfx(S.br.round===3?'champ':'win');}
 else if(b.ow===S.br.need){b.done=true;b.text+=' Out of HP - you lost...';Music.sfx('lose');}
 else if(r>0)Music.sfx('rwin');else if(r<0)Music.sfx('rlose');
 b.phase='result';b.t=0;saveRun();}
function finishBattle(won){const opp=S.battle.opp;S.mode='world';S.battle=null;if(!won){S.glb=null;clearRun();fetchGlobalLB().then(a=>{S.glb=a;},()=>{});}
 const prev=S.br.rounds[S.br.round],next=advance(S.br,won);
 prev.forEach(p=>{if(!p.player&&!next.includes(p))S.elim.add(p);});
 if(!won){S.mode='over';S.lostTo=opp;return;}
 if(S.br.round===4){S.mode='champ';saveRun();return;}
 const o=playerOpponent(S.br);saveRun();
 say(['You beat '+opp.name+'! '+next.length+' fighters left. Next ('+ROUND_NAMES[S.br.round]+'): '+o.name+'.'],()=>{S.showB=true;});
}
function update(dt){S.t+=dt;if(S.lbOpen)return; // paused under the leaderboard overlay
 if(S.mode==='world'&&!S.msg&&!S.showB){
  if(S.moving){S.moving-=dt*7;if(S.moving<=0)S.moving=0;}
  if(!S.moving){let d=-1;
   if(keys.ArrowUp||keys.w||keys.W)d=0;else if(keys.ArrowRight||keys.d||keys.D)d=1;else if(keys.ArrowDown||keys.s||keys.S)d=2;else if(keys.ArrowLeft||keys.a||keys.A)d=3;
   if(d>=0){S.dir=d;const nx=S.px+DX[d],ny=S.py+DY[d];if(!solid(nx,ny)){S.fromX=S.px;S.fromY=S.py;S.px=nx;S.py=ny;S.moving=1;}}}}
 if(S.mode==='battle'){const b=S.battle;b.t+=dt;if(b.phase==='reveal'&&b.t>PACE.reveal)resolve();if(b.flash&&b.phase==='result'&&b.t>.6)b.flash=null;
  if(b.phase==='intro'&&b.t>PACE.intro)nextAfter();else if(b.phase==='result'&&!b.done&&b.t>PACE.result)nextAfter();}
 if(S.note){S.note.d-=dt;if(S.note.d<=0)S.note=null;}
}
function musicKey(){if(S.mode==='title'||S.mode==='board')return'title';if(S.mode==='champ')return'champ';if(S.mode==='over'||S.mode==='name')return'over';
 return's'+Math.min(S.br.round,3)+(S.mode==='battle'?'b':'');}
let last=0;
function frame(ts){const dt=Math.min(.05,(ts-last)/1000||0);last=ts;Music.set(musicKey());update(dt);
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,VIEW.bw,VIEW.bh);HITS=[];
 if(S.mode==='title')drawTitle();else if(S.mode==='world'){drawWorld();if(S.showB)drawBracket();drawMsg();}
 else if(S.mode==='battle')drawBattle();else if(S.mode==='name')drawName();else if(S.mode==='board')drawBoard();else drawEnd(S.mode==='champ');
 if(S.lbOpen)drawBoard(true);
 drawToast(dt);drawNote();
 if(window.__pendingUpdate&&updateSafe())applyUpdate();
 requestAnimationFrame(frame);}
// A newer version is only applied between runs (title / end-of-run leaderboard), never mid-run.
// a new version is applied only on the title screen (the run is saved, so nothing is lost); never mid-run or before your score is shown
function updateSafe(){return S.mode==='title'&&!S.lbOpen;}
function applyUpdate(){const u=window.__pendingUpdate;window.__pendingUpdate=null;try{sessionStorage.setItem('rpsReload_'+u.v,'1');}catch(e){}location.replace(u.url);}
requestAnimationFrame(frame);
resize();addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,150));if(window.visualViewport){visualViewport.addEventListener('resize',resize);visualViewport.addEventListener('scroll',resize);}
// Re-fit after Safari chrome settles (URL bar show/hide often lags the first paint)
addEventListener('focus',()=>setTimeout(resize,50));addEventListener('pageshow',()=>setTimeout(resize,50));if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>resize()).catch(()=>{});

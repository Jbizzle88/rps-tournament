"use strict";
// Procedural chiptune: Web Audio, lookahead scheduler, per-stage songs, iOS unlock.
const Music=(function(){
 let lvl=1,ac=null,master=null,bus=null,noise=null,muted=(()=>{try{return localStorage.getItem('rpsMuted')==='1';}catch(e){return false;}})(),cur=null,song=null,step=0,nextT=0,loop=0,unlocked=false;
 const MAJ=[0,2,4,5,7,9,11],MIN=[0,2,3,5,7,8,10];
 const mtof=m=>440*Math.pow(2,(m-69)/12);
 function rng(s){return()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};}
 const DEFS={
  title:{bpm:100,root:60,sc:MAJ,prog:[0,3,4,0],lead:1,bass:1,arp:0,drums:0,seed:7},
  s0:{bpm:112,root:60,sc:MAJ,prog:[0,5,3,4],lead:1,bass:1,arp:0,drums:1,seed:11},
  s1:{bpm:126,root:62,sc:MIN,prog:[0,5,2,6],lead:1,bass:1,arp:1,drums:2,seed:23},
  s2:{bpm:140,root:64,sc:MIN,prog:[0,3,6,2],lead:1,bass:2,arp:2,drums:3,harm:1,seed:37},
  s3:{bpm:156,root:66,sc:MIN,prog:[0,5,6,4],lead:2,bass:2,arp:2,drums:4,harm:1,mod:1,seed:53},
  champ:{bpm:132,root:65,sc:MAJ,prog:[0,3,4,0],lead:2,bass:2,arp:2,drums:3,harm:1,seed:71},
  over:{bpm:80,root:57,sc:MIN,prog:[0,3,5,4],lead:1,bass:1,arp:0,drums:0,seed:5}
 };
 function build(key){const d=Object.assign({},DEFS[key.replace('b','')]);
  if(key.endsWith('b')){d.bpm=Math.round(d.bpm*1.1);d.arp=Math.max(d.arp,1);d.drums=Math.min(4,d.drums+1);d.battle=1;}
  const r=rng(d.seed),mel=[];
  for(let bar=0;bar<4;bar++)for(let s=0;s<16;s++){const dense=d.lead>1?.75:.55;
   if(s%4===0||r()<dense*(s%2?0.5:1))mel.push(s%4===0?[0,2,4][Math.floor(r()*3)]:Math.floor(r()*8)-1);else mel.push(null);}
  for(let s=0;s<16;s++)mel[32+s]=mel[s];
  d.mel=mel;if(/^s/.test(key))d.bpm=Math.round(d.bpm*(1+Math.min(lvl-1,6)*.025));return d;}
 function deg(d,n,off){const sc=d.sc,o=Math.floor(n/7),i=((n%7)+7)%7;return d.root+(off||0)+sc[i]+12*o;}
 function tone(type,f,t,dur,vol){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.setValueAtTime(vol,t+dur*.6);g.gain.linearRampToValueAtTime(0,t+dur);
  o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.02);}
 function drum(kind,t,vol){
  if(kind==='k'){const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);
   g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.17);return;}
  const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise;
  f.type=kind==='h'?'highpass':'bandpass';f.frequency.value=kind==='h'?7000:1800;const L=kind==='h'?.04:.12;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+L);s.connect(f);f.connect(g);g.connect(bus);s.start(t);s.stop(t+L+.02);}
 function play(t){const d=song,sd=60/d.bpm/4,s=step%64,bar=Math.floor(s/16),bs=s%16;
  const off=d.mod?Math.min(loop,3)*(d.battle?2:1):0;
  const ch=d.prog[bar],boost=d.mod?1+Math.min(loop,3)*.12:1;
  const m=d.mel[s];if(m!==null){const n=deg(d,ch+m+7,off);tone('square',mtof(n),t,sd*(d.lead>1?1.6:1.8),.07*boost);
   if(d.lead>1)tone('square',mtof(n+12),t,sd*1.2,.025*boost);
   if(d.harm)tone('square',mtof(deg(d,ch+m+5,off)),t,sd*1.4,.03);}
  if(d.bass>1?bs%2===0:bs%4===0){const n=deg(d,ch,off)-24+(d.bass>1&&bs%4===2?12:0);tone('triangle',mtof(n),t,sd*(d.bass>1?1.8:3.5),.18);}
  if(d.arp&&(d.arp>1||bs%2===0)){const a=[0,2,4,7][bs%4];tone('square',mtof(deg(d,ch+a,off)),t,sd*.8,.025*boost);}
  const dr=d.drums;if(dr){
   if(bs%8===0||(dr>2&&bs%8===6)||(dr>3&&bs===14))drum('k',t,.4);
   if(dr>1&&bs%8===4)drum('s',t,.22);
   if((dr>2||bs%4===2)&&bs%2===0)drum('h',t,.06);
   if(dr>2&&bs%2)drum('h',t,.03);
   if(dr>3&&bar===3&&bs>=12)drum('s',t,.15+.03*(bs-12));}
  step++;if(step%64===0)loop++;}
 function tick(){if(!song||!ac||ac.state!=='running')return;if(nextT<ac.currentTime)nextT=ac.currentTime+.05;while(nextT<ac.currentTime+.12){play(nextT);nextT+=60/song.bpm/4;}}
 // ---- sound effects (go straight to master, so mute applies; music bus is ducked) ----
 function sn(type,midi,t,dur,vol){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=mtof(midi);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.setValueAtTime(vol,t+dur*.7);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.02);}
 function seq(t0,notes,type,vol){let t=t0;notes.forEach(([m,d])=>{if(m!==null)sn(type,m,t,d*.95,vol);t+=d;});return t-t0;}
 function duck(t,len,level){const g=bus.gain;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(level,t+.05);g.setValueAtTime(level,t+len);g.linearRampToValueAtTime(1,t+len+.4);}
 const SFX={
  encounter(t){const n=[];for(let i=0;i<12;i++)n.push([72+(i%4)*3+Math.floor(i/4)*2,.045]);n.push([84,.08],[null,.04],[79,.08],[84,.25]);const L=seq(t,n,'square',.09);seq(t,[[48,.18],[51,.18],[55,.18],[60,.4]],'triangle',.2);return[L,0];},
  win(t){const L=seq(t,[[72,.12],[76,.12],[79,.12],[84,.3],[null,.06],[81,.12],[84,.5]],'square',.09);seq(t,[[76,.36],[79,.36],[81,.18],[79,.5]],'square',.04);seq(t,[[48,.36],[55,.36],[53,.18],[48,.5]],'triangle',.2);return[L,.1];},
  lose(t){const L=seq(t,[[71,.22],[70,.22],[69,.22],[68,.7]],'square',.08);seq(t,[[47,.22],[46,.22],[45,.22],[44,.7]],'triangle',.2);return[L,.1];},
  champ(t){const m=[[67,.1],[67,.1],[67,.1],[72,.45],[null,.05],[71,.12],[72,.12],[74,.12],[76,.5],[null,.05],[74,.12],[76,.12],[79,.12],[84,1.1]];
   const L=seq(t,m,'square',.09);seq(t,m.map(([n,d])=>[n===null?null:n-5,d]),'square',.035);seq(t,[[43,.3],[48,.6],[52,.66],[55,.66],[48,1.1]],'triangle',.22);return[L,.05];},
  rwin(t){seq(t,[[79,.05],[84,.08]],'square',.05);return[0,1];},
  rlose(t){seq(t,[[60,.06],[55,.1]],'square',.05);return[0,1];},
  blip(t){sn('square',88,t,.03,.025);return[0,1];}
 };
 return{
  sfx(name){if(!ac||ac.state!=='running'||!SFX[name])return;const t=ac.currentTime+.02;const[len,lv]=SFX[name](t);if(len)duck(t,len,lv);},
  // Call from inside user-gesture handlers (keydown/pointerdown/touchend/pointerup).
  unlock(){
   if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){} // iOS 17+: play even with silent switch
    ac=new C();master=ac.createGain();master.gain.value=muted?0:.35;master.connect(ac.destination);bus=ac.createGain();bus.gain.value=1;bus.connect(master);
    noise=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const dd=noise.getChannelData(0);for(let i=0;i<dd.length;i++)dd[i]=Math.random()*2-1;
    setInterval(tick,25);if(cur){const c=cur;cur=null;this.set(c);}}
   if(ac.state!=='running')ac.resume();
   if(!unlocked){try{const b=ac.createBuffer(1,1,22050),s=ac.createBufferSource();s.buffer=b;s.connect(ac.destination);s.start(0);}catch(e){}
    if(ac.state==='running')unlocked=true;}
  },
  set(key){if(key===cur)return;const prev=cur;cur=key;if(!ac)return;
   const same=prev&&prev.replace('b','')===key.replace('b','');
   song=key?build(key):null;if(!same){step=0;loop=0;}nextT=ac.currentTime+.06;},
  toggle(){muted=!muted;try{localStorage.setItem('rpsMuted',muted?'1':'0');}catch(e){}if(master)master.gain.setTargetAtTime(muted?0:.35,ac.currentTime,.03);return muted;},
  setLevel(L){lvl=L;},
  get muted(){return muted;}
 };
})();

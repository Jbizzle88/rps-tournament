"use strict";
// Touch controls (auto-shown on touch devices) + audio unlock. Feeds synthetic key events so keyboard logic is shared.
(function(){
if(IS_TOUCH)document.body.classList.add('touch');
const fire=(t,k)=>dispatchEvent(new KeyboardEvent(t,{key:k}));
const press=k=>{fire('keydown',k);fire('keyup',k);};
// iOS needs resume + a played buffer inside a real gesture (touchend/pointerup are the reliable ones)
['touchstart','touchend','pointerdown','pointerup','click'].forEach(t=>document.addEventListener(t,()=>Music.unlock(),{capture:true,passive:true}));
['contextmenu','selectstart','gesturestart','dblclick'].forEach(e=>document.addEventListener(e,ev=>ev.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
document.addEventListener('touchend',e=>{if(e.target.closest&&e.target.closest('.b,canvas'))e.preventDefault();},{passive:false});
document.querySelectorAll('#ctl .b').forEach(el=>{const k=el.dataset.k,tap=el.dataset.tap;
 const down=e=>{e.preventDefault();Music.unlock();if(el.setPointerCapture)try{el.setPointerCapture(e.pointerId);}catch(_){};el.classList.add('on');
  if(k==='l'){toggleLB();return;}            // trophy: open/close leaderboard from any screen
  if(k==='m'){S.muteT=1.5;Music.toggle();return;} // direct (a synthetic 'm' would type M on the name screen)
  fire('keydown',k);if(tap)fire('keyup',k);};
 const up=()=>{if(!el.classList.contains('on'))return;el.classList.remove('on');if(!tap)fire('keyup',k);};
 el.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture'].forEach(t=>el.addEventListener(t,up));});
cv.addEventListener('pointerdown',e=>{e.preventDefault();if(S.lbOpen){closeLB();return;}const r=cv.getBoundingClientRect();
 const dx=(e.clientX-r.left)*VIEW.bw/r.width,dy=(e.clientY-r.top)*VIEW.bh/r.height;
 const h=HITS.find(([x,y,w,hh])=>dx>=x&&dx<x+w&&dy>=y&&dy<y+hh);
 if(S.mode==='battle'&&S.battle){const b=S.battle;
  if(b.phase==='menu'){if(h&&typeof h[4]==='number')press(String(h[4]+1));return;}
  if(b.phase!=='reveal')press(' ');return;}
 if(S.mode==='name'){if(h)kbPress(h[4]);return;}
 if(S.mode==='world'&&!S.msg&&!S.showB)return; // overworld: use A button / keys
 press(' ');});
const nm=document.getElementById('nm');
KB_ROWS.forEach(row=>{const rw=document.createElement('div');rw.className='kr';nm.appendChild(rw);row.split('').forEach(k=>{const c=k==='<'?'DEL':k==='>'?'OK':k;const d=document.createElement('div');d.className='b'+(c.length>1?' wide':'');d.textContent=c;
 if(c==='OK')d.style.background='#2a8a3a';if(c==='DEL')d.style.background='#8a2a2a';
 d.addEventListener('pointerdown',e=>{e.preventDefault();d.classList.add('on');press(c==='DEL'?'Backspace':c==='OK'?'Enter':c);});
 ['pointerup','pointercancel','pointerleave'].forEach(t=>d.addEventListener(t,()=>d.classList.remove('on')));rw.appendChild(d);});});
(function poll(){document.body.classList.toggle('nw',S.mode!=='world'||!!S.lbOpen);nm.style.display=IS_TOUCH&&S.mode==='name'?'flex':'none';requestAnimationFrame(poll);})();
})();

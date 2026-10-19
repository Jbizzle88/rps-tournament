"use strict";
// Canvas + procedural pixel-art drawing helpers and character sprites.
const cv=document.getElementById('c'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
let W=480,H=320;const T=16;
// ---- adaptive view: canvas backing store = device pixels; integer scales keep pixels crisp ----
const VIEW={bw:480,bh:320,dpr:1,portrait:false,gutter:0};
const IS_IOS_BROWSER=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let FR={s:1,ox:0,oy:0};   // current frame transform (device px), used to map hit rects
let HITS=[];               // tappable rects in device px: [x,y,w,h,value]
// Size the game to the VISIBLE area. iOS Safari's bottom URL bar is NOT a safe-area inset, so
// layout viewport (100vh / fixed inset:0) is taller than what the user can see; drawing move
// buttons at the bottom of that taller canvas puts them under the toolbar. visualViewport tracks
// the real visible CSS pixels (and offsetTop when the page is scrolled under chrome).
function resize(){const wr=document.getElementById('wrap'),vv=window.visualViewport;
 let cw,ch,top=0,left=0;
 if(vv){cw=Math.max(1,Math.round(vv.width));ch=Math.max(1,Math.round(vv.height));top=Math.round(vv.offsetTop);left=Math.round(vv.offsetLeft);}
 else{cw=Math.max(1,wr.clientWidth);ch=Math.max(1,wr.clientHeight);}
 // Never exceed the layout viewport (defensive on odd WebViews)
 if(window.innerWidth)cw=Math.min(cw,window.innerWidth);
 if(window.innerHeight)ch=Math.min(ch,window.innerHeight);
 // iOS browsers (Safari 26 floating bar, Chrome/Firefox iOS) can report a viewport that still includes the
 // area UNDER the bottom toolbar. If the reported height is ~ the whole screen, the chrome is clearly not
 // excluded, so keep a bottom gutter free of anything tappable. Not applied in standalone/app (Capacitor) mode.
 const tall=ch>cw*1.05,standalone=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||!!window.Capacitor;
 const chrome=(screen.height||ch)-ch;VIEW.gutter=(IS_IOS_BROWSER&&tall&&!standalone)?Math.max(0,Math.min(100,150-chrome)):0;
 ch=Math.max(1,ch-VIEW.gutter);
 wr.style.top=top+'px';wr.style.left=left+'px';wr.style.width=cw+'px';wr.style.height=ch+'px';
 wr.style.right='auto';wr.style.bottom='auto';
 document.documentElement.style.setProperty('--gb',Math.max(0,(window.innerHeight||0)-(top+ch))+'px'); // keep fixed overlays (name keyboard) above the gutter
 const dpr=Math.min(window.devicePixelRatio||1,3);
 VIEW.dpr=dpr;VIEW.bw=Math.round(cw*dpr);VIEW.bh=Math.round(ch*dpr);cv.width=VIEW.bw;cv.height=VIEW.bh;cv.style.width=cw+'px';cv.style.height=ch+'px';
 VIEW.portrait=ch>cw*1.05;ctx.imageSmoothingEnabled=false;}
// on-screen touch controls footprint (device px)
function ctlBottom(){return (typeof IS_TOUCH!=='undefined'&&IS_TOUCH&&VIEW.portrait)?175*VIEW.dpr:0;}
function ctlSide(){return (typeof IS_TOUCH!=='undefined'&&IS_TOUCH&&!VIEW.portrait)?170*VIEW.dpr:0;}
// UI layer: base 270 wide (portrait) / 480x320 (landscape); W,H become the flexible logical size
function ui(){const r=VIEW.portrait?Math.min(VIEW.bw/270,VIEW.bh/480):Math.min(VIEW.bw/480,VIEW.bh/320);const s=r>=1?Math.floor(r):r;
 ctx.setTransform(s,0,0,s,0,0);W=VIEW.bw/s;H=VIEW.bh/s;FR={s,ox:0,oy:0};}
// fixed 480x320 centered frame (landscape battle)
function land(bg){ui();R(0,0,W,H,bg);const ox=Math.floor((W-480)/2),oy=Math.floor((H-320)/2);ctx.translate(ox,oy);FR={s:FR.s,ox:ox*FR.s,oy:oy*FR.s};W=480;H=320;}
function hit(x,y,w,h,v){HITS.push([FR.ox+x*FR.s,FR.oy+y*FR.s,w*FR.s,h*FR.s,v]);}
function txtW(s,x,y,c,sz,al,maxW,lh){const per=sz*0.62;const lines=wrap(s,Math.max(4,Math.floor(maxW/per)));lines.forEach((l,i)=>txt(l,x,y+i*(lh||sz+3),c,sz,al));return lines.length;}
function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function txt(s,x,y,c='#000',sz=8,al='left'){ctx.fillStyle=c;ctx.font='bold '+sz+'px monospace';ctx.textAlign=al;ctx.textBaseline='top';ctx.fillText(s,x,y);}
function box(x,y,w,h){R(x,y,w,h,'#283050');R(x+2,y+2,w-4,h-4,'#f8f8f0');R(x+3,y+3,w-6,h-6,'#fff');}
function wrap(s,max){const w=s.split(' '),out=[];let l='';w.forEach(x=>{if((l+' '+x).trim().length>max){out.push(l);l=x;}else l=(l+' '+x).trim();});out.push(l);return out;}
// Character: 16x16 unit grid, scaled by s. dir: 0 up,1 right,2 down,3 left. L = look.
function drawGuy(x,y,dir,L,step,s=1){
 const p=(a,b,w,h,c)=>R(x+a*s,y+b*s,w*s,h*s,c);
 const has=a=>L.acc.includes(a);
 const bw=L.build===1?10:L.build===2?6:8,bx=8-bw/2;
 p(3,14,10,2,'rgba(0,0,0,.25)');
 if(has('cape')&&dir!==0)p(bx-1,7,bw+2,7,L.accC);
 const lo=step?1:0;
 p(5,12,2,3-lo,L.pants);p(9,12,2,2+lo,L.pants);p(5,15-lo,2,1,'#222');p(9,14+lo,2,1,'#222');
 p(bx,7,bw,6,L.shirt);p(bx,7,bw,1,'rgba(255,255,255,.3)');p(bx,11,bw,1,'rgba(0,0,0,.25)');
 p(bx-1,8,1,4,L.skin);p(bx+bw,8,1,4,L.skin);
 if(has('cape')&&dir===0)p(bx-1,7,bw+2,7,L.accC);
 if(has('scarf')){p(bx,7,bw,2,L.accC);if(dir!==0)p(bx+1,9,2,3,L.accC);}
 p(4,1,8,7,L.skin);
 const hc=L.hair,hs=L.hs;
 if(hs!=='bald'){
  if(dir===0)p(4,0,8,6,hc);else{p(4,0,8,3,hc);if(dir===1)p(4,1,3,4,hc);if(dir===3)p(9,1,3,4,hc);}
  if(hs==='long'){p(3,1,1,8,hc);p(12,1,1,8,hc);if(dir===0)p(4,6,8,3,hc);}
  if(hs==='spiky'){p(4,-1,1,1,hc);p(6,-2,1,2,hc);p(9,-2,1,2,hc);p(11,-1,1,1,hc);}
  if(hs==='mohawk'){p(7,-3,2,4,hc);}
  if(hs==='ponytail'){if(dir===0)p(7,5,2,4,hc);else if(dir===1)p(2,2,2,5,hc);else if(dir===3)p(12,2,2,5,hc);else p(12,2,1,4,hc);}
  if(hs==='bun')p(6,-2,4,2,hc);
 } else p(6,1,2,1,'rgba(255,255,255,.35)');
 if(dir!==0){
  const eyes=dir===2?[5,9]:dir===1?[9]:[5];
  eyes.forEach(ex=>p(ex,4,2,2,'#000'));
  if(dir===2)p(7,6,2,1,'#c06060');
  if(has('beard')){if(dir===2)p(5,6,6,2,hc);else p(dir===1?8:4,6,4,2,hc);}
  else if(has('mustache')&&dir===2)p(6,6,4,1,hc==='#ddd'?'#bbb':hc);
  if(has('glasses')){eyes.forEach(ex=>{p(ex,4,2,2,'#9cf');p(ex,4,2,1,'#222');});if(dir===2)p(7,4,2,1,'#222');}
  if(has('shades')){if(dir===2)p(4,4,8,2,'#111');else p(dir===1?8:4,4,4,2,'#111');}
  if(has('mask')){if(dir===2){p(4,3,8,3,'#111');p(5,4,2,1,'#fff');p(9,4,2,1,'#fff');}else p(dir===1?7:4,3,5,3,'#111');}
 }
 const h=L.hat,c=L.hatC;
 if(h==='cap'){p(4,0,8,2,c);if(dir===2)p(3,2,10,1,c);if(dir===1)p(10,2,4,1,c);if(dir===3)p(2,2,4,1,c);}
 if(h==='beanie'){p(4,-1,8,3,c);p(4,1,8,1,'rgba(0,0,0,.2)');p(7,-2,2,1,'#fff');}
 if(h==='crown'){p(4,-2,8,2,'#ffd040');p(4,-3,1,1,'#ffd040');p(7,-3,2,1,'#ffd040');p(11,-3,1,1,'#ffd040');p(7,-1,2,1,'#e02040');}
 if(h==='tophat'){p(5,-4,6,4,'#222');p(3,0,10,1,'#222');p(5,-1,6,1,c);}
 if(h==='headband'){p(4,2,8,1,c);if(dir!==2)p(dir===3?12:2,2,2,2,c);}
 if(h==='bow'){p(9,-1,2,2,c);p(11,-2,2,4,c);p(7,-2,2,4,c);}
 if(h==='wizard'){p(3,0,10,1,c);p(5,-2,6,2,c);p(6,-4,4,2,c);p(7,-6,2,2,c);p(6,-1,1,1,'#ffd040');}
}
// Hand icons for rock/paper/scissors (16 unit grid)
function drawHand(m,x,y,s,flip){
 const p=(a,b,w,h,c)=>R(x+(flip?(16-a-w):a)*s,y+b*s,w*s,h*s,c);
 const skin='#f0c090',sh='#c08850';
 if(m==='rock'){p(3,5,10,8,skin);p(3,5,10,1,'#fff3');p(3,8,10,1,sh);p(6,5,1,4,sh);p(9,5,1,4,sh);p(2,7,2,4,skin);p(3,12,10,1,sh);}
 else if(m==='paper'){p(3,6,10,8,skin);[3,5,7,9].forEach(a=>{p(a+1,1,2,6,skin);p(a+2,1,1,6,sh);});p(0,8,4,2,skin);p(3,13,10,1,sh);}
 else {p(3,8,9,6,skin);p(4,1,2,8,skin);p(8,1,2,8,skin);p(5,1,1,7,sh);p(9,1,1,7,sh);p(4,10,8,1,sh);p(3,13,9,1,sh);}
}

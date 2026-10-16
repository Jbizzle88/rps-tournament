"use strict";
// Local top-10 leaderboard (localStorage, per browser). Score = {level, round}.
// Swap loadLB/saveLB for a server API later for a live leaderboard.
const LB_KEY='rpsTournamentLB',LB_MAX=10;
function cmpScore(a,b){return b.level-a.level||b.round-a.round;}
function qualifies(lb,sc){return lb.length<LB_MAX||cmpScore(lb[lb.length-1],sc)>0;}
function insertScore(lb,e){const out=lb.concat([e]);out.sort(cmpScore);return out.slice(0,LB_MAX);}
function cleanName(s){return String(s||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,5);}
function loadLB(){try{const v=JSON.parse(localStorage.getItem(LB_KEY)||'[]');return Array.isArray(v)?v.filter(e=>e&&typeof e.level==='number').map(e=>({name:cleanName(e.name)||'???',level:e.level,round:e.round|0,posted:e.posted===true})).sort(cmpScore).slice(0,LB_MAX):[];}catch(e){return[];}}
function saveLB(lb){try{localStorage.setItem(LB_KEY,JSON.stringify(lb));}catch(e){}}
// ---- Global leaderboard (Supabase PostgREST). Publishable key is public by design; RLS allows anon select+insert. ----
const SB_URL='https://mnxnlskvseiywtswjuhq.supabase.co/rest/v1/scores',SB_KEY='sb_publishable_oY26QOnRSy4bRpBs4PHHNA_DFKn4Zij';
const SB_H={apikey:SB_KEY,Authorization:'Bearer '+SB_KEY};
// round: 0=Round of 16, 1=Quarterfinal, 2=Semifinal, 3=Final (eliminated there), 4/5 reserved (champion); clamp to 0-5
const ROUND_LABELS=['Round of 16','Quarterfinal','Semifinal','Final','Champion','Champion'];
const clampRound=r=>Math.max(0,Math.min(5,r|0));
function fetchGlobalLB(){const ctl=typeof AbortController!=='undefined'?new AbortController():null;const tm=setTimeout(()=>ctl&&ctl.abort(),6000);
 return fetch(SB_URL+'?select=name,level,round,created_at&order=level.desc,round.desc,created_at.asc&limit='+LB_MAX,{headers:SB_H,signal:ctl&&ctl.signal})
  .then(r=>{clearTimeout(tm);if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
  .then(a=>a.map(e=>({name:cleanName(e.name),level:e.level|0,round:clampRound(e.round)})));}
function postScore(e){return fetch(SB_URL,{method:'POST',headers:Object.assign({'Content-Type':'application/json',Prefer:'return=minimal'},SB_H),
 body:JSON.stringify({name:cleanName(e.name),level:Math.max(1,Math.min(1000,e.level|0)),round:clampRound(e.round)})}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);});}
// ---- retry local scores that never reached the server (missing flag = from an older build => unposted) ----
function markPosted(e){const lb=loadLB();const x=lb.find(a=>!a.posted&&a.name===e.name&&a.level===e.level&&a.round===e.round);if(x){x.posted=true;saveLB(lb);}}
function syncPending(){return loadLB().filter(e=>!e.posted&&/^[A-Z]{1,5}$/.test(e.name)).reduce((p,e)=>p.then(()=>postScore(e)).then(()=>markPosted(e)),Promise.resolve()).catch(()=>{});}

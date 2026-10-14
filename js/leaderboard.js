"use strict";
// Local top-10 leaderboard (localStorage, per browser). Score = {level, round}.
// Swap loadLB/saveLB for a server API later for a live leaderboard.
const LB_KEY='rpsTournamentLB',LB_MAX=10;
function cmpScore(a,b){return b.level-a.level||b.round-a.round;}
function qualifies(lb,sc){return lb.length<LB_MAX||cmpScore(lb[lb.length-1],sc)>0;}
function insertScore(lb,e){const out=lb.concat([e]);out.sort(cmpScore);return out.slice(0,LB_MAX);}
function cleanName(s){return String(s||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,5);}
function loadLB(){try{const v=JSON.parse(localStorage.getItem(LB_KEY)||'[]');return Array.isArray(v)?v.filter(e=>e&&typeof e.level==='number').map(e=>({name:cleanName(e.name)||'???',level:e.level,round:e.round|0})).sort(cmpScore).slice(0,LB_MAX):[];}catch(e){return[];}}
function saveLB(lb){try{localStorage.setItem(LB_KEY,JSON.stringify(lb));}catch(e){}}

"use strict";
// Game rules, opponent AI styles, roster/looks, bracket logic. (No DOM; node-testable.)
const MOVES=['rock','paper','scissors'];
const BEATS={rock:'scissors',paper:'rock',scissors:'paper'};
const COUNTER={rock:'paper',paper:'scissors',scissors:'rock'};
const ROUND_NAMES=['Round of 16','Quarterfinal','Semifinal','Final'];
function outcome(a,b){return a===b?0:(BEATS[a]===b?1:-1);}
const rnd=a=>a[Math.floor(Math.random()*a.length)];
// strategy f(myHistory, opponentHistory) -> move
const STRATS={
 rocky:{d:'Loves rock.',f:()=>Math.random()<.6?'rock':rnd(MOVES)},
 papery:{d:'Paper fan.',f:()=>Math.random()<.6?'paper':rnd(MOVES)},
 snippy:{d:'Scissors happy.',f:()=>Math.random()<.6?'scissors':rnd(MOVES)},
 copy:{d:'Copies your last move.',f:(m,o)=>o.length?o[o.length-1]:rnd(MOVES)},
 counter:{d:'Counters your last move.',f:(m,o)=>o.length?COUNTER[o[o.length-1]]:rnd(MOVES)},
 cycle:{d:'Cycles R-P-S.',f:(m)=>MOVES[m.length%3]},
 rcycle:{d:'Cycles S-P-R.',f:(m)=>MOVES[(3-(m.length%3))%3]},
 stubborn:{d:'Repeats after a win.',f:(m,o)=>{const n=m.length;if(!n)return rnd(MOVES);return outcome(m[n-1],o[n-1])===1?m[n-1]:rnd(MOVES);}},
 shifty:{d:'Never repeats a move.',f:(m)=>{const l=m[m.length-1];return rnd(MOVES.filter(x=>x!==l));}},
 freq:{d:'Counters your favorite.',f:(m,o)=>{if(o.length<2)return rnd(MOVES);const c={rock:0,paper:0,scissors:0};o.forEach(x=>c[x]++);const fav=MOVES.reduce((a,b)=>c[b]>c[a]?b:a);return COUNTER[fav];}},
 chaos:{d:'Pure chaos.',f:()=>rnd(MOVES)},
 adapt:{d:'Reads your habits.',f:(m,o)=>{const n=o.length;if(n<3)return rnd(MOVES);const c={rock:0,paper:0,scissors:0};for(let i=1;i<n;i++)if(o[i-1]===o[n-1])c[o[i]]++;const p=MOVES.reduce((a,b)=>c[b]>c[a]?b:a);return Math.random()<.75?COUNTER[p]:rnd(MOVES);}}
};
const LOOK=o=>Object.assign({skin:'#f0c090',hair:'#3a2a1a',hs:'short',hat:null,hatC:'#fff',shirt:'#888',pants:'#334',acc:[],accC:'#800',build:0},o);
const PLAYER_LOOK=LOOK({hat:'cap',hatC:'#f03030',shirt:'#f03030',pants:'#2a3a8a'});
const NPCS=[
 ['Rocco','rocky',LOOK({build:1,skin:'#c68642',hs:'bald',hair:'#222',shirt:'#8b5a2b',pants:'#3a3a3a',acc:['mustache']})],
 ['Paige','papery',LOOK({skin:'#f5d0b0',hs:'long',hair:'#e8c050',shirt:'#f0ead0',pants:'#6080c0',acc:['glasses']})],
 ['Edge','snippy',LOOK({build:2,skin:'#e0b090',hs:'spiky',hair:'#202020',shirt:'#c03040',pants:'#222',acc:['shades']})],
 ['Mimi','copy',LOOK({skin:'#ffe0c8',hs:'bun',hair:'#e070c0',hat:'bow',hatC:'#ff3080',shirt:'#ffa0d8',pants:'#a04080'})],
 ['Kai','counter',LOOK({skin:'#8d5524',hair:'#111',hat:'cap',hatC:'#3070e0',shirt:'#3070e0',pants:'#ddd'})],
 ['Cyra','cycle',LOOK({skin:'#d8a070',hs:'ponytail',hair:'#30b080',hat:'headband',hatC:'#fff',shirt:'#20806a',pants:'#2a4a40'})],
 ['Lyle','rcycle',LOOK({skin:'#f0c8a0',hair:'#a05020',hat:'beanie',hatC:'#80a030',shirt:'#80a030',pants:'#5a4030',acc:['scarf'],accC:'#e0e040'})],
 ['Bruno','stubborn',LOOK({build:1,skin:'#6b4423',hair:'#111',hat:'tophat',hatC:'#c03030',shirt:'#705030',pants:'#2a2a2a',acc:['beard']})],
 ['Fizz','shifty',LOOK({skin:'#ffd8b0',hs:'mohawk',hair:'#ff8020',shirt:'#e0a020',pants:'#333',acc:['shades']})],
 ['Sage','freq',LOOK({skin:'#e8c8a8',hs:'long',hair:'#ddd',hat:'wizard',hatC:'#6040a0',shirt:'#6040a0',pants:'#3a2a60',acc:['beard','cape'],accC:'#402870'})],
 ['Jinx','chaos',LOOK({build:2,skin:'#f0d0c0',hs:'spiky',hair:'#7020a0',shirt:'#202020',pants:'#202020',acc:['mask','cape'],accC:'#802030'})],
 ['Gus','rocky',LOOK({build:1,skin:'#a0704a',hair:'#555',hat:'cap',hatC:'#808080',shirt:'#999',pants:'#4a4a5a',acc:['beard']})],
 ['Tess','counter',LOOK({skin:'#5a3825',hs:'bun',hair:'#111',shirt:'#20a0a0',pants:'#f0f0f0',acc:['glasses']})],
 ['Ozzy','cycle',LOOK({build:2,skin:'#f0b890',hs:'spiky',hair:'#ffd030',hat:'headband',hatC:'#d06020',shirt:'#d06020',pants:'#3a3a6a'})],
 ['Vera','freq',LOOK({skin:'#c89070',hs:'long',hair:'#401010',hat:'crown',shirt:'#b02080',pants:'#401030',acc:['cape'],accC:'#600050'})]
];
const SMART=['freq','counter','stubborn','adapt'];
function smartChance(level){return Math.min(.7,(level-1)*.12);}
function bestOf(level){return level>=4?5:3;}
function makeBracket(level=1){
 const ps=[{name:'You',strat:null,look:PLAYER_LOOK,color:PLAYER_LOOK.shirt,player:true}].concat(NPCS.map(([n,s,l])=>({name:n,strat:(Math.random()<smartChance(level)?rnd(SMART.slice(0,level>=3?4:3)):s),look:l,color:l.shirt})));
 for(let i=ps.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ps[i],ps[j]]=[ps[j],ps[i]];}
 return {rounds:[ps],round:0,level,need:Math.ceil(bestOf(level)/2)};
}
function simMatch(a,b,need=2){
 let wa=0,wb=0;const ha=[],hb=[];let g=0;
 while(wa<need&&wb<need&&g<300){g++;const ma=STRATS[a.strat].f(ha,hb),mb=STRATS[b.strat].f(hb,ha);ha.push(ma);hb.push(mb);const r=outcome(ma,mb);if(r>0)wa++;else if(r<0)wb++;}
 if(wa===wb)return Math.random()<.5?a:b;
 return wa>wb?a:b;
}
function playerOpponent(br){const r=br.rounds[br.round];const i=r.findIndex(p=>p.player);if(i<0)return null;return r[i^1];}
function advance(br,playerWon){
 const r=br.rounds[br.round],next=[];
 for(let i=0;i<r.length;i+=2){const a=r[i],b=r[i+1];
  if(a.player)next.push(playerWon?a:b);else if(b.player)next.push(playerWon?b:a);else next.push(simMatch(a,b,br.need));}
 br.rounds.push(next);br.round++;return next;
}

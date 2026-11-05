const fs=require('fs');
const src=fs.readFileSync('pew_layout.js','utf8');
eval(src.replace(/\/\/ ===PEW-BEGIN===|\/\/ ===PEW-END===/g,''));
let best=[];
for (const pitch of [1.2,1.25,1.3])
 for (const r0 of [8.6,8.7,8.8])
  for (const aisles of [[30,58],[28,45,62],[45]])
   for (const off of [0,0.25,0.5,0.75]) {
     const p=layoutPews({pitch,r0,aislesDeg:aisles,offset:off});
     best.push({n:p.length,pitch,r0,aisles:aisles.join('/'),off});
   }
best.sort((a,b)=>b.n-a.n);
console.log(best.slice(0,8));
console.log('2-aisle best',best.filter(b=>b.aisles==='30/58').slice(0,3));
console.log('3-aisle best',best.filter(b=>b.aisles==='28/45/62').slice(0,3));

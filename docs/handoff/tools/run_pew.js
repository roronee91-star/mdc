const fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8');
eval(src.replace(/\/\/ ===PEW-BEGIN===|\/\/ ===PEW-END===/g,''));
const opt=JSON.parse(process.argv[3]||'{}');
const p=layoutPews(opt);
fs.writeFileSync(process.argv[4]||'pews.json',JSON.stringify(p));
const rows={};p.forEach(q=>rows[q.row]=(rows[q.row]||0)+1);
console.log('pews',p.length,'seats(x2)',p.length*2,'rows',JSON.stringify(rows));

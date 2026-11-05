const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 600, height: 400 } })).newPage();
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=so'); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload(); await p.waitForTimeout(6500);
  await p.evaluate(() => window.__dbg.goTo('step2')); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const T = window.THREE_ || null; const sc = window.__dbg.scene; const spk = []; sc.traverse(o => { if (o.name === 'B1_SPEAKER') spk.push(o); });
    const cam = window.__dbg.camera; const RC = cam.constructor; // not used
    const V = cam.position.constructor; const rc = new (window.__RC)(); 
    const scr = []; const D = 3.15; [-2.4,-1.2,0,1.2,2.4].forEach(t => [-2.5,-3.4,-4.4].forEach(y => scr.push([-13.03 + D*Math.SQRT1_2 + t*Math.SQRT1_2, y, -17.58 + D*Math.SQRT1_2 - t*Math.SQRT1_2])));
    const pts = [[-12.9,-1.9,-12.2],[-12.9,-2.6,-12.2],[-12.9,-3.0,-12.95],[-12.9,-3.0,-11.45],[-12.9,-4.5,-12.2]];
    const seats = window.__dbg.b1Seats; let blocked = 0, total = 0, standB = 0;
    seats.forEach(st => { [0.55, 1.05].forEach((eh, k) => { pts.forEach(pt => { const A = new V(st.x, st.y + eh, st.z), B = new V(...pt); const d = B.clone().sub(A); const L = d.length(); rc.set(A, d.normalize()); rc.far = L; const h = rc.intersectObjects(spk, true); total++; if (h.length) { blocked++; if (k) standB++; } }); }); });
    let sb = 0, st2 = 0; seats.forEach(st => scr.forEach(pt => { const A = new V(st.x, st.y + 0.55, st.z), B = new V(...pt); const d = B.clone().sub(A); const L = d.length(); rc.set(A, d.normalize()); rc.far = L; st2++; if (rc.intersectObjects(spk, true).length) sb++; }));
    return { total, blocked, standB, screenRays: st2, screenBlocked: sb };
  });
  console.log(JSON.stringify(r)); await b.close();
})();

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 300, height: 360 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=po&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(8000);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.wave(120000); });
  const vars = [[-0.3,2.5]];   // 인사 자세 정면 확인 (node wavepose.cjs <폴더>)
  for (let i = 0; i < vars.length; i++) {
    await p.evaluate(([x, z]) => { Object.assign(window.__dbg.WAVE, { x, z, amp: 0 }); const g = window.__dbg.character, q = g.position, a = g.rotation.y; window.__dbg.setCam([q.x + Math.sin(a) * 1.6 + Math.cos(a) * 0.5, q.y + 0.9, q.z + Math.cos(a) * 1.6 - Math.sin(a) * 0.5], [q.x, q.y + 0.6, q.z]); }, vars[i]);
    await p.waitForTimeout(900); await p.screenshot({ path: `${process.argv[2]}/pose${i}.png` });
  }
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

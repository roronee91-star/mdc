// 4층 목양실(컴퓨터·고급 의자·소파)과 그룹실(원목 의자·흰 식탁) 확인 + 앉기
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=f4&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  await p.evaluate(() => window.__dbg.goTo('step7')); await p.waitForTimeout(2200);
  const o = (n) => `docs/verification/2026-11-05/f4-${n}.png`;
  const cam = async (c, t, n) => { await p.evaluate(([c, t]) => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.setCam(c, t); }, [c, t]); await p.waitForTimeout(1800); await p.screenshot({ path: o(n) }); };
  await cam([-9.45, 12.05, -12.7], [-10.7, 10.95, -14.7], 'pastor');
  await cam([-10.0, 11.55, -14.0], [-10.5, 10.95, -15.05], 'pastor-chair');
  await cam([-10.3, 11.6, -12.4], [-11.8, 10.9, -12.95], 'sofa');
  await cam([-0.35, 12.0, -12.0], [-1.3, 10.95, -13.2], 'group');
  const r = await p.evaluate(async () => { const out = []; const all = window.__dbg.seatsHere();
    for (const f of [(s) => Math.abs(s.x + 10.5) < 0.05 && Math.abs(s.z + 15.15) < 0.05, (s) => s.x < -11.4 && s.z > -13.4 && s.z < -12.5, (s) => s.x > -1.8 && s.x < -0.7 && s.z < -12.4 && s.z > -13.5]) {
      const st = all.find(f); if (!st) { out.push('none'); continue; } window.__dbg.sit(st); await new Promise(r => setTimeout(r, 11000)); const c = window.__dbg.character.position; out.push(+Math.hypot(c.x - st.x, c.z - st.z).toFixed(2)); }
    return out; });
  console.log('앉은 뒤 거리 (목사님 의자, 소파, 그룹실 의자):', JSON.stringify(r));
  await p.evaluate(() => { const c = window.__dbg.character.position; window.__dbg.setCam([c.x + 0.9, c.y + 0.9, c.z + 0.9], [c.x, c.y + 0.35, c.z]); }); await p.waitForTimeout(1800); await p.screenshot({ path: o('group-sit') });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

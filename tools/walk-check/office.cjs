// 2층 사무실 컴퓨터 의자 확인 + 앉기
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=of&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  await p.evaluate(() => window.__dbg.goTo('step6')); await p.waitForTimeout(2200);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.setCam([-10.1, 4.55, -6.0], [-10.6, 3.9, -7.3]); }); await p.waitForTimeout(1800);
  await p.screenshot({ path: 'docs/verification/2026-11-05/office-chair.png' });
  await p.evaluate(() => window.__dbg.setCam([-10.9, 4.35, -4.0], [-11.7, 3.85, -4.9])); await p.waitForTimeout(1800);
  await p.screenshot({ path: 'docs/verification/2026-11-05/office-chair2.png' });
  const r = await p.evaluate(async () => { const s = window.__dbg.seatsHere().filter(x => Math.abs(x.z + 7.2) < 0.05 || Math.abs(x.x + 11.5) < 0.05); window.__dbg.sit(s[0]); await new Promise(r => setTimeout(r, 10000)); const c = window.__dbg.character.position; return [s.length, +Math.hypot(c.x - s[0].x, c.z - s[0].z).toFixed(2)]; });
  console.log('컴퓨터 의자 수, 앉은 뒤 거리:', JSON.stringify(r));
  await p.evaluate(() => { const c = window.__dbg.character.position; window.__dbg.setCam([c.x + 0.8, c.y + 0.9, c.z + 0.9], [c.x, c.y + 0.4, c.z - 0.2]); }); await p.waitForTimeout(1800);
  await p.screenshot({ path: 'docs/verification/2026-11-05/office-sit.png' });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

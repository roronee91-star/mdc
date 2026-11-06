// 본당 방송실 위 남쪽 벽 틈, 2층 사무실 책장 뒤 벽 틈이 막혔는지
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=hl&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  await p.evaluate(() => window.__dbg.goTo('step2')); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.setCam([-7.0, -4.6, -9.0], [-6.2, -3.4, 0.0]); }); await p.waitForTimeout(1800);
  await p.screenshot({ path: 'docs/verification/2026-11-05/hole-b1.png' });
  console.log('B1 ray:', JSON.stringify((await p.evaluate(() => window.__dbg.rayHits([-6.2, -2.0, -1.0], [-6.2, -2.0, 2.0]))).map(h => h[1])));
  await p.evaluate(() => window.__dbg.goTo('step3')); await p.waitForTimeout(2500);
  await p.evaluate(() => window.__dbg.character.position.set(-9.6, 3.65, -5.2)); await p.waitForTimeout(500); await p.evaluate(() => window.__dbg.setCam([-10.2, 3.65 + 1.9, -5.6], [-11.0, 3.65 + 0.7, -3.1])); await p.waitForTimeout(1800);
  await p.screenshot({ path: 'docs/verification/2026-11-05/hole-f2.png' });
  console.log('faded:', JSON.stringify(await p.evaluate(() => window.__dbg.faded))); console.log('F2 ray:', JSON.stringify((await p.evaluate(() => window.__dbg.rayHits([-11.0, 4.8, -4.0], [-11.0, 4.8, 0.0]))).map(h => [h[1], h[2]])));
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

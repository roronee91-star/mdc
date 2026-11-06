// 식당 장식 나무가 식탁 의자에 붙지 않았는지 (위에서, 사람 눈높이에서)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=tp&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  await p.evaluate(() => window.__dbg.goTo('step5')); await p.waitForTimeout(2200);
  const y = await p.evaluate(() => window.__dbg.character.position.y);
  await p.evaluate((y) => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.setCam([-6.0, y + 6.5, -7.4], [-6.0, y, -8.0]); }, y); await p.waitForTimeout(1800);
  await p.screenshot({ path: 'docs/verification/2026-11-05/topiary-top.png' });
  await p.evaluate((y) => window.__dbg.setCam([-6.2, y + 2.0, -3.6], [-7.6, y + 0.6, -9.5]), y); await p.waitForTimeout(1800);
  await p.screenshot({ path: 'docs/verification/2026-11-05/topiary-eye.png' });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

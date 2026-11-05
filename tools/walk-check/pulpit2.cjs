// 아크릴 강대상 확인
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=pa&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload(); await p.waitForTimeout(6500);
  await p.evaluate(() => window.__dbg.goTo('step4')); await p.waitForTimeout(2500);
  const o = (n) => `docs/verification/2026-11-05/pulpit-${n}.png`;
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.setCam([-7.0,-5.2,-11.6],[-9.78,-5.9,-14.33]); }); await p.waitForTimeout(1800); await p.screenshot({ path: o('front') });
  await p.evaluate(() => window.__dbg.setCam([-2.5,-4.6,-3],[-10.5,-3.4,-14])); await p.waitForTimeout(1800); await p.screenshot({ path: o('hall') });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

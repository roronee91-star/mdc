const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=sp'); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload(); await p.waitForTimeout(6500);
  await p.evaluate(() => window.__dbg.goTo('step2')); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.setCam([-2.5,-4.6,-3],[-10.5,-3.4,-14]); }); await p.waitForTimeout(1800); await p.screenshot({ path: 'spk1.png' });
  await p.evaluate(() => window.__dbg.setCam([-6.5,-5.2,-8.5],[-9.5,-2.6,-13])); await p.waitForTimeout(1800); await p.screenshot({ path: 'spk2.png' });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

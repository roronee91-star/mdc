const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1000, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=t2&time=night'); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload(); await p.waitForTimeout(6500);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.character.visible=false; window.__dbg.setCam([8,5,20],[-10,4,-6]); }); await p.waitForTimeout(2000); await p.screenshot({ path: 'rl/5_trees.png' });
  await p.evaluate(() => window.__dbg.setCam([-6,9,-36],[-8,4,-14])); await p.waitForTimeout(1800); await p.screenshot({ path: 'rl/6_back.png' });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

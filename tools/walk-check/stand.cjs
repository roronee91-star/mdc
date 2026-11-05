const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  const pos = () => p.evaluate(() => window.__dbg.character.position.toArray().map(v => +v.toFixed(2)));
  await p.evaluate(() => window.__dbg.goTo('step4')); await p.waitForTimeout(800);
  await p.click('#btnActionPew'); await p.waitForTimeout(1500); console.log('앉음', await pos());
  await p.click('#btnActionPray'); await p.waitForTimeout(1500); console.log('일어섬', await pos());
  await p.screenshot({ path: `${out}/1_stood.png` });
  // 벽 가림: 벽 뒤에서 보도록 카메라를 둠 → 벽이 투명해지는지
  await p.evaluate(() => window.__dbg.goTo('step6')); await p.waitForTimeout(500);
  await p.evaluate(() => { const { character: c } = window.__dbg; c.position.set(-9.6, 3.65, -10.4); window.__dbg.setCam([-6.0, 5.3, -10.0], [-9.6, 4.27, -10.4]); });
  await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/2_wall_fade.png` });
  await p.evaluate(() => window.__dbg.goTo('step7')); await p.waitForTimeout(500);
  await p.evaluate(() => { const { character: c } = window.__dbg; c.position.set(-10.5, 10.75, -13.3); window.__dbg.setCam([-10.5, 13.0, -8.5], [-10.5, 11.37, -13.3]); });
  await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/3_pastor_from_garden.png` });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

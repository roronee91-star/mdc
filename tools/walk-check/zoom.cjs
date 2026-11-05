const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  const dist = () => p.evaluate(() => { const { camera, controls } = window.__dbg; return camera.position.distanceTo(controls.target).toFixed(2); });
  await p.evaluate(() => window.__dbg.goTo('step4')); await p.waitForTimeout(1500);
  console.log('처음 거리', await dist());
  await p.mouse.move(500, 320);
  for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(150); }
  await p.waitForTimeout(1500); console.log('휠로 멀리', await dist()); await p.screenshot({ path: `${out}/1_far.png` });
  for (let i = 0; i < 16; i++) { await p.mouse.wheel(0, -300); await p.waitForTimeout(150); }
  await p.waitForTimeout(1500); console.log('휠로 가까이', await dist()); await p.screenshot({ path: `${out}/2_near.png` });
  await p.evaluate(() => window.__dbg.goTo('step5')); await p.waitForTimeout(1500); console.log('층 이동 후 거리 유지', await dist());
  await p.evaluate(() => window.__dbg.goTo('step4')); await p.waitForTimeout(800);
  await p.click('#btnActionPew'); await p.waitForTimeout(1500);
  await p.evaluate(() => { const { camera, controls, character: c } = window.__dbg; document.getElementById('ui-overlay').style.display = 'none';
    const r = c.rotation.y; controls.target.set(c.position.x, c.position.y + 0.55, c.position.z); camera.position.set(c.position.x + Math.sin(r) * 0.9, c.position.y + 0.6, c.position.z + Math.cos(r) * 0.9); });
  await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/3_pray_eyes.png` });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  await p.evaluate(() => window.__dbg.goTo('step5')); await p.waitForTimeout(800);
  console.log('도착 직후 창:', await p.isVisible('#elevPanel'));
  // 멀리 걸어갔다가 다시 엘리베이터 앞으로 걸어오기
  await p.keyboard.down('KeyS'); await p.waitForTimeout(100); await p.keyboard.up('KeyS');
  await p.evaluate(() => { const c = window.__dbg.character; c.position.set(-4.5, 7.25, -6.0); });
  await p.waitForTimeout(400);
  console.log('멀리 있을 때 창:', await p.isVisible('#elevPanel'));
  const scr = await p.evaluate(() => { const c = window.__dbg.camera; const v = c.position.clone().set(-2.9, 7.25, -3.0).project(c); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
  await p.mouse.click(scr[0], scr[1]);
  for (let i = 0; i < 20; i++) { await p.waitForTimeout(500); if (await p.isVisible('#elevPanel')) break; }
  console.log('걸어서 다가온 뒤 창:', await p.isVisible('#elevPanel'));
  await p.screenshot({ path: `${out}/elev_auto.png` });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

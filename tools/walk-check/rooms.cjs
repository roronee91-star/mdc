const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 640 } });
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; });
  const at = async (n, st, x, y, z, faceX, faceZ) => {
    await p.evaluate((k) => window.__dbg.goTo(k), st); await p.waitForTimeout(300);
    await p.evaluate(([x, y, z, fx, fz]) => { const { character: c, camera, controls } = window.__dbg; c.position.set(x, y, z); const r = Math.atan2(fx - x, fz - z); c.rotation.y = r;
      controls.target.set(x, y + 0.62, z); camera.position.set(x - Math.sin(r) * 1.9, y + 0.96, z - Math.cos(r) * 1.9); }, [x, y, z, faceX, faceZ]);
    await p.waitForTimeout(1800); await p.screenshot({ path: `${out}/${n}.png` });
  };
  await at('1_lobby', 'step3', -2.8, 0, -11.0, -3.75, -14.5);
  await at('2_groupA', 'step6', -8.0, 3.65, -12.0, -11.0, -14.5);
  await at('2_prayer', 'step6', -4.6, 3.65, -8.4, -1.0, -9.5);
  await at('2_office', 'step6', -7.6, 3.65, -3.2, -11.0, -6.5);
  await at('4_pastor', 'step7', -4.8, 10.75, -9.0, -1.5, -13.8);
  await at('4_lounge', 'step7', -6.0, 10.75, -9.0, -7.5, -3.0);
  await b.close();
})();

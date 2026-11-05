const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 640 } });
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; window.__dbg.goTo('step7'); });
  const at = async (n, x, y, z, fx, fz, back, up) => {
    await p.evaluate(([x, y, z, fx, fz, back, up]) => { const { character: c, camera, controls } = window.__dbg; c.visible = true; c.position.set(x, y, z); const r = Math.atan2(fx - x, fz - z); c.rotation.y = r;
      controls.target.set(x, y + 0.62, z); camera.position.set(x - Math.sin(r) * back, y + 0.62 + up, z - Math.cos(r) * back); }, [x, y, z, fx, fz, back, up]);
    await p.waitForTimeout(1800); await p.screenshot({ path: `${out}/${n}.png` });
  };
  await at('1_garden_look_up', -6.5, 10.75, -6.4, -6.5, -11.0, 2.2, 0.2);
  await at('2_pastor', -9.6, 10.75, -12.4, -11.0, -15.6, 1.4, 0.4);
  await at('3_lounge', -4.6, 10.75, -12.2, -6.5, -16.6, 1.6, 0.4);
  await at('4_garden_south', -6.5, 10.75, -9.5, -7.5, -1.0, 1.9, 0.3);
  await p.evaluate(() => { const { camera, controls, character } = window.__dbg; character.visible = false; controls.target.set(-6, 13.5, -8); camera.position.set(10, 24, 18); });
  await p.waitForTimeout(1800); await p.screenshot({ path: `${out}/5_aerial.png` });
  await b.close();
})();

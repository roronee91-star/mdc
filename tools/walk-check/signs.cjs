const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  await p.evaluate(() => document.getElementById('ui-overlay').style.display = 'none');
  const at = async (n, st, x, y, z, fx, fz) => {
    await p.evaluate((k) => window.__dbg.goTo(k), st); await p.waitForTimeout(300);
    await p.evaluate(([x, y, z, fx, fz]) => { const { character: c, camera, controls } = window.__dbg; c.position.set(x, y, z); const r = Math.atan2(fx - x, fz - z); c.rotation.y = r;
      controls.target.set(x, y + 0.62, z); camera.position.set(x - Math.sin(r) * 4.4, y + 2.5, z - Math.cos(r) * 4.4); }, [x, y, z, fx, fz]);
    await p.waitForTimeout(2200); await p.screenshot({ path: `${out}/${n}.png` });
  };
  await at('1_b1', 'step4', -2.0, -6.6, -6.0, -0.9, -11.5);       // 자모실 문 쪽
  await at('2_b1_eng', 'step4', -5.0, -6.6, -4.5, -6.2, -2.0);    // 방송실
  await at('3_f1', 'step1', -2.8, 0, -8.6, -2.8, -10.4);          // 로비 문
  await at('4_f2', 'step6', -6.2, 3.65, -5.5, -6.2, -12.0);       // 복도
  await at('5_f3', 'step5', -4.0, 7.25, -10.0, -2.3, -12.0);      // 소그룹실 문
  await at('6_f4', 'step7', -6.0, 10.75, -8.0, -6.0, -11.5);      // 실내 문들
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

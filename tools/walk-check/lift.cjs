// 좁은 곳·벽에 붙었을 때 카메라가 위로 올라가 캐릭터가 보이는지
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  const place = async (n, st, x, y, z, faceX, faceZ, wait) => {
    await p.evaluate((k) => window.__dbg.goTo(k), st); await p.waitForTimeout(400);
    await p.evaluate(([x, y, z, fx, fz]) => { const { character: c, camera, controls } = window.__dbg; c.position.set(x, y, z); const r = Math.atan2(fx - x, fz - z); c.rotation.y = r;
      controls.target.set(x, y + 0.62, z); camera.position.set(x - Math.sin(r) * 4.4, y + 0.62 + 1.9, z - Math.cos(r) * 4.4); }, [x, y, z, faceX, faceZ]);
    await p.waitForTimeout(wait || 3000);
    const info = await p.evaluate(() => { const { camera, controls } = window.__dbg; return [camera.position.distanceTo(controls.target).toFixed(2), (camera.position.y - controls.target.y).toFixed(2)]; });
    console.log(n, '카메라 거리', info[0], '높이차', info[1]);
    await p.screenshot({ path: `${out}/${n}.png` });
  };
  await place('1_pastor_office', 'step7', -10.5, 10.75, -13.3, -10.5, -16.0);   // 좁은 목양실, 뒤는 유리벽
  await place('2_f3_corner', 'step5', -0.4, 7.25, -2.8, 2.0, -2.8);            // 동쪽 유리 모서리, 뒤는 엘리베이터 쪽
  await place('3_f2_groupA', 'step6', -8.0, 3.65, -12.0, -11.0, -14.5);
  await place('4_b1_desk', 'step4', -6.0, -6.6, -3.3, -6.0, -6.0);             // 방송 데스크 바로 앞, 뒤가 방송실
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

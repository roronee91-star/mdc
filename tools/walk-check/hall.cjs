const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local'); await p.waitForTimeout(6500);
  await p.evaluate(() => window.__dbg.goTo('step6')); await p.waitForTimeout(500);
  const path = (x, z) => p.evaluate(([x, z]) => { const c = window.__dbg.character.position; const pa = window.__dbg.findPath(c.clone(), c.clone().set(x, c.y, z)); if (!pa || !pa.length) return '경로 없음';
    const e = pa[pa.length - 1]; let L = Math.hypot(pa[0].x - c.x, pa[0].z - c.z); for (let i = 1; i < pa.length; i++) L += Math.hypot(pa[i].x - pa[i - 1].x, pa[i].z - pa[i - 1].z);
    return `오차 ${Math.hypot(e.x - x, e.z - z).toFixed(2)} · 걸음 ${L.toFixed(1)}m (직선 ${Math.hypot(x - c.x, z - c.z).toFixed(1)}m)`; }, [x, z]);
  for (const [n, x, z] of [['사무실 문', -6.6, -3.4], ['소예배실 문', -6.6, -9.2], ['게시판 앞', -6.2, -12.0], ['정수기 앞', -6.2, -14.3], ['북쪽 소파 묶음', -2.4, -12.3], ['가운데 묶음', -3.2, -8.6], ['남쪽 묶음', -2.3, -5.2]]) console.log(n, await path(x, z));
  console.log('정수기에 앉을 수 있는 자리로 잘못 잡히는지:', await p.evaluate(() => window.__dbg.seatsHere().filter(s => Math.abs(s.x + 6.8) < 0.3 && Math.abs(s.z + 14.3) < 0.3).length));
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; window.__dbg.character.visible = false; });
  await p.evaluate(() => window.__dbg.setCam([-6.4, 6.2, -2.6], [-3.4, 3.7, -10.8])); await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/hall_s.png` });
  await p.evaluate(() => window.__dbg.setCam([-3.0, 5.6, -11.0], [-6.9, 4.0, -14.3])); await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/cooler.png` });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

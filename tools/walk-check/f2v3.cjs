const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local'); await p.waitForTimeout(6500);
  await p.evaluate(() => window.__dbg.goTo('step6')); await p.waitForTimeout(500);
  for (const [n, x, z] of [['소예배실', -9.6, -10.0], ['사무실 회의탁자', -9.0, -6.0], ['사무실 서쪽 책상', -11.3, -5.0], ['동쪽 홀 북쪽', -2.8, -13.6], ['동쪽 홀 가운데', -2.8, -10.3], ['게시판 앞', -6.2, -12.0]]) {
    const r = await p.evaluate(([x, z]) => { const c = window.__dbg.character.position; const path = window.__dbg.findPath(c.clone(), c.clone().set(x, c.y, z)); if (!path || !path.length) return '경로 없음'; const e = path[path.length - 1]; return '오차 ' + Math.hypot(e.x - x, e.z - z).toFixed(2); }, [x, z]);
    console.log(n, r);
  }
  await p.evaluate(() => document.getElementById('ui-overlay').style.display = 'none');
  const cam = async (n, c, t) => { await p.evaluate(([c, t]) => { window.__dbg.character.visible = false; window.__dbg.setCam(c, t); }, [c, t]); await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/${n}.png` }); };
  await cam('1_office', [-7.6, 5.7, -3.0], [-10.6, 3.8, -6.6]);
  await cam('2_hall', [-6.2, 5.6, -3.6], [-2.0, 3.8, -12.5]);
  await cam('3_board', [-4.6, 5.0, -11.0], [-6.9, 4.9, -12.0]);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

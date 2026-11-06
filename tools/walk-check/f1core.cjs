// 1층 #2 계단실·전실(엘리베이터 로비): 길에서 걸어 들어가 엘리베이터 앞까지, 사진
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=f1&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  await p.evaluate(() => window.__dbg.goTo('stepF1')); await p.waitForTimeout(2500);
  const o = (n) => `docs/verification/2026-11-05/f1core-${n}.png`;
  await p.screenshot({ path: o('arrive') });
  const cam = async (c, t, n) => { await p.evaluate(([c, t]) => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.setCam(c, t); }, [c, t]); await p.waitForTimeout(1800); await p.screenshot({ path: o(n) }); };
  await cam([-1.2, 2.2, -8.8], [-2.2, 1.0, -4.0], 'outside');
  await cam([-2.75, 1.75, -5.3], [-1.0, 0.7, -2.6], 'inside');
  await cam([-8.2, 2.3, -10.5], [-2.6, 0.9, -4.2], 'piloti');
  await cam([-5.5, 2.2, -6.5], [-2.5, 0.6, -14.0], 'back');
  // 길(앞 인도)에서 엘리베이터 부르는 자리까지 길찾기
  const r = await p.evaluate(() => { const c = window.__dbg.character.position; const from = c.clone().set(-6.0, 0, 2.0); const path = window.__dbg.findPath(from, c.clone().set(-0.93, 0, -2.85)); return path ? [path.length, path.map(v => [+v.x.toFixed(1), +v.z.toFixed(1)])] : 'no path'; });
  console.log('인도 → 엘리베이터 앞 길:', JSON.stringify(r));
  const btn = await p.evaluate(() => { const e = document.getElementById('btnElevator'); return !e.hidden && e.dataset.want === '1'; });
  console.log('엘리베이터 앞에서 버튼 보임:', btn);
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

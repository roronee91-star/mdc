const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local'); await p.waitForTimeout(6500);
  const go = (st) => p.evaluate((k) => window.__dbg.goTo(k), st);
  const reach = async (lv, pts) => { for (const [n, x, z] of pts) { const r = await p.evaluate(([x, z]) => { const c = window.__dbg.character.position; const path = window.__dbg.findPath(c.clone(), c.clone().set(x, c.y, z)); if (!path || !path.length) return '경로 없음'; const e = path[path.length - 1]; return '오차 ' + Math.hypot(e.x - x, e.z - z).toFixed(2); }, [x, z]); console.log(lv, n, r); } };
  await go('step6'); await p.waitForTimeout(500);
  await reach('2층', [['소예배실 뒤', -9.6, -9.9], ['소예배실 강단 앞', -9.6, -14.0], ['소그룹실', -9.6, -7.4], ['사무실 창가', -1.4, -12.7], ['사무실 회의탁자', -3.4, -10.2], ['기도실', -2.0, -8.8], ['휴게 홀', -2.4, -5.6]]);
  // 소예배실 의자에 앉기 → 기도
  await p.evaluate(() => { const st = window.__dbg.seatsHere().find((s) => s.kind === 'pew'); window.__dbg.sit(st); });
  for (let i = 0; i < 30; i++) { await p.waitForTimeout(500); if (!(await p.evaluate(() => window.__dbg.moving))) break; }
  console.log('소예배실 의자: 기도 중', await p.evaluate(() => window.__dbg.eyesClosed));
  await go('step7'); await p.waitForTimeout(500);
  await reach('4층', [['아동부 예배실 뒤', -5.7, -12.6], ['아동부 강단 앞', -5.7, -16.0], ['화장실1', -8.55, -15.4], ['화장실2', -2.85, -15.4], ['목양실', -10.5, -13.6]]);
  await p.evaluate(() => document.getElementById('ui-overlay').style.display = 'none');
  const cam = async (n, st, c, t) => { await go(st); await p.waitForTimeout(400); await p.evaluate(([c, t]) => { window.__dbg.character.visible = false; window.__dbg.setCam(c, t); }, [c, t]); await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/${n}.png` }); };
  await cam('1_chapel', 'step6', [-9.6, 5.9, -8.9], [-9.6, 4.0, -14.8]);
  await cam('2_group', 'step6', [-7.6, 5.6, -3.2], [-10.2, 3.8, -6.0]);
  await cam('3_office', 'step6', [-4.8, 5.7, -10.0], [-1.0, 3.9, -13.4]);
  await cam('4_kids', 'step7', [-5.7, 12.8, -11.9], [-5.7, 11.0, -16.6]);
  await p.evaluate(() => { window.__dbg.controls.maxPolarAngle = Math.PI; }); await cam('5_f2_plan', 'step6', [-6.2, 12.5, -8.71], [-6.2, 3.65, -8.7]);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

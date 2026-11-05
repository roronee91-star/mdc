// 의자를 눌러서 그 자리에 가서 앉는지 (장의자: 기도, 식당: 밥먹기) + 기도 손 확인
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6500);
  const scr = (x, y, z) => p.evaluate(([x, y, z]) => { const c = window.__dbg.camera; const v = c.position.clone().set(x, y, z).project(c); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, v.z]; }, [x, y, z]);
  const state = () => p.evaluate(() => { const c = window.__dbg.character; return { pos: c.position.toArray().map(v => +v.toFixed(2)), eyesClosed: window.__dbg.eyesClosed }; });
  const clickSeat = async (n, st, sx, sy, sz, wait) => {
    const [x, y, z] = await scr(sx, sy, sz);
    if (z > 1 || x < 0 || y < 0 || x > 1280 || y > 800) { console.log(n, '화면 밖', x, y); return; }
    await p.mouse.click(x, y); await p.waitForTimeout(wait);
    console.log(n, JSON.stringify(await state())); await p.screenshot({ path: `${out}/${n}.png` });
  };
  await p.evaluate(() => window.__dbg.goTo('step4')); await p.waitForTimeout(1500);
  const seats = await p.evaluate(() => window.__dbg.b1Seats.map(s => [s.x, s.y, s.z]));
  // 화면에 보이는 장의자 하나 골라 누르기 (가운데 쪽 뒤에서 세 번째 줄 근처)
  let pick = null;
  for (const s of seats) { const [x, y, z] = await scr(s[0], s[1] + 0.1, s[2]); if (z < 1 && x > 300 && x < 980 && y > 300 && y < 700) { pick = s; break; } }
  console.log('고른 장의자', pick);
  await clickSeat('1_pew', 'step4', pick[0], pick[1] + 0.1, pick[2], 9000);
  await p.evaluate(() => { const { character: c } = window.__dbg; const r = c.rotation.y; window.__dbg.setCam([c.position.x + Math.sin(r) * 0.8, c.position.y + 0.65, c.position.z + Math.cos(r) * 0.8], [c.position.x, c.position.y + 0.42, c.position.z]); });
  await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/2_pray_hands.png` });
  await p.evaluate(() => window.__dbg.goTo('step5')); await p.waitForTimeout(1500);
  const dine = await p.evaluate(() => { const r = []; window.__dbg.furn.traverse(o => { const st = o.userData.seat; if (st && st.kind === 'dine') r.push([st.x, st.y, st.z]); }); return r; });
  let dp = null;
  for (const s of dine) { const [x, y, z] = await scr(s[0], s[1] + 0.1, s[2]); if (z < 1 && x > 60 && x < 1220 && y > 120 && y < 760) { dp = s; break; } }
  console.log('고른 식당 의자', dp);
  await clickSeat('3_dine', 'step5', dp[0], dp[1] + 0.1, dp[2], 9000);
  console.log('밥먹는 중:', await p.evaluate(() => document.getElementById('btnActionEat') && true));
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  const st = () => p.evaluate(() => { const c = window.__dbg.character.position; return { pos: c.toArray().map(v => +v.toFixed(2)), pray: document.getElementById('btnActionPray').innerText, eyes: window.__dbg.eyesClosed }; });
  const waitStill = async () => { for (let i = 0; i < 25; i++) { await p.waitForTimeout(500); const m = await p.evaluate(() => window.__dbg.moving); if (m === false) break; } await p.waitForTimeout(500); };
  // 본당: 의자 착석(가까운 장의자로 걸어감) → 기도 마치기(그 자리 유지) → 기도(그 자리)
  await p.evaluate(() => window.__dbg.goTo('step4')); await p.waitForTimeout(600);
  await p.click('#btnActionPew'); await waitStill(); const a = await st(); console.log('의자 착석', JSON.stringify(a));
  await p.click('#btnActionPray'); await p.waitForTimeout(500); const b2 = await st(); console.log('기도 마치기', JSON.stringify(b2));
  await p.click('#btnActionPray'); await p.waitForTimeout(500); const c = await st(); console.log('다시 기도', JSON.stringify(c), '자리 그대로:', a.pos.join() === c.pos.join());
  // 3층: 밥먹기 → 소그룹실 (밥먹는 동작 안 이어짐)
  await p.evaluate(() => window.__dbg.goTo('step5')); await p.waitForTimeout(600);
  await p.click('#btnActionEat'); await waitStill(); console.log('밥먹기', JSON.stringify(await st()), await p.evaluate(() => window.__dbg.eating));
  await p.click('#btnActionGroup'); await waitStill(); console.log('소그룹실', JSON.stringify(await st()), '밥먹는 중:', await p.evaluate(() => window.__dbg.eating));
  // 링: 4층 그룹실 의자 눌러 앉은 뒤 링 투명도
  await p.evaluate(() => window.__dbg.goTo('step7')); await p.waitForTimeout(600);
  console.log('링 투명도(앉은 뒤):', await p.evaluate(() => window.__dbg.ringOpacity));
  // 화면들
  await p.evaluate(() => document.getElementById('ui-overlay').style.display = 'none');
  const cam = async (n, c, t) => { await p.evaluate(([c, t]) => { window.__dbg.character.visible = false; window.__dbg.setCam(c, t); }, [c, t]); await p.waitForTimeout(1800); await p.screenshot({ path: `${out}/${n}.png` }); };
  await p.evaluate(() => window.__dbg.goTo('step5')); await p.waitForTimeout(400);
  await cam('1_f3_wc', [-9.5, 9.0, -8.6], [-11.2, 7.3, -10.6]);
  await cam('2_f3_store', [-2.0, 9.2, -15.2], [-1.7, 7.3, -17.0]);
  await p.evaluate(() => window.__dbg.goTo('step7')); await p.waitForTimeout(400);
  await cam('3_f4_wc', [-6.8, 12.4, -14.0], [-8.55, 10.9, -16.4]);
  await p.evaluate(() => window.__dbg.goTo('step4')); await p.waitForTimeout(400);
  await p.evaluate(() => { window.__dbg.character.visible = true; const c = window.__dbg.character; c.position.set(-13.03 + 3.85 / Math.SQRT2, -6.16, -17.58 + 3.85 / Math.SQRT2); c.rotation.y = Math.PI / 4; });
  await p.evaluate(() => { const c = window.__dbg.character.position; window.__dbg.setCam([c.x + 2.6, c.y + 1.4, c.z + 2.6], [c.x, c.y + 0.5, c.z]); }); await p.waitForTimeout(1800); await p.screenshot({ path: `${out}/4_pulpit.png` });
  await p.evaluate(() => window.__dbg.goTo('stepF1')); await p.waitForTimeout(400);
  await cam('5_lobby_sofa', [-3.0, 1.6, -11.5], [-1.0, 0.3, -12.6]);
  await cam('6_f2_office_door', [-6.2, 5.2, -2.6], [-7.6, 3.8, -3.6]);
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

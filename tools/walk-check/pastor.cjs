// 4층 목양실 (구석 작은 홈카페장) 화면 찍기 + 걷기 길 · 앉기 확인 (T=night 이면 밤)
// 사용: node pastor.cjs <저장폴더> [이름앞말] [찍을 장면들: user,top,cafe,close,side]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], pre = process.argv[3] || '';
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=pastor&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  const F4 = 10.75;
  const shot = async (ch, c, t, n) => {
    await p.evaluate((s) => window.__dbg.goTo(s), 'step7'); await p.waitForTimeout(5000);
    await p.evaluate(([ch, t, F4]) => { document.getElementById('ui-overlay').style.display = 'none'; const c = window.__dbg.character;   // ch = null: 캐릭터를 보는 곳에 두고 숨김
      if (ch) { c.position.set(...ch); c.visible = true; } else { c.position.set(t[0], F4, t[2]); c.visible = false; } }, [ch, t, F4]); await p.waitForTimeout(700);
    await p.evaluate(([c, t]) => { window.__dbg.setCam(c, t); window.__lockCam = [c, t];
      window.__dbg.scene.onBeforeRender = (r, sc, cam) => { const L = window.__lockCam; if (!L) return; cam.position.set(...L[0]); cam.lookAt(...L[1]); cam.updateMatrixWorld(); }; }, [c, t]); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/${pre}${n}.png` }); await p.evaluate(() => { window.__lockCam = null; });
  };
  const only = process.argv[4] ? process.argv[4].split(',') : null, want = (n) => !only || only.includes(n);
  if (want('user')) await shot([-10.55, F4, -13.35], [-9.55, F4 + 1.75, -11.85], [-11.6, F4 + 0.7, -15.6], 'user');   // 사용자 사진과 비슷한 자리 (남동쪽에서 북서쪽 구석을 봄)
  if (want('top')) await shot(null, [-9.3, F4 + 2.6, -12.0], [-11.0, F4, -15.4], 'top');
  if (want('cafe')) await shot(null, [-10.35, F4 + 1.2, -15.1], [-12.18, F4 + 0.85, -15.3], 'cafe');
  if (want('close')) await shot(null, [-11.25, F4 + 0.85, -15.05], [-12.18, F4 + 0.62, -15.35], 'close');
  if (want('side')) await shot(null, [-10.75, F4 + 1.15, -13.55], [-12.0, F4 + 0.75, -15.4], 'side');
  const kp = await p.evaluate(() => [[-11.45, -15.3], [-11.0, -15.4], [-10.5, -15.15], [-11.5, -14.0], [-9.6, -16.6]].map(([x, z]) => { const r = window.__dbg.findPath({ x: -10.0, z: -11.0 }, { x, z }); if (!r || !r.length) return 'none'; const e = r[r.length - 1]; return [r.length, +(e.x !== undefined ? e.x : e[0]).toFixed(2), +(e.z !== undefined ? e.z : e[1]).toFixed(2)]; }));
  console.log('목양실 길 (홈카페 앞, 목사님 의자 서쪽, 목사님 의자, 십자가 앞, 북동쪽):', JSON.stringify(kp));
  const st = await p.evaluate(async () => { const all = window.__dbg.seatsHere().filter((s) => s.x > -12.3 && s.x < -9.0 && s.z > -17.4 && s.z < -11.5);
    const ch = all.find((s) => Math.abs(s.x + 10.5) < 0.05 && Math.abs(s.z + 15.15) < 0.1); if (!ch) return [all.length, '목사님 의자 없음'];
    window.__dbg.character.position.set(-10.0, 10.75, -12.2); window.__dbg.sit(ch); await new Promise((r) => setTimeout(r, 12000)); const c = window.__dbg.character.position;
    return [all.length, +Math.hypot(c.x - ch.x, c.z - ch.z).toFixed(2)]; });
  console.log('목양실 자리 수, 목사님 의자에 앉은 뒤 거리:', JSON.stringify(st));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

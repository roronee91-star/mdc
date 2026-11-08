// 2층 사무실 (작은 홈카페장 · 회의 탁자 아래 카페트 · 감성 의자) 화면 찍기 + 걷기 길 · 앉기 확인 (T=night 이면 밤)
// 사용: node office.cjs <저장폴더> [이름앞말] [찍을 장면들: top,door,back,meet,cafe,chair,desk,wall]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], pre = process.argv[3] || '';
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=office&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  const shot = async (step, ch, c, t, n) => {
    await p.evaluate((s) => window.__dbg.goTo(s), step); await p.waitForTimeout(5000);
    await p.evaluate(([ch, t]) => { document.getElementById('ui-overlay').style.display = 'none'; const c = window.__dbg.character;   // ch = null: 캐릭터를 보는 곳에 두고 숨김 (따라오는 카메라가 옮겨지지 않게)
      if (ch) { c.position.set(...ch); c.visible = true; } else { c.position.set(t[0], 3.65, t[2]); c.visible = false; } }, [ch, t]); await p.waitForTimeout(700);
    await p.evaluate(([c, t]) => { window.__dbg.setCam(c, t); window.__lockCam = [c, t];   // 그리기 직전에 카메라를 이 자리에 고정 (따라가는 카메라가 옮기지 않게)
      window.__dbg.scene.onBeforeRender = (r, sc, cam) => { const L = window.__lockCam; if (!L) return; cam.position.set(...L[0]); cam.lookAt(...L[1]); cam.updateMatrixWorld(); }; }, [c, t]); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/${pre}${n}.png` }); await p.evaluate(() => { window.__lockCam = null; });
  };
  const F2 = 3.65, only = process.argv[4] ? process.argv[4].split(',') : null, want = (n) => !only || only.includes(n);
  if (want('top')) await shot('step6', null, [-7.35, F2 + 2.25, -2.85], [-9.35, F2, -6.0], 'top');
  if (want('door')) await shot('step6', [-7.6, F2, -3.4], [-7.25, F2 + 1.5, -3.2], [-10.5, F2 + 0.4, -6.0], 'door');
  if (want('back')) await shot('step6', [-9.0, F2, -6.6], [-10.6, F2 + 2.1, -7.9], [-8.6, F2, -3.8], 'back');
  if (want('meet')) await shot('step6', null, [-7.55, F2 + 1.6, -2.95], [-9.0, F2 + 0.2, -4.8], 'meet');
  if (want('cafe')) await shot('step6', null, [-8.9, F2 + 0.95, -7.0], [-7.04, F2 + 0.7, -7.0], 'cafe');
  if (want('chair')) await shot('step6', null, [-8.0, F2 + 0.9, -6.4], [-8.75, F2 + 0.25, -5.2], 'chair');
  if (want('desk')) await shot('step6', null, [-8.9, F2 + 1.5, -5.6], [-10.65, F2 + 0.4, -7.1], 'desk');
  if (want('wall')) await shot('step6', null, [-10.4, F2 + 1.1, -4.6], [-12.22, F2 + 0.75, -4.6], 'wall');
  const kp = await p.evaluate(() => [[-8.7, -5.6], [-10.6, -4.3], [-7.6, -6.9], [-9.6, -3.0], [-11.0, -5.7]].map(([x, z]) => { const r = window.__dbg.findPath({ x: -7.6, z: -3.4 }, { x, z }); if (!r || !r.length) return 'none'; const e = r[r.length - 1]; return [r.length, +(e.x !== undefined ? e.x : e[0]).toFixed(2), +(e.z !== undefined ? e.z : e[1]).toFixed(2)]; }));
  console.log('사무실 길 (탁자 북쪽, 탁자 서쪽, 홈카페 앞, 탁자 남쪽, 책상 남쪽 줄 뒤):', JSON.stringify(kp));
  const seats = await p.evaluate(() => window.__dbg.seatsHere().filter((s) => s.x > -10.5 && s.x < -8.8 && s.z > -5.2 && s.z < -3.4).map((s) => [+s.x.toFixed(2), +s.z.toFixed(2), s.kind]));
  console.log('회의 의자:', JSON.stringify(seats));
  const desk = await p.evaluate(async () => { const all = window.__dbg.seatsHere().filter((s) => s.x < -9.4 && s.z < -5.9 && s.z > -8.3); const out = [];
    for (const z of [-8.05, -6.15]) { const st = all.find((s) => Math.abs(s.z - z) < 0.05 && Math.abs(s.x + 9.9) < 0.05); if (!st) { out.push('없음'); continue; }
      window.__dbg.character.position.set(-9.0, 3.65, -3.0); window.__dbg.sit(st); await new Promise((r) => setTimeout(r, 12000)); const c = window.__dbg.character.position; out.push([z, +Math.hypot(c.x - st.x, c.z - st.z).toFixed(2)]); }
    return [all.length, out]; });
  console.log('책상 의자 수, 앉은 뒤 거리(북쪽 줄, 남쪽 줄):', JSON.stringify(desk));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

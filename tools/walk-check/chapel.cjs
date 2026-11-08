// 2층 소예배실 개인 의자 (원목 틀 + 초록 가죽) 화면 찍기 + 앉기 확인
// 사용: node chapel.cjs <저장폴더> [이름앞말] [찍을 장면들: rows,front,close,side]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], pre = process.argv[3] || '';
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=chapel&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  const shot = async (c, t, look, n) => {
    await p.evaluate(() => window.__dbg.goTo('step6')); await p.waitForTimeout(5000);
    await p.evaluate(([c, t, look]) => { document.getElementById('ui-overlay').style.display = 'none'; const ch = window.__dbg.character; ch.position.set(look[0], 3.65, look[1]); ch.visible = false;
      window.__dbg.setCam(c, t); window.__lockCam = [c, t];   // 그리기 직전에 카메라를 이 자리에 고정
      window.__dbg.scene.onBeforeRender = (r, sc, cam) => { const L = window.__lockCam; if (!L) return; cam.position.set(...L[0]); cam.lookAt(...L[1]); cam.updateMatrixWorld(); }; }, [c, t, look]);
    await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/${pre}${n}.png` }); await p.evaluate(() => { window.__lockCam = null; window.__dbg.character.visible = true; });
  };
  const F2 = 3.65, only = process.argv[4] ? process.argv[4].split(',') : null, want = (n) => !only || only.includes(n);
  if (want('rows')) await shot([-7.25, F2 + 1.55, -14.7], [-9.7, F2 + 0.1, -11.4], [-9.63, -11.0], 'rows');
  if (want('front')) await shot([-9.63, F2 + 1.0, -14.3], [-9.63, F2 + 0.25, -11.0], [-9.63, -11.0], 'front');
  if (want('close')) await shot([-7.35, F2 + 0.55, -14.05], [-7.85, F2 + 0.3, -13.35], [-9.63, -11.0], 'close');
  if (want('side')) await shot([-9.35, F2 + 0.6, -13.25], [-8.6, F2 + 0.28, -13.45], [-9.63, -11.0], 'side');
  const r = await p.evaluate(async () => { const all = window.__dbg.seatsHere().filter((s) => s.kind === 'pew' && s.x < -7 && s.z < -10 && s.z > -14); const st = all.find((s) => Math.abs(s.x + 8.2) < 0.05 && Math.abs(s.z + 11.9) < 0.05);
    window.__dbg.character.position.set(-9.63, 3.65, -9.6); window.__dbg.sit(st); await new Promise((res) => setTimeout(res, 12000)); const c = window.__dbg.character.position; return [all.length, +Math.hypot(c.x - st.x, c.z - st.z).toFixed(2), window.__dbg.eyesClosed]; });
  console.log('소예배실 의자 수, 앉은 뒤 거리, 기도(눈 감음):', JSON.stringify(r));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

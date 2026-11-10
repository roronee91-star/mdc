// 4층 옥상 정원 (잔디 · 디딤돌 · 나무) 화면 찍기. 사용: [PAGE=..] node garden.cjs <그림 폴더> [앞말]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], pre = process.argv[3] || '';
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto('http://127.0.0.1:8008/' + (process.env.PAGE || 'index.html') + '?net=local&room=garden&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  await p.evaluate(() => window.__dbg.goTo('step7')); await p.waitForTimeout(5000);
  const F4 = 10.75;
  const shot = async (ch, c, t, n) => {
    await p.evaluate(([ch, t, F4]) => { document.getElementById('ui-overlay').style.display = 'none'; const c = window.__dbg.character; if (ch) { c.position.set(...ch); c.visible = true; } else { c.position.set(t[0], F4, t[2]); c.visible = false; } }, [ch, t, F4]); await p.waitForTimeout(700);
    await p.evaluate(([c, t]) => { window.__dbg.setCam(c, t); window.__lockCam = [c, t];
      window.__dbg.scene.onBeforeRender = (r, sc, cam) => { const L = window.__lockCam; if (!L) return; cam.position.set(...L[0]); cam.lookAt(...L[1]); cam.updateMatrixWorld(); }; }, [c, t]); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/${pre}${n}.png`, timeout: 120000 }); await p.evaluate(() => { window.__lockCam = null; });
  };
  await shot([-5.2, F4, -8.0], [-2.6, F4 + 1.7, -5.6], [-6.2, F4 + 0.2, -8.8], 'garden-path');     // 디딤돌 길과 캐릭터
  await shot(null, [-4.9, F4 + 0.75, -7.4], [-6.6, F4 + 0.0, -8.7], 'garden-close');                 // 돌과 풀 가까이
  await shot(null, [-3.2, F4 + 2.3, -6.3], [-8.0, F4 + 0.1, -9.2], 'garden-wide');                   // 정원 전체
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

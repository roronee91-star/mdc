// 지하 자모실(창 높이·아기 장난감장·아기 침대) · 3층 배식대 화면 찍기
// 사용: node jamo.cjs <저장폴더> [이름앞말]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], pre = process.argv[3] || '';
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=jm&time=day', { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  const shot = async (step, ch, c, t, n) => {
    await p.evaluate((s) => window.__dbg.goTo(s), step); await p.waitForTimeout(5000);
    await p.evaluate((ch) => { document.getElementById('ui-overlay').style.display = 'none'; if (ch) window.__dbg.character.position.set(...ch); }, ch); await p.waitForTimeout(700);
    await p.evaluate(([c, t]) => window.__dbg.setCam(c, t), [c, t]); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/${pre}${n}.png` });
  };
  const B1 = -6.6, F3 = 7.25;
  await shot('step4', [-1.9, B1, -13.6], [-3.4, B1 + 1.5, -13.4], [0.0, B1 + 0.4, -13.6], 'jamo-hall');
  await shot('step4', [-0.2, B1, -13.0], [1.6, B1 + 1.6, -13.2], [-1.5, B1 + 0.5, -13.6], 'jamo-east');
  await shot('step4', [-1.6, B1, -12.4], [-2.6, B1 + 1.1, -14.6], [-0.2, B1 + 0.5, -12.8], 'jamo-low');
  await shot('step4', [-0.2, B1, -13.2], [-0.1, B1 + 1.3, -12.2], [-0.15, B1 + 0.2, -15.9], 'jamo-north');
  await shot('step5', [-7.6, F3, -14.8], [-6.7, F3 + 1.6, -14.0], [-8.45, F3 + 0.55, -14.9], 'serve');
  await shot('step5', [-7.6, F3, -14.8], [-7.6, F3 + 1.0, -13.0], [-8.45, F3 + 0.5, -15.2], 'serve-side');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

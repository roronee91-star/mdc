// 두 판(예: 바꾸기 전 _old.html · 지금 index.html)을 장소마다 같은 자리에서 찍어 비교용 그림 저장. 사용: [T=night] node cmpview.cjs <폴더> <페이지> <이름>
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], page = process.argv[3], tag = process.argv[4], steps = (process.argv[5] || 'step1,step2,step3,stepF1,step4,step5,step6,step7').split(',');
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 420, height: 800 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1'); });
  await p.goto(`http://127.0.0.1:8008/${page}?net=local&room=cmp&time=` + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  for (const st of steps) {
    await p.evaluate((s) => window.__dbg.goTo(s), st); await p.waitForTimeout(4500);
    await p.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; window.__dbg.character.visible = false; });
    await p.waitForTimeout(800); await p.screenshot({ path: `${out}/${tag}-${st}.png` });
    await p.evaluate(() => { window.__dbg.character.visible = true; });
  }
  console.log(tag, errs.join('\n') || 'no errors'); await b.close();
})();

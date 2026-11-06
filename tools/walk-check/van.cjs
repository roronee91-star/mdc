// 1층 주차장 승합차 3대 + 식당 복도·주방 앞 나무 치운 모습
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=vn&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  const shot = async (st, ch, cam, look, f) => {
    await p.evaluate((st) => window.__dbg.goTo(st), st); await p.waitForTimeout(5000);
    await p.evaluate((ch) => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.character.position.set(...ch); }, ch); await p.waitForTimeout(600);
    await p.evaluate(([cam, look]) => window.__dbg.setCam(cam, look), [cam, look]); await p.waitForTimeout(2200);
    await p.screenshot({ path: 'docs/verification/2026-11-05/' + f });
  };
  await shot('step2', [-6.4, 0, -3.8], [-5.6, 2.2, -2.4], [-7.6, 0.5, -7.4], 'van-park.png');
  await shot('step2', [-7.6, 0, -4.4], [-12.0, 1.6, -3.6], [-9.2, 0.6, -7.6], 'van-side.png');
  await shot('step5', [-5.4, 7.25, -5.2], [-5.0, 7.25 + 2.4, -3.2], [-7.0, 7.25 + 0.6, -12.0], 'dine-notree.png');
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

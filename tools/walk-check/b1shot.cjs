const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  await p.click('#step4'); await p.waitForTimeout(1500); await p.screenshot({ path: out + '/b1_over.png' });
  await p.click('#btnActionPew'); await p.waitForTimeout(2000); await p.screenshot({ path: out + '/b1_pew.png' });
  // 회중석 가운데 뒤쪽, 사람 눈높이 비율로 무대를 바라봄
  await p.evaluate(() => { const {camera,controls}=window.__dbg; controls.target.set(-11.6,-4.6,-15.6); camera.position.set(-4.0,-5.2,-6.5); controls.update(); });
  await p.waitForTimeout(1200); await p.screenshot({ path: out + '/b1_eye.png' });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

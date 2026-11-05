// 분위기 확인: 본당 벽(원목·석재), 식당(카페 자리·화분·간접 조명), 2층 바닥. node mood.cjs [day|night]
const { chromium } = require('playwright');
const T = process.argv[2] || 'day';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:8008/index.html?net=local&room=md&time=${T}`, { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  const o = (n) => `docs/verification/2026-11-05/mood-${T}-${n}.png`;
  const shot = async (step, cam, tgt, n) => { await p.evaluate((s) => window.__dbg.goTo(s), step); await p.waitForTimeout(2200);
    await p.evaluate(([c, t]) => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.setCam(c, t); }, [cam, tgt]); await p.waitForTimeout(1800); await p.screenshot({ path: o(n) }); };
  await shot('step4', [-2.5,-4.6,-3], [-10.5,-3.4,-14], 'b1-front');
  await shot('step4', [-10.5,-4.4,-13.0], [0,-4.6,-2], 'b1-back');
  await shot('step5', [-3.2,8.75,-1.2], [-9.2,7.5,-6.2], 'f3-cafe');
  await shot('step5', [-1.2,8.6,-4.0], [-6.5,7.6,-12.5], 'f3-hall');
  await shot('step5', [-6.4,8.55,-11.2], [-8.6,7.8,-14.6], 'f3-counter');
  await p.evaluate(() => window.__dbg.goTo('step6')); await p.waitForTimeout(2200);
  await p.evaluate(() => { window.__dbg.setCam([-2.6, 5.1, -1.6], [-7.5, 3.65, -9.5]); }); await p.waitForTimeout(1800); await p.screenshot({ path: o('f2-floor') });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

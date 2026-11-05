// 식당 소품과 기도 빛 확인: node tools/walk-check/dine.cjs <접두어>
const { chromium } = require('playwright');
const pre = process.argv[2] || 'dine';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=dn&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload(); await p.waitForTimeout(6500);
  const out = (n) => `docs/verification/2026-11-05/${pre}-${n}.png`;
  await p.evaluate(() => window.__dbg.goTo('step5')); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display='none'; window.__dbg.setCam([-3.0,9.2,-9.0],[-5.6,7.6,-12.6]); }); await p.waitForTimeout(1500); await p.screenshot({ path: out('room') });
  await p.evaluate(() => window.__dbg.setCam([-4.75,8.05,-11.75],[-5.4,7.62,-12.6])); await p.waitForTimeout(1500); await p.screenshot({ path: out('table') });
  await p.evaluate(() => window.__dbg.setCam([-7.4,8.35,-13.9],[-8.45,7.8,-14.7])); await p.waitForTimeout(1500); await p.screenshot({ path: out('counter') });
  // 기도 빛: 본당 장의자에 앉아 기도
  await p.evaluate(() => window.__dbg.goTo('step4')); await p.waitForTimeout(2500);
  await p.evaluate(() => { const s = window.__dbg.b1Seats; window.__dbg.sit(s[Math.floor(s.length/2)] || window.__dbg.seatsHere()[0]); }); await p.waitForTimeout(6000);
  await p.evaluate(() => { const c = window.__dbg.character.position; window.__dbg.setCam([c.x+1.6,c.y+0.9,c.z-1.4],[c.x,c.y+0.7,c.z]); }); await p.waitForTimeout(2500); await p.screenshot({ path: out('pray') });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

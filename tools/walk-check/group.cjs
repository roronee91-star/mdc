// 3층 소그룹실 의자·식탁·꾸밈 확인
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 900, height: 640 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=gr&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  await p.evaluate(() => window.__dbg.goTo('step5')); await p.waitForTimeout(2500);
  const o = (n) => `docs/verification/2026-11-05/group-${n}.png`;
  // 방 안으로 들어가서 찍음 (캐릭터를 방 안에 둬야 벽이 투명해지지 않음)
  await p.evaluate(() => { document.getElementById('ui-overlay').style.display='none'; });
  await p.waitForTimeout(800);
  await p.evaluate(() => window.__dbg.setCam([-2.05,8.75,-12.85],[-1.0,7.55,-14.3])); await p.waitForTimeout(1800); await p.screenshot({ path: o('room') });
  await p.evaluate(() => window.__dbg.setCam([-0.45,8.05,-13.2],[-1.2,7.55,-13.95])); await p.waitForTimeout(1800); await p.screenshot({ path: o('chair') });
  // 의자에 앉기
  const r = await p.evaluate(async () => { const s = window.__dbg.seatsHere().filter(x => x.kind === 'chair' && x.z < -12.73 && x.z > -15.1); window.__dbg.sit(s[0]); await new Promise(r => setTimeout(r, 8000)); const c = window.__dbg.character.position; return [s.length, +Math.hypot(c.x - s[0].x, c.z - s[0].z).toFixed(2)]; });
  console.log('소그룹실1 의자 수, 앉은 뒤 거리:', JSON.stringify(r));
  await p.evaluate(() => { const c = window.__dbg.character.position; window.__dbg.setCam([c.x + 0.9, c.y + 0.9, c.z + 0.9], [c.x, c.y + 0.4, c.z]); }); await p.waitForTimeout(1800); await p.screenshot({ path: o('sit') });
  await p.evaluate(() => { const c = window.__dbg.character.position; window.__dbg.setCam([c.x - 0.5, c.y + 1.25, c.z + 1.0], [c.x + 0.45, c.y + 0.2, c.z - 0.3]); }); await p.waitForTimeout(1800); await p.screenshot({ path: o('room') });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

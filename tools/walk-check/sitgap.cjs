// 앉았을 때 몸이 식탁을 뚫지 않는지: 4층 그룹실·3층 소그룹실 의자에 앉아 옆뒤에서 찍음
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 460, height: 800 } })).newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html?net=local&room=sg&time=day', { waitUntil:'domcontentloaded', timeout:120000 }); await p.evaluate(() => { localStorage.setItem('mdc_name','혜연'); localStorage.setItem('mdc_gender','f'); }); await p.reload({ waitUntil:'domcontentloaded' }); await p.waitForTimeout(7000);
  const run = async (step, f, n) => {
    await p.evaluate((s) => window.__dbg.goTo(s), step); await p.waitForTimeout(2200);
    const r = await p.evaluate(async (fs) => { const st = window.__dbg.seatsHere().find(new Function('s', 'return ' + fs)); window.__dbg.sit(st); await new Promise(r => setTimeout(r, 20000)); const c = window.__dbg.character.position; return +Math.hypot(c.x - st.x, c.z - st.z).toFixed(2); }, f);
    await p.evaluate(() => { document.getElementById('ui-overlay').style.display='none'; const g = window.__dbg.character, c = g.position, a = g.rotation.y;
      window.__dbg.setCam([c.x - Math.sin(a) * 0.25 + Math.cos(a) * 1.0, c.y + 0.75, c.z - Math.cos(a) * 0.25 - Math.sin(a) * 1.0], [c.x + Math.sin(a) * 0.2, c.y + 0.35, c.z + Math.cos(a) * 0.2]); });
    await p.waitForTimeout(1800); await p.screenshot({ path: `docs/verification/2026-11-05/sitgap-${n}.png` }); return r;
  };
  console.log('4층 그룹실 앉은 뒤 거리:', await run('step7', "s.x > -1.9 && s.x < -1.5 && s.z > -13.5 && s.z < -12.5", 'f4'));
  console.log('3층 소그룹실 앉은 뒤 거리:', await run('step5', "s.kind === 'chair' && s.x > -1.7 && s.x < -1.3 && s.z < -12.73 && s.z > -15.1", 'f3'));
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6500);
  const st = () => p.evaluate(() => ({ pos: window.__dbg.character.position.toArray().map(v => +v.toFixed(2)), area: document.getElementById('currentAreaText').innerText,
    btns: ['btnElevator','btnActionPew','btnActionPray','btnActionEat','btnActionGroup'].filter(id => !document.getElementById(id).hidden) }));
  console.log('start', JSON.stringify(await st()));
  await p.click('#step4');                                   // 엘리베이터까지 걸어가서 지하로
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(1000); const s = await st(); if (s.area.includes('지하')) break; }
  await p.waitForTimeout(1500);
  console.log('after B1 button', JSON.stringify(await st())); await p.screenshot({ path: `${out}/1_b1_arrive.png` });
  await p.click('#btnElevator'); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/2_panel.png` });
  await p.click('.elev-btn[data-lv="F3"]'); await p.waitForTimeout(2500);
  console.log('after panel 3F', JSON.stringify(await st())); await p.screenshot({ path: `${out}/3_f3_arrive.png` });
  await p.click('#btnActionEat'); await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/4_eat.png` });
  await p.click('#zoomToggle'); await p.waitForTimeout(500);
  await p.evaluate(() => { const { camera, controls, character: c } = window.__dbg; controls.target.set(c.position.x, c.position.y + 0.35, c.position.z); camera.position.set(c.position.x + 0.2, c.position.y + 0.55, c.position.z + 1.1); });
  await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/5_eat_side.png` });
  await p.click('#step6'); for (let i = 0; i < 30; i++) { await p.waitForTimeout(1000); const s = await st(); if (s.area.includes('2층')) break; }
  await p.waitForTimeout(1200); console.log('after 2F button', JSON.stringify(await st()));
  await p.click('#step7'); for (let i = 0; i < 30; i++) { await p.waitForTimeout(1000); const s = await st(); if (s.area.includes('4층')) break; }
  await p.waitForTimeout(1200); console.log('after 4F button', JSON.stringify(await st())); await p.screenshot({ path: `${out}/6_f4_arrive.png` });
  await p.click('#step4'); for (let i = 0; i < 30; i++) { await p.waitForTimeout(1000); const s = await st(); if (s.area.includes('지하')) break; }
  await p.waitForTimeout(1200); await p.click('#btnActionPew'); await p.waitForTimeout(2000);
  await p.evaluate(() => { const { camera, controls, character: c } = window.__dbg; controls.target.set(c.position.x, c.position.y + 0.35, c.position.z); const r = c.rotation.y; camera.position.set(c.position.x + Math.cos(r) * 1.2, c.position.y + 0.6, c.position.z - Math.sin(r) * 1.2); });
  await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/7_pew_side.png` });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  const errs = [];
  const A = await ctx.newPage(); A.on('pageerror', (e) => errs.push('A: ' + e.message));
  await A.goto('http://127.0.0.1:8008/index.html?net=local&room=g'); await A.waitForTimeout(6500);
  console.log('첫 방문 창:', await A.isVisible('#nameModal'));
  await A.fill('#nameInput', '혜연'); await A.click('#nameOk'); await A.waitForTimeout(200);
  console.log('성별 안 고르고 들어가기:', await A.textContent('#nameWarn'), '/ 창 그대로:', await A.isVisible('#nameModal'));
  await A.click('.gender-btn[data-g="f"]'); await A.waitForTimeout(300); await A.screenshot({ path: `${out}/1_modal.png` });
  await A.click('#nameOk'); await A.waitForTimeout(500);
  console.log('A 성별:', await A.evaluate(() => [localStorage.getItem('mdc_gender'), window.__dbg.character.getObjectByName('hairF').visible, window.__dbg.character.getObjectByName('skirt').visible]));
  // B: 남자 (다른 기기 흉내)
  const B = await ctx.newPage(); B.on('pageerror', (e) => errs.push('B: ' + e.message));
  await B.goto('http://127.0.0.1:8008/index.html?net=local&room=g');
  await B.evaluate(() => { localStorage.setItem('mdc_name', '은혜'); localStorage.setItem('mdc_gender', 'm'); localStorage.setItem('mdc_device', JSON.stringify('gB')); }); await B.reload(); await B.waitForTimeout(6500);
  console.log('다시 방문(이름·성별 있음) 창:', await B.isVisible('#nameModal'));
  for (const p of [A, B]) await p.evaluate(() => window.__dbg.goTo('step4'));
  await B.evaluate(() => { const c = window.__dbg.character; c.position.set(-2.0, -6.6, -4.6); c.rotation.y = Math.PI * 0.75; });
  await A.evaluate(() => { const c = window.__dbg.character; c.position.set(-2.8, -6.6, -4.6); c.rotation.y = Math.PI * 0.6; });
  await A.waitForTimeout(3000);
  console.log('A에서 본 B 성별:', await A.evaluate(() => { const r = [...window.__remotes.values()][0]; return r && [r.group.userData.gender, r.group.getObjectByName('hairF').visible]; }));
  await A.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; window.__dbg.setCam([-2.4, -5.6, -2.6], [-2.4, -6.05, -4.6]); }); await A.waitForTimeout(2000); await A.screenshot({ path: `${out}/2_pair.png` });
  await A.evaluate(() => { const c = window.__dbg.character.position; window.__dbg.setCam([c.x + 0.55, c.y + 0.75, c.z + 0.55], [c.x, c.y + 0.62, c.z]); }); await A.waitForTimeout(1800); await A.screenshot({ path: `${out}/3_face.png` });
  // 4층 엘리베이터
  await A.evaluate(() => { window.__dbg.goTo('step7'); window.__dbg.character.visible = false; }); await A.waitForTimeout(500);
  await A.evaluate(() => window.__dbg.setCam([-2.0, 12.3, -6.6], [-0.93, 11.8, -2.4])); await A.waitForTimeout(1800); await A.screenshot({ path: `${out}/4_f4_elev.png` });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

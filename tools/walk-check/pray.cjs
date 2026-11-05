const { chromium, devices } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs = [];
  // 1) 기도 빛 (본당 장의자, 내 캐릭터 + 다른 성도)
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  const open = async (name, dev) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    await p.goto('http://127.0.0.1:8008/index.html?net=local&room=pray'); await p.evaluate(([n, d]) => { localStorage.setItem('mdc_name', n); localStorage.setItem('mdc_device', JSON.stringify(d)); }, [name, dev]); await p.reload(); await p.waitForTimeout(6500); return p; };
  const A = await open('혜연', 'pA'), B = await open('은혜', 'pB');
  for (const p of [A, B]) await p.evaluate(() => window.__dbg.goTo('step4'));
  await B.evaluate(() => { const s = window.__dbg.b1Seats; const st = s.find(x => Math.abs(x.x + 3.2) < 0.4 && Math.abs(x.z + 7.0) < 0.6) || s[30]; window.__dbg.sit(st); });
  await A.evaluate(() => { const s = window.__dbg.b1Seats; const st = s.find(x => Math.abs(x.x + 2.0) < 0.4 && Math.abs(x.z + 6.4) < 0.6) || s[20]; window.__dbg.sit(st); });
  await A.waitForTimeout(6000);
  await A.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; const c = window.__dbg.character.position; window.__dbg.setCam([c.x + 2.6, c.y + 1.6, c.z + 2.4], [c.x - 0.6, c.y + 0.6, c.z - 0.6]); });
  await A.waitForTimeout(2500); await A.screenshot({ path: `${out}/pray_light.png` });
  console.log('A 기도 중:', await A.evaluate(() => window.__dbg.eyesClosed), '/ B 빛 보임:', await A.evaluate(() => { const r = [...window.__remotes.values()][0]; return r && r.light && r.light.visible; }));
  await ctx.close();
  // 2) 휴대폰: 대화창 누른 뒤 화면 확대·밀림 없는지
  const m = await b.newContext({ ...devices['Pixel 7'] }); await m.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await m.newPage(); p.on('pageerror', (e) => errs.push('mobile: ' + e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(7000);
  await p.tap('#chatOpen'); await p.waitForTimeout(500); await p.tap('#chatInput'); await p.keyboard.type('안녕하세요'); await p.waitForTimeout(400);
  const vv = await p.evaluate(() => ({ scale: visualViewport.scale, sx: scrollX, sy: scrollY, bar: getComputedStyle(document.getElementById('chatBar')).bottom, r: Math.round(document.getElementById('chatBar').getBoundingClientRect().right), l: Math.round(document.getElementById('chatBar').getBoundingClientRect().left), iw: innerWidth }));
  console.log('휴대폰 입력 중:', JSON.stringify(vv));
  await p.screenshot({ path: `${out}/mobile_typing.png` });
  await p.tap('#chatSend'); await p.waitForTimeout(300); await p.tap('#chatClose'); await p.waitForTimeout(500);
  console.log('닫은 뒤:', JSON.stringify(await p.evaluate(() => ({ scale: visualViewport.scale, sx: scrollX, sy: scrollY, headerTop: document.querySelector('.header-bar').getBoundingClientRect().top }))));
  await p.screenshot({ path: `${out}/mobile_after_chat.png` });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

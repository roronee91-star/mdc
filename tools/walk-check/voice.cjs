// 가짜 마이크(삐 소리)로 두 창 사이 음성 메시지 보내기·받기·재생 확인 (?net=local)
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 600 }, permissions: ['microphone'] });
  const errs = [];
  const open = async (name, dev) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    await p.goto('http://127.0.0.1:8008/index.html?net=local&room=voice'); await p.evaluate(([n, d]) => { localStorage.setItem('mdc_name', n); localStorage.setItem('mdc_device', JSON.stringify(d)); }, [name, dev]); await p.reload(); await p.waitForTimeout(6500); return p; };
  const A = await open('혜연', 'vA'), B = await open('은혜', 'vB');
  for (const p of [A, B]) { await p.evaluate(() => window.__dbg.goTo('step6')); await p.mouse.click(450, 300); }
  await B.evaluate(() => { const c = window.__dbg.character; c.position.set(-3.0, 3.65, -10.0); });
  await A.waitForTimeout(3000);
  // A: 버튼을 3초 동안 누르고 있다가 뗌
  const box = await A.locator('#voiceBtn').boundingBox();
  await A.mouse.move(box.x + 24, box.y + 24); await A.mouse.down(); await A.waitForTimeout(400);
  console.log('녹음 중 표시:', await A.isVisible('#voiceRec'));
  await A.waitForTimeout(2800); await A.screenshot({ path: `${out}/recording.png` }); await A.mouse.up(); await A.waitForTimeout(400);
  console.log('A 보낸 길이(초):', await A.evaluate(() => window.__voice.lastSent && window.__voice.lastSent.dur), '바이트:', await A.evaluate(() => window.__voice.lastSent && window.__voice.lastSent.pcm.length));
  // B: 받아서 재생?
  let played = 0; for (let i = 0; i < 20 && !played; i++) { await B.waitForTimeout(300); played = await B.evaluate(() => window.__voice.playing || 0); }
  console.log('B 재생 중:', played > 0, '/ B 대화 기록:', await B.textContent('#chatLog'));
  // 소리가 비어 있지 않은지: A가 보낸 소리의 크기(평균 진폭)
  console.log('녹음 소리 크기(0~1):', await A.evaluate(() => { const p = window.__voice.lastSent.pcm; let s = 0; for (let i = 0; i < p.length; i++) { const m = p[i] / 127.5 - 1; s += Math.abs(m); } return (s / p.length).toFixed(3); }));
  // 다른 층이면 재생 안 함
  await B.evaluate(() => window.__dbg.goTo('step5')); await B.waitForTimeout(800);
  const pc0 = await B.evaluate(() => window.__voice.playCount || 0);
  await A.mouse.down(); await A.waitForTimeout(1500); await A.mouse.up(); await B.waitForTimeout(2500);
  console.log('B가 3층일 때 새로 재생:', (await B.evaluate(() => window.__voice.playCount || 0)) > pc0, '/ 기록:', await B.textContent('#chatLog'));
  await B.evaluate(() => window.__dbg.goTo('step6')); await B.waitForTimeout(400);
  await B.evaluate(() => { document.getElementById('ui-overlay').style.display = 'none'; window.__dbg.setCam([-6.4, 5.4, -10.0], [-3.0, 3.9, -12.6]); }); await B.waitForTimeout(1500); await B.screenshot({ path: `${out}/f2_hall.png` });
  await B.evaluate(() => window.__dbg.goTo('stepF1')); await B.waitForTimeout(500);
  await B.evaluate(() => { window.__dbg.character.visible = false; window.__dbg.setCam([-3.6, 1.7, -10.8], [-2.4, 0.3, -13.6]); }); await B.waitForTimeout(1500); await B.screenshot({ path: `${out}/f1_lobby.png` });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

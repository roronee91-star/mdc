// 걷기 충돌·키보드 이동·카메라 확인
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6500);
  const pos = () => p.evaluate(() => window.__dbg.character.position.toArray().map(v => +v.toFixed(2)));
  const hold = async (k, ms) => { await p.keyboard.down(k); await p.waitForTimeout(ms); await p.keyboard.up(k); await p.waitForTimeout(300); };
  await p.click('#step4'); await p.waitForTimeout(800);
  console.log('B1 start', await pos());
  await hold('KeyW', 2500); console.log('B1 after W 2.5s (pews ahead should stop it)', await pos());
  await p.screenshot({ path: out + '/b1_w.png' });
  await hold('KeyA', 2500); await p.waitForTimeout(2000); console.log('after A', await pos()); await p.screenshot({ path: out + '/b1_a.png' });
  await hold('KeyS', 4000); await p.waitForTimeout(2000); console.log('after S', await pos()); await p.screenshot({ path: out + '/b1_s.png' });
  await p.click('#step5'); await p.waitForTimeout(800); console.log('3F start', await pos());
  await hold('ArrowRight', 5000); await p.waitForTimeout(2000); console.log('3F after Right', await pos()); await p.screenshot({ path: out + '/f3_r.png' });
  await hold('ArrowUp', 6000); await p.waitForTimeout(2000); console.log('3F after Up', await pos()); await p.screenshot({ path: out + '/f3_u.png' });
  // 드래그로 카메라 한 바퀴 돌리며 확인
  await p.click('#step4'); await p.waitForTimeout(800);
  for (let i = 0; i < 4; i++) { await p.mouse.move(640, 400); await p.mouse.down(); await p.mouse.move(640 + 300, 400, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(700); await p.screenshot({ path: `${out}/rot_${i}.png` }); }
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

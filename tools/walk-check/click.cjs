// 바닥 누르기 길찾기 확인: 월드 좌표를 화면 좌표로 바꿔 클릭하고, 도착 위치를 기록
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6500);
  const pos = () => p.evaluate(() => window.__dbg.character.position.toArray().map(v => +v.toFixed(2)));
  const scr = (x, y, z) => p.evaluate(([x, y, z]) => { const c = window.__dbg.camera; const v = c.position.clone().set(x, y, z).project(c); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, v.z]; }, [x, y, z]);
  const walkTo = async (name, x, y, z, wait) => {
    const [sx, sy, sz] = await scr(x, y, z);
    if (sz > 1 || sx < 0 || sy < 0 || sx > 1280 || sy > 800) { console.log(name, 'off-screen', sx, sy); return; }
    await p.mouse.click(sx, sy); await p.waitForTimeout(wait);
    console.log(name, 'goal', [x, z], '→ at', await pos());
    await p.screenshot({ path: `${out}/${name}.png` });
  };
  await p.click('#step4'); await p.waitForTimeout(1000);
  await walkTo('b1_front', -8.0, -6.6, -12.0, 9000);     // 의자 사이를 지나 앞쪽 통로
  await walkTo('b1_back', -3.0, -6.6, -3.0, 9000);
  await p.click('#step5'); await p.waitForTimeout(1000);
  await walkTo('f3_table', -5.4, 7.25, -10.4, 9000);      // 식탁 사이 통로
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

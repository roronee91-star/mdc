const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  const shot = async (n) => { await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${n}.png` }); };
  // 화면에서 캐릭터 머리 위치에 캐릭터가 보이는지: 캐릭터 중심으로 광선 → 첫 충돌이 캐릭터인지
  const visible = () => p.evaluate(() => {
    const {camera, scene, character} = window.__dbg; const R = new (camera.constructor.prototype.constructor === undefined ? 0 : 0);
    return null; });
  const orbit = (az, el, dist) => p.evaluate(([az, el, dist]) => { const {camera,controls,character}=window.__dbg; const t=character.position.clone(); t.y+=0.6; controls.target.copy(t);
    camera.position.set(t.x+dist*Math.cos(el)*Math.sin(az), t.y+dist*Math.sin(el), t.z+dist*Math.cos(el)*Math.cos(az)); }, [az, el, dist]);
  await p.click('#step4'); await shot('o_b1_over');
  await p.click('#btnActionPew'); await p.waitForTimeout(500);
  for (const [i, az] of [0, 1.6, 3.14, 4.7].entries()) { await orbit(az, 0.35, 6); await shot('o_b1_'+i); }
  await p.click('#step5'); await shot('o_f3_over');
  await p.click('#btnActionGroup'); await p.waitForTimeout(500);
  for (const [i, az] of [0, 1.6, 3.14, 4.7].entries()) { await orbit(az, 0.35, 6); await shot('o_g_'+i); }
  await p.click('#btnActionEat'); await p.waitForTimeout(500);
  await orbit(3.5, 0.3, 8); await shot('o_eat');
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

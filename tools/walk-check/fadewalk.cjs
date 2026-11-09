// 벽이 캐릭터를 가리면 투명해지고 다시 돌아오는지(새 셰이더 없이) + 층마다 앞으로 걸어 움직인 거리 · 의자 수. 사용: node fadewalk.cjs [index.html]
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 420, height: 800 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1');
    window.__links = 0; const P = WebGL2RenderingContext.prototype, ol = P.linkProgram; P.linkProgram = function (pr) { window.__links++; return ol.call(this, pr); }; });
  await p.goto('http://127.0.0.1:8008/' + (process.argv[2] || 'index.html') + '?net=local&room=fade', { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(3000);
  await p.evaluate(() => window.__dbg.goTo('step6')); await p.waitForTimeout(5000);
  const F2 = 3.65;
  await p.evaluate((F2) => { window.__dbg.character.position.set(-9.63, F2, -12.0); }, F2);
  const look = async (c) => { await p.evaluate(([c, F2]) => window.__dbg.setCam(c, [-9.63, F2 + 0.85, -12.0]), [c, F2]); await p.waitForTimeout(2500);
    return p.evaluate(() => [window.__links, window.__dbg.faded.map((f) => [f[0], f[1]]).slice(0, 4), window.__dbg.faded.length]); };
  const L0 = await p.evaluate(() => window.__links);
  console.log('behind west wall  :', JSON.stringify(await look([-13.4, F2 + 1.2, -12.0])));
  console.log('inside, clear view:', JSON.stringify(await look([-9.63, F2 + 1.6, -9.6])));
  console.log('behind wall again :', JSON.stringify(await look([-13.4, F2 + 1.2, -12.0])));
  console.log('back inside       :', JSON.stringify(await look([-9.63, F2 + 1.6, -9.6])));
  console.log('new shaders during fade test:', (await p.evaluate(() => window.__links)) - L0);
  // 층마다 걷기: 앞으로 2초 걸어 움직인 거리
  for (const st of ['step1', 'step2', 'step4', 'step5', 'step6', 'step7']) {
    await p.evaluate((s) => window.__dbg.goTo(s), st); await p.waitForTimeout(4000);
    const a = await p.evaluate(() => window.__dbg.character.position.toArray());
    await p.keyboard.down('KeyW'); await p.waitForTimeout(2500); await p.keyboard.up('KeyW'); await p.waitForTimeout(500);
    const c = await p.evaluate(() => window.__dbg.character.position.toArray());
    console.log(st, 'walked', Math.hypot(c[0] - a[0], c[2] - a[2]).toFixed(2), 'm, y', a[1].toFixed(2), '→', c[1].toFixed(2), '| seats here', await p.evaluate(() => window.__dbg.seatsHere().length));
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

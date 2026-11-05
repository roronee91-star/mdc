const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6500);
  const shot = async (n, w) => { await p.waitForTimeout(w || 1200); await p.screenshot({ path: `${out}/${n}.png` }); };
  await shot('1_start');
  for (const st of ['step2','step3','step4','step5']) { await p.click('#'+st); await shot(st); }
  await p.click('#step4'); await p.waitForTimeout(800);
  await p.mouse.click(640, 520); await shot('b1_walk', 2500);
  await p.click('#btnActionPew'); await shot('b1_pew');
  await p.click('#btnActionEat'); await shot('eat');
  await p.click('#btnActionGroup'); await shot('group');
  await p.click('#viewToggle'); await p.click('#step4'); await shot('top_b1');
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

const { chromium, devices } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const errs=[];
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  await p.click('#step4'); await p.waitForTimeout(1200); await p.screenshot({ path: out + '/pc.png' });
  await p.click('#helpToggle'); await p.waitForTimeout(300); await p.screenshot({ path: out + '/pc_help.png' });
  await p.click('#uiToggle'); await p.waitForTimeout(300); await p.screenshot({ path: out + '/pc_hidden.png' });
  const ctx = await b.newContext({ ...devices['iPhone 13'] }); const m = await ctx.newPage(); m.on('pageerror', e => errs.push(e.message));
  await m.goto('http://127.0.0.1:8008/index.html'); await m.waitForTimeout(7000);
  await m.tap('#step4'); await m.waitForTimeout(1200); await m.screenshot({ path: out + '/phone.png' });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

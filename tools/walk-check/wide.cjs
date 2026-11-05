const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6500);
  await p.screenshot({ path: `${out}/0_step1.png` });
  let i = 1;
  for (const st of ['step4','step6','step5','step7']) { await p.click('#'+st); await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/${i++}_${st}.png` }); }
  await p.click('#btnActionPew'); await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/5_pew.png` });
  await p.click('#zoomToggle'); await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/6_pew_near.png` });
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

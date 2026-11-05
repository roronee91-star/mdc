const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') errs.push(m.type()+' '+m.text()); });
  await p.goto('http://127.0.0.1:8008/index.html');
  await p.waitForTimeout(6000);
  await p.screenshot({ path: out + '/s1.png' });
  for (const s of ['step4','step5']) {
    await p.click('#' + s); await p.waitForTimeout(2500);
    await p.screenshot({ path: out + '/' + s + '.png' });
  }
  await p.click('#step4'); await p.waitForTimeout(500);
  await p.click('#btnActionPew'); await p.waitForTimeout(2500);
  await p.screenshot({ path: out + '/pew.png' });
  await p.click('#btnActionEat'); await p.waitForTimeout(2500);
  await p.screenshot({ path: out + '/eat.png' });
  await p.click('#btnActionGroup'); await p.waitForTimeout(2500);
  await p.screenshot({ path: out + '/group.png' });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();

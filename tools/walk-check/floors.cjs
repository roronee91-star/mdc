const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6500);
  const orbit = (az, el, dist) => p.evaluate(([az, el, dist]) => { const {camera,controls,character}=window.__dbg; const t=character.position.clone(); t.y+=0.62; controls.target.copy(t);
    camera.position.set(t.x+dist*Math.cos(el)*Math.sin(az), t.y+dist*Math.sin(el), t.z+dist*Math.cos(el)*Math.cos(az)); }, [az, el, dist]);
  for (const st of ['step2','step3','step6','step7']) {
    await p.click('#'+st); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/${st}_a.png` });
    await orbit(Math.PI, 0.25, 2.5); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/${st}_b.png` });
  }
  console.log(errs.join('\n')||'no errors'); await b.close();
})();

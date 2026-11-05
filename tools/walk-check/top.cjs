const { chromium } = require('playwright');
(async () => {
  const [,, step, cx, cz, h, out] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 1200 } });
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  await p.click('#'+step); await p.waitForTimeout(800);
  await p.evaluate(([cx,cz,h])=>{ const {camera,controls}=window.__dbg; controls.target.set(cx,0,cz); camera.position.set(cx,h,cz+0.01); controls.update(); document.getElementById('ui-overlay').style.display='none'; }, [+cx,+cz,+h]);
  await p.waitForTimeout(800);
  await p.screenshot({ path: out });
  await b.close();
})();

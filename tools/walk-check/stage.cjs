const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 640 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  await p.evaluate(() => { window.__dbg.goTo('step4'); document.getElementById('ui-overlay').style.display = 'none'; }); await p.waitForTimeout(500);
  console.log(JSON.stringify(await p.evaluate(() => { const r = []; window.__dbg.scene.traverse(o => { if (o.isMesh && o.visible && /Stage|Pulpit|Cross|LED/.test(o.name)) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); r.push([o.name, b.min.toArray().map(v => +v.toFixed(2)), b.max.toArray().map(v => +v.toFixed(2))]); } }); return r; })));
  for (const [n, x, z] of [['pulpit_front', -9.6, -13.6], ['stage_top', -11.0, -14.5], ['stage_left', -11.8, -11.5], ['stage_right', -8.5, -15.8]]) {
    const r = await p.evaluate(([x, z]) => { const c = window.__dbg.character.position; const path = window.__dbg.findPath(c.clone(), c.clone().set(x, -6.6, z)); if (!path || !path.length) return 'none'; const e = path[path.length - 1]; return Math.hypot(e.x - x, e.z - z).toFixed(2); }, [x, z]);
    console.log(n, r);
  }
  await p.evaluate(() => window.__dbg.setCam([-6.0, -4.9, -9.0], [-11.0, -6.0, -14.6])); await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/stage_now.png` });
  await p.evaluate(() => { window.__dbg.controls.maxPolarAngle = Math.PI; window.__dbg.setCam([-9.5, 2.0, -13.99], [-9.5, -6.6, -14.0]); }); await p.waitForTimeout(2000); await p.screenshot({ path: `${out}/stage_top.png` });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

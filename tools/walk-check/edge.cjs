const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 600 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', 'a'); } catch (e) {} });
  const p = await ctx.newPage(); await p.goto('http://127.0.0.1:8008/index.html'); await p.waitForTimeout(6000);
  const pos = () => p.evaluate(() => window.__dbg.character.position.toArray().map(v => +v.toFixed(2)));
  const tryDir = async (name, x, z, faceAz) => {
    await p.evaluate(() => window.__dbg.goTo('step7')); await p.waitForTimeout(500);
    await p.evaluate(([x, z, az]) => { const { character: c } = window.__dbg; c.position.set(x, 10.75, z); window.__dbg.setCam([x - Math.sin(az) * 4, 12.6, z - Math.cos(az) * 4], [x, 11.37, z]); }, [x, z, faceAz]);
    await p.waitForTimeout(500);
    await p.keyboard.down('KeyW'); await p.waitForTimeout(5000); await p.keyboard.up('KeyW'); await p.waitForTimeout(300);
    console.log(name, await pos());
  };
  await tryDir('서쪽으로', -10.0, -8.6, -Math.PI / 2);
  await tryDir('동쪽으로', -2.0, -8.6, Math.PI / 2);
  await tryDir('남쪽(계단실 사이)', -8.0, -4.0, 0);
  await tryDir('북쪽(실내 유리)', -7.0, -9.0, Math.PI);
  console.log(await p.evaluate(() => { const r = []; window.__dbg.scene.traverse(o => { if (o.name === 'F3_WEST_EDGE001') { o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); r.push(o.visible, bb.min.toArray().map(v => v.toFixed(2)), bb.max.toArray().map(v => v.toFixed(2))); } }); return JSON.stringify(r); }));
  await b.close();
})();

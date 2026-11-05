const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 800, height: 520 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('mdc_name', '혜연'); } catch (e) {} });
  const p = await ctx.newPage(); await p.goto('http://127.0.0.1:8008/index.html?net=local'); await p.waitForTimeout(6500);
  await p.evaluate(() => document.getElementById('ui-overlay').style.display = 'none');
  for (const [st, y] of [['step4', -6.6], ['stepF1', 0], ['step6', 3.65], ['step5', 7.25], ['step7', 10.75]]) {
    await p.evaluate((k) => window.__dbg.goTo(k), st); await p.waitForTimeout(400);
    await p.evaluate((y) => { window.__dbg.character.visible = false; window.__dbg.setCam([-1.6, y + 1.9, -7.0], [-0.93, y + 1.1, -2.4]); }, y);
    await p.waitForTimeout(1800); await p.screenshot({ path: `${out}/${st}.png` });
    // 엘리베이터 문처럼 생긴 것(회색 금속 판) 개수와 위치
    console.log(st, JSON.stringify(await p.evaluate((y) => { const r = []; window.__dbg.scene.traverse(o => { if (!o.isMesh || !o.visible) return; let vis = true; for (let q = o; q; q = q.parent) if (!q.visible) vis = false; if (!vis) return;
      const c = o.material && o.material.color; if (!c || c.getHex() !== 0xb8bcc2) return; o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if (bb.min.y > y - 0.5 && bb.max.y < y + 3) r.push([+((bb.min.x + bb.max.x) / 2).toFixed(2), +((bb.min.z + bb.max.z) / 2).toFixed(2)]); }); return r; }, y)));
  }
  await b.close();
})();

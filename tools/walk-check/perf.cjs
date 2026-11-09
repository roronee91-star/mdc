// 걸을 때 무게 재기: 장소마다 한 화면 그리기 호출 수(그 중 그림자 지도), 도착할 때 · 걷는 동안 새로 만드는 셰이더 수. 사용: [PAGE=_old.html] node perf.cjs step6,step5
const { chromium } = require('playwright');
(async () => {
  const steps = (process.argv[2] || 'step6').split(',');
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 420, height: 800 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1');
    window.__draws = 0; window.__links = 0; window.__fbDraws = 0; let fb = false;
    const P = WebGL2RenderingContext.prototype; ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced'].forEach((n) => { const o = P[n]; P[n] = function (...a) { window.__draws++; if (fb) window.__fbDraws++; return o.apply(this, a); }; });
    const ob = P.bindFramebuffer; P.bindFramebuffer = function (t, f) { fb = !!f; return ob.call(this, t, f); };
    const ol = P.linkProgram; P.linkProgram = function (pr) { window.__links++; return ol.call(this, pr); }; });
  await p.goto('http://127.0.0.1:8008/' + (process.env.PAGE || 'index.html') + '?net=local&room=perf&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 2000 }); await p.waitForTimeout(4000);
  console.log('programs linked at load:', await p.evaluate(() => window.__links));
  for (const step of steps) {
    const l0 = await p.evaluate(() => window.__links);
    await p.evaluate((s) => window.__dbg.goTo(s), step); await p.waitForTimeout(6000);
    const l1 = await p.evaluate(() => window.__links);
    const fd = await p.evaluate(() => new Promise((res) => { const a = window.__draws, f = window.__fbDraws; requestAnimationFrame(() => requestAnimationFrame(() => res([(window.__draws - a) / 2, (window.__fbDraws - f) / 2]))); }));
    const grp = await p.evaluate(() => { const sc = window.__dbg.scene, cam = window.__dbg.camera, fr = new window.__dbg.camera.constructor().constructor; const out = {};
      const vis = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
      sc.children.forEach((c) => { let n = 0, sh = 0; c.traverse((o) => { if (o.isMesh && vis(o)) { n++; if (o.castShadow) sh++; } }); if (n) out[c.name || c.type] = [n, sh]; }); return out; });
    await p.keyboard.down('KeyW'); await p.waitForTimeout(3000); await p.keyboard.up('KeyW'); await p.keyboard.down('KeyD'); await p.waitForTimeout(2000); await p.keyboard.up('KeyD'); await p.keyboard.down('KeyS'); await p.waitForTimeout(3000); await p.keyboard.up('KeyS');
    const l2 = await p.evaluate(() => window.__links);
    console.log(step, '| new shaders on arrival:', l1 - l0, '| new shaders while walking:', l2 - l1, '| draws/frame total, of which shadow map:', JSON.stringify(fd));
    console.log('   visible meshes [all, shadow-casting] by top group:', JSON.stringify(grp));
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

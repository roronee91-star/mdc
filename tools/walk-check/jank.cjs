// 느린 휴대폰 흉내(CPU 느리게)로 걸을 때 끊김 재기: 화면 사이 시간(보통·가장 긴 것·50ms 넘는 횟수), 층 옮길 때 멈춘 시간, 셰이더 수, 재질 수, 메모리.
// 사용: [PAGE=_old.html] [SLOW=4] node jank.cjs step1,step6
const { chromium } = require('playwright');
(async () => {
  const steps = (process.argv[2] || 'step1,step6').split(',');
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-precise-memory-info'] });
  const ctx = await b.newContext({ viewport: { width: 420, height: 800 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1');
    window.__links = 0; window.__gpp = 0; window.__timers = 0;
    const P = WebGL2RenderingContext.prototype;
    const ol = P.linkProgram; P.linkProgram = function (pr) { window.__links++; return ol.call(this, pr); };
    const og = P.getProgramParameter; P.getProgramParameter = function (...a) { window.__gpp++; return og.apply(this, a); };
    const st = window.setTimeout; window.setTimeout = function (f, t, ...r) { if (t === 10) window.__timers++; return st(f, t, ...r); };
    window.__ft = []; let last = 0; const tick = (t) => { if (last) window.__ft.push(t - last); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    window.__long = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] }); } catch (e) {}
  });
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:8008/' + (process.env.PAGE || 'index.html') + '?net=local&room=perf&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 500 });
  console.log(process.env.PAGE || 'index.html', '| ready after', ((Date.now() - t0) / 1000).toFixed(1), 's');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.SLOW || 4) });
  const stat = async (label) => {
    const r = await p.evaluate(() => { const f = window.__ft.splice(0).sort((a, b) => a - b), n = f.length; const lg = window.__long.splice(0);
      let mats = new Set(), fm = 0; window.__dbg.scene.traverse((o) => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m)); } if (o.userData && o.userData.fadeMat) fm++; });
      return { frames: n, med: n ? +f[n >> 1].toFixed(0) : 0, p95: n ? +f[Math.floor(n * 0.95)].toFixed(0) : 0, max: n ? +f[n - 1].toFixed(0) : 0, over100: f.filter((x) => x > 100).length, over250: f.filter((x) => x > 250).length,
        longTasks: lg.length, longSum: lg.reduce((a, c) => a + c, 0), longMax: Math.max(0, ...lg), links: window.__links, gpp: window.__gpp, t10: window.__timers, mats: mats.size, fadeMats: fm, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }; });
    console.log(label.padEnd(22), JSON.stringify(r));
  };
  const walk = async (ms) => { const seq = [['KeyW', 0.3], ['KeyD', 0.2], ['KeyS', 0.3], ['KeyA', 0.2]]; for (const [k, fr] of seq) { await p.keyboard.down(k); await p.waitForTimeout(ms * fr); await p.keyboard.up(k); } };
  await p.waitForTimeout(3000); await stat('after load 3s');
  await walk(12000); await stat('walk#1 12s');
  await walk(12000); await stat('walk#2 12s');
  for (const step of steps) {
    const dt = await p.evaluate((s) => { const a = performance.now(); window.__dbg.goTo(s); return Math.round(performance.now() - a); }, step);
    console.log('--', step, 'goTo blocked for', dt, 'ms');
    await p.waitForTimeout(1500); await stat(step + ' arrive 1.5s');
    await walk(12000); await stat(step + ' walk#1 12s');
    await walk(12000); await stat(step + ' walk#2 12s');
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

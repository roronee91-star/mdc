// 화면 한 장마다 자바스크립트가 쓰는 시간 재기(느린 휴대폰 흉내). 사용: [PAGE=_old.html] [SLOW=4] node cbtime.cjs step1,step6
const { chromium } = require('playwright');
(async () => {
  const steps = (process.argv[2] || 'step1').split(',');
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 200, height: 360 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  await p.addInitScript(() => { localStorage.setItem('mdc_name', '혜연'); localStorage.setItem('mdc_gender', 'f'); localStorage.setItem('mdc_bgm_off', '1');
    window.__cb = []; window.__draws = 0; window.__tris = 0; const o = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => o((t) => { const a = performance.now(); cb(t); window.__cb.push(performance.now() - a); });
    const P = WebGL2RenderingContext.prototype; const od = P.drawElements; P.drawElements = function (m, c, ...r) { window.__draws++; window.__tris += c / 3; return od.call(this, m, c, ...r); };
    const oa = P.drawArrays; P.drawArrays = function (m, f, c) { window.__draws++; window.__tris += c / 3; return oa.call(this, m, f, c); }; });
  await p.goto('http://127.0.0.1:8008/' + (process.env.PAGE || 'index.html') + '?net=local&room=perf&time=' + (process.env.T || 'day'), { waitUntil: 'commit', timeout: 120000 });
  await p.waitForFunction(() => window.__dbg && window.__dbg.furn, null, { timeout: 400000, polling: 500 });
  await p.waitForTimeout(3000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.SLOW || 4) });
  const walk = async (ms) => { const seq = [['KeyW', 0.3], ['KeyD', 0.2], ['KeyS', 0.3], ['KeyA', 0.2]]; for (const [k, fr] of seq) { await p.keyboard.down(k); await p.waitForTimeout(ms * fr); await p.keyboard.up(k); } };
  const stat = async (label) => { const r = await p.evaluate(() => { const f = window.__cb.splice(0).sort((a, b) => a - b), n = f.length, d = window.__draws, t = window.__tris; window.__draws = 0; window.__tris = 0;
      const sc = window.__dbg.scene; const L = {}; sc.traverseVisible((o) => { if (o.isLight) { const k = o.type.replace('Light', '') + (o.castShadow ? '*' : ''); L[k] = (L[k] || 0) + 1; } });
      return { frames: n, med: n ? +f[n >> 1].toFixed(1) : 0, p90: n ? +f[Math.floor(n * 0.9)].toFixed(1) : 0, max: n ? +f[n - 1].toFixed(0) : 0, over50: f.filter((x) => x > 50).length, draws: n ? Math.round(d / n) : 0, ktris: n ? Math.round(t / n / 1000) : 0, lights: L }; });
    console.log(label.padEnd(16), JSON.stringify(r)); };
  for (const step of steps) {
    if (step !== 'step1') { const dt = await p.evaluate((s) => { const a = performance.now(); window.__dbg.goTo(s); return Math.round(performance.now() - a); }, step); console.log('--', step, 'goTo blocked', dt, 'ms'); }
    await p.waitForTimeout(5000); await p.evaluate(() => { window.__cb.length = 0; window.__draws = 0; window.__tris = 0; });
    await p.waitForTimeout(6000); await stat(step + ' stand');
    await walk(10000); await stat(step + ' walk1');
    await walk(10000); await stat(step + ' walk2');
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
